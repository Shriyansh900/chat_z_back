import Message from '../models/Message.model.js';
import Chat from '../models/Chat.model.js';
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from '../utils/uploadToCloudinary.js';

// POST /api/messages
export const sendMessage = async (req, res) => {
  try {
    const { chatId, content, senderContent } = req.body;

    // groupEncrypted may arrive as JSON string in multipart/form-data
    let groupEncrypted = req.body.groupEncrypted;
    if (typeof groupEncrypted === 'string') {
      try {
        groupEncrypted = JSON.parse(groupEncrypted);
      } catch {
        groupEncrypted = [];
      }
    }

    if (!chatId) {
      return res.status(400).json({ message: 'chatId is required' });
    }

    const hasContent =
      content || (Array.isArray(groupEncrypted) && groupEncrypted.length > 0);
    if (!hasContent && !req.file) {
      return res.status(400).json({ message: 'content or file is required' });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    if (!chat.users.map(String).includes(req.user.id)) {
      return res.status(403).json({ message: 'Not a member of this chat' });
    }

    const messageData = {
      sender: req.user.id,
      chat: chatId,
      isEncrypted: true,
    };

    if (chat.isGroup) {
      messageData.groupEncrypted = groupEncrypted || [];
      messageData.senderContent = senderContent || '';
    } else {
      messageData.content = content || '';
      messageData.senderContent = senderContent || '';
    }

    if (req.file) {
      const mime = req.file.mimetype;
      let resourceType = 'raw';
      if (mime.startsWith('image/')) resourceType = 'image';
      else if (mime.startsWith('video/') || mime.startsWith('audio/'))
        resourceType = 'video';

      const result = await uploadToCloudinary(req.file.buffer, {
        folder: 'chatz/files',
        resource_type: resourceType,
      });
      messageData.file = result.secure_url;
      messageData.filePublicId = result.public_id;
      messageData.fileType = resourceType;
    }

    let message = await Message.create(messageData);
    message = await message.populate('sender', 'username avatar publicKey');
    message = await message.populate('chat');

    await Chat.findByIdAndUpdate(chatId, {
      $set: { lastMessage: message._id, updatedAt: new Date() },
    });

    res.status(201).json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/messages/:chatId
export const getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    if (!chat.users.map(String).includes(req.user.id)) {
      return res.status(403).json({ message: 'Not a member of this chat' });
    }

    const messages = await Message.find({ chat: chatId })
      .populate('sender', 'username avatar publicKey')
      .sort({ createdAt: 1 });

    const userId = req.user.id;
    // Use chat.isGroup from the already-fetched chat document (not from populated message.chat)
    const isGroupChat = chat.isGroup;

    const filtered = messages.map((msg) => {
      const m = msg.toObject();

      if (String(m.sender._id) === userId) {
        m.myContent = m.senderContent;
      } else if (isGroupChat) {
        const entry = m.groupEncrypted?.find(
          (e) => String(e.userId) === userId,
        );
        m.myContent = entry?.encryptedContent || null;
      } else {
        m.myContent = m.content;
      }

      delete m.content;
      delete m.senderContent;
      delete m.groupEncrypted;

      return m;
    });

    res.json(filtered);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/messages/:messageId
// Sender can delete their own message
export const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });

    if (String(message.sender) !== req.user.id) {
      return res
        .status(403)
        .json({ message: 'You can only delete your own messages' });
    }

    // Delete file from Cloudinary if attached
    if (message.filePublicId) {
      await deleteFromCloudinary(
        message.filePublicId,
        message.fileType || 'raw',
      );
    }

    await message.deleteOne();

    // If this was the lastMessage, clear it from the chat
    await Chat.updateOne(
      { lastMessage: req.params.messageId },
      { $set: { lastMessage: null } },
    );

    res.json({ message: 'Message deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
