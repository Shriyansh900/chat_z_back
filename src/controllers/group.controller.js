import Group from '../models/Group.model.js';
import Chat from '../models/Chat.model.js';

// POST /api/groups
// Create a group (also creates a linked group chat)
export const createGroup = async (req, res) => {
  try {
    const { name, description, members } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Group name is required' });
    }

    const allMembers = [...new Set([req.user.id, ...(members || [])])];

    // Create the underlying chat for the group
    const chat = await Chat.create({ users: allMembers, isGroup: true });

    const group = await Group.create({
      name,
      description: description || '',
      admin: req.user.id,
      members: allMembers,
      chat: chat._id,
    });

    await group.populate('admin members', 'username avatar');

    res.status(201).json(group);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/groups
// Get all groups the logged-in user belongs to
export const getMyGroups = async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user.id })
      .populate('admin members', 'username avatar')
      .sort({ createdAt: -1 });

    res.json(groups);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/groups/:id
// Get a single group by ID
export const getGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id).populate(
      'admin members',
      'username avatar',
    );

    if (!group) return res.status(404).json({ message: 'Group not found' });

    if (!group.members.map((m) => String(m._id)).includes(req.user.id)) {
      return res.status(403).json({ message: 'Not a member of this group' });
    }

    res.json(group);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/groups/:id/members
// Add members to a group (admin only)
export const addMembers = async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!userIds || !userIds.length) {
      return res.status(400).json({ message: 'userIds array is required' });
    }

    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    if (String(group.admin) !== req.user.id) {
      return res.status(403).json({ message: 'Only admin can add members' });
    }

    const newMembers = userIds.filter(
      (id) => !group.members.map(String).includes(id),
    );

    group.members.push(...newMembers);
    await group.save();

    // Also add to the linked chat
    await Chat.findByIdAndUpdate(group.chat, {
      $addToSet: { users: { $each: newMembers } },
    });

    await group.populate('admin members', 'username avatar');
    res.json(group);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/groups/:id/members/:userId
// Remove a member from a group (admin only)
export const removeMember = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    if (String(group.admin) !== req.user.id) {
      return res.status(403).json({ message: 'Only admin can remove members' });
    }

    if (String(group.admin) === req.params.userId) {
      return res.status(400).json({ message: 'Cannot remove the admin' });
    }

    group.members = group.members.filter(
      (m) => String(m) !== req.params.userId,
    );
    await group.save();

    await Chat.findByIdAndUpdate(group.chat, {
      $pull: { users: req.params.userId },
    });

    await group.populate('admin members', 'username avatar');
    res.json(group);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/groups/:id/leave
// Leave a group (non-admin members only)
export const leaveGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    if (!group.members.map(String).includes(req.user.id)) {
      return res
        .status(400)
        .json({ message: 'You are not a member of this group' });
    }

    if (String(group.admin) === req.user.id) {
      return res.status(400).json({
        message:
          'Admin cannot leave. Transfer admin role first or delete the group.',
      });
    }

    group.members = group.members.filter((m) => String(m) !== req.user.id);
    await group.save();

    await Chat.findByIdAndUpdate(group.chat, { $pull: { users: req.user.id } });

    res.json({ message: 'Left the group' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/groups/:id/admin
// Transfer admin role to another member (current admin only)
export const changeAdmin = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }

    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    if (String(group.admin) !== req.user.id) {
      return res
        .status(403)
        .json({ message: 'Only admin can transfer admin role' });
    }

    if (!group.members.map(String).includes(userId)) {
      return res
        .status(400)
        .json({ message: 'New admin must be a member of the group' });
    }

    group.admin = userId;
    await group.save();

    await group.populate('admin members', 'username avatar');
    res.json(group);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/groups/:id
// Delete a group entirely (admin only)
export const deleteGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    if (String(group.admin) !== req.user.id) {
      return res
        .status(403)
        .json({ message: 'Only admin can delete the group' });
    }

    await Promise.all([
      Chat.findByIdAndDelete(group.chat),
      Group.findByIdAndDelete(req.params.id),
    ]);

    res.json({ message: 'Group deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
