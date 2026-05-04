import Message from '../models/Message.model.js';
import Chat from '../models/Chat.model.js';

// POST /api/messages
// Send a message to a chat
export const sendMessage = async (req, res) => {
  try {
    const { chatId, content } = req.body;

    if (!chatId || (!content && !req.file)) {
      return res
        .status(400)
        .json({ message: 'chatId and content or file are required' });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    // Ensure the user is a member of the chat
    if (!chat.users.map(String).includes(req.user.id)) {
      return res.status(403).json({ message: 'Not a member of this chat' });
    }

    const messageData = {
      sender: req.user.id,
      chat: chatId,
      content: content || '',
    };

    if (req.file) {
      messageData.file = req.file.filename;
    }

    let message = await Message.create(messageData);
    message = await message.populate('sender', 'username avatar');
    message = await message.populate('chat');

    // Touch the chat's updatedAt so chats sort by latest message
    await Chat.findByIdAndUpdate(chatId, { updatedAt: new Date() });

    res.status(201).json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/messages/:chatId
// Get all messages for a chat
export const getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    if (!chat.users.map(String).includes(req.user.id)) {
      return res.status(403).json({ message: 'Not a member of this chat' });
    }

    const messages = await Message.find({ chat: chatId })
      .populate('sender', 'username avatar')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
