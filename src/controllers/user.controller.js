import User from '../models/User.model.js';
import RefreshToken from '../models/RefreshToken.model.js';
import FriendRequest from '../models/FriendRequest.model.js';
import Chat from '../models/Chat.model.js';
import Message from '../models/Message.model.js';
import Group from '../models/Group.model.js';
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from '../utils/uploadToCloudinary.js';

// Escape special regex characters to prevent injection
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ─── SEARCH USERS ────────────────────────────────────────────────────────────
// GET /api/users/search?search=<query>
export const searchUsers = async (req, res) => {
  try {
    const keyword = req.query.search;

    if (!keyword || keyword.trim().length < 1) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const users = await User.find({
      _id: { $ne: req.user.id },
      blockedUsers: { $nin: [req.user.id] }, // don't show users who blocked you
      username: { $regex: escapeRegex(keyword.trim()), $options: 'i' },
    }).select('-password -blockedUsers');

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── GET MY PROFILE ──────────────────────────────────────────────────────────
// GET /api/users/me
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── GET USER BY ID ──────────────────────────────────────────────────────────
// GET /api/users/:userId
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select(
      '-password -avatarPublicId',
    );

    if (!user) return res.status(404).json({ message: 'User not found' });

    // Don't expose profile to someone they've blocked
    if (user.blockedUsers?.map(String).includes(req.user.id)) {
      return res.status(403).json({ message: 'User not found' });
    }

    // Strip blockedUsers from response
    const userObj = user.toObject();
    delete userObj.blockedUsers;

    res.json(userObj);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── UPDATE PROFILE ──────────────────────────────────────────────────────────
// PUT /api/users/me
export const updateProfile = async (req, res) => {
  try {
    const { username, bio } = req.body;
    const updates = {};

    if (username) {
      const taken = await User.findOne({ username, _id: { $ne: req.user.id } });
      if (taken) {
        return res.status(409).json({ message: 'Username already taken' });
      }
      updates.username = username.trim();
    }

    if (bio !== undefined) updates.bio = bio;

    if (req.file) {
      const existing = await User.findById(req.user.id).select(
        'avatarPublicId',
      );
      if (existing?.avatarPublicId) {
        await deleteFromCloudinary(existing.avatarPublicId);
      }
      const result = await uploadToCloudinary(req.file.buffer, {
        folder: 'chatz/avatars',
        transformation: [
          { width: 300, height: 300, crop: 'fill', gravity: 'face' },
        ],
      });
      updates.avatar = result.secure_url;
      updates.avatarPublicId = result.public_id;
    }

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
    }).select('-password');

    res.json({ message: 'Profile updated', user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── DELETE PROFILE ──────────────────────────────────────────────────────────
// DELETE /api/users/me
export const deleteProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.avatarPublicId) {
      await deleteFromCloudinary(user.avatarPublicId);
    }

    await Promise.all([
      RefreshToken.deleteMany({ user: req.user.id }),
      FriendRequest.deleteMany({
        $or: [{ sender: req.user.id }, { receiver: req.user.id }],
      }),
      Message.deleteMany({ sender: req.user.id }),
      Chat.updateMany(
        { users: req.user.id },
        { $pull: { users: req.user.id } },
      ),
      Group.deleteMany({ admin: req.user.id }),
      Group.updateMany(
        { members: req.user.id },
        { $pull: { members: req.user.id } },
      ),
      User.findByIdAndDelete(req.user.id),
    ]);

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── BLOCK USER ──────────────────────────────────────────────────────────────
// POST /api/users/:userId/block
export const blockUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (userId === req.user.id) {
      return res.status(400).json({ message: 'Cannot block yourself' });
    }

    const target = await User.findById(userId);
    if (!target) return res.status(404).json({ message: 'User not found' });

    await User.findByIdAndUpdate(req.user.id, {
      $addToSet: { blockedUsers: userId },
    });

    res.json({ message: 'User blocked' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── UNBLOCK USER ────────────────────────────────────────────────────────────
// DELETE /api/users/:userId/block
export const unblockUser = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { blockedUsers: req.params.userId },
    });

    res.json({ message: 'User unblocked' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── GET BLOCKED USERS ───────────────────────────────────────────────────────
// GET /api/users/me/blocked
export const getBlockedUsers = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('blockedUsers')
      .populate('blockedUsers', 'username avatar');

    res.json(user.blockedUsers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
