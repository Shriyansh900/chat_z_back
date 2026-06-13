import Message from '../models/Message.model.js';
import Chat from '../models/Chat.model.js';
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from '../utils/uploadToCloudinary.js';
import { getIo } from '../config/socket.js';
import { createAndSend } from '../services/notification.service.js';

// POST /api/messages
export const sendMessage = async (req, res) => {
  try {
    const { chatId, content } = req.body;

    if (!chatId) {
      return res.status(400).json({ message: 'chatId is required' });
    }

    if (!content && !req.file) {
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
      content: content || '',
    };

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
    message = await message.populate('sender', 'username avatar');
    message = await message.populate('chat');

    await Chat.findByIdAndUpdate(chatId, {
      $set: { lastMessage: message._id, updatedAt: new Date() },
    });

    // Emit real-time event to all members in the chat room
    try {
      getIo().to(chatId).emit('receive_message', message);
    } catch (e) {
      console.error('[SOCKET] Failed to emit receive_message:', e.message);
    }

    // Send a notification to every chat member except the sender
    const recipientIds = chat.users
      .map(String)
      .filter((id) => id !== req.user.id);

    recipientIds.forEach((recipientId) => {
      createAndSend({
        userId: recipientId,
        senderId: req.user.id,
        type: 'message',
        title: message.sender.username,
        body: message.content
          ? message.content.slice(0, 100)
          : '📎 Sent an attachment',
      }).catch((err) =>
        console.error('[NOTIF] message notification failed:', err.message),
      );
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
      .populate('sender', 'username avatar')
      .sort({ createdAt: 1 });

    res.json(messages);
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

    // Emit real-time deletion event to the chat room
    try {
      getIo()
        .to(String(message.chat))
        .emit('message_deleted', {
          messageId: req.params.messageId,
          chatId: String(message.chat),
        });
    } catch (e) {
      console.error('[SOCKET] Failed to emit message_deleted:', e.message);
    }

    res.json({ message: 'Message deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
