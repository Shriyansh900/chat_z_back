import Chat from '../models/Chat.model.js';
import FriendRequest from '../models/FriendRequest.model.js';

// POST /api/chats
// Create or fetch a 1-on-1 chat — only allowed between accepted friends
export const accessChat = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }

    // Check accepted friendship exists between the two users
    const friendship = await FriendRequest.findOne({
      $or: [
        { sender: req.user.id, receiver: userId },
        { sender: userId, receiver: req.user.id },
      ],
      status: 'accepted',
    });

    if (!friendship) {
      return res
        .status(403)
        .json({ message: 'You can only chat with accepted friends' });
    }

    // Check if a 1-on-1 chat already exists
    // MongoDB $size doesn't work with $all reliably, so fetch and filter in code
    let chat = await Chat.findOne({
      isGroup: false,
      users: { $all: [req.user.id, userId] },
    }).populate('users', '-password');

    // Ensure it's exactly a 1-on-1 chat (exactly 2 users)
    if (chat && chat.users.length !== 2) {
      chat = null;
    }

    if (chat) return res.json(chat);

    // Create new chat
    chat = await Chat.create({ users: [req.user.id, userId], isGroup: false });
    chat = await chat.populate('users', '-password');

    res.status(201).json(chat);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/chats
// Get all chats for the logged-in user
export const getUserChats = async (req, res) => {
  try {
    const chats = await Chat.find({ users: req.user.id })
      .populate('users', '-password')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });

    res.json(chats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
