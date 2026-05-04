import Chat from '../models/Chat.model.js';

// POST /api/chats
// Create or fetch a 1-on-1 chat between logged-in user and another user
export const accessChat = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }

    // Check if a 1-on-1 chat already exists
    let chat = await Chat.findOne({
      isGroup: false,
      users: { $all: [req.user.id, userId], $size: 2 },
    }).populate('users', '-password');

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
      .sort({ updatedAt: -1 });

    res.json(chats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
