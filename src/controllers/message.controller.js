import Message from '../models/Message.model.js';
import Chat from '../models/Chat.model.js';
import { uploadToCloudinary } from '../utils/uploadToCloudinary.js';

// POST /api/messages
// Send an E2E encrypted message
//
// For 1-on-1 chats:
//   body: { chatId, content, senderContent }
//   - content       = message encrypted with RECIPIENT's public key (base64)
//   - senderContent = same message encrypted with SENDER's own public key (so sender can read history)
//
// For group chats:
//   body: { chatId, groupEncrypted: [{ userId, encryptedContent }], senderContent }
//   - groupEncrypted = array of per-member encrypted copies
//
// File messages (unencrypted file path, optional):
//   multipart/form-data with file field
export const sendMessage = async (req, res) => {
  try {
    const { chatId, content, senderContent, groupEncrypted } = req.body;

    if (!chatId) {
      return res.status(400).json({ message: 'chatId is required' });
    }

    const hasContent = content || (groupEncrypted && groupEncrypted.length > 0);
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
      // Group: store per-member encrypted copies
      messageData.groupEncrypted = groupEncrypted || [];
      messageData.senderContent = senderContent || '';
    } else {
      // 1-on-1: store recipient's copy + sender's copy
      messageData.content = content || '';
      messageData.senderContent = senderContent || '';
    }

    if (req.file) {
      // Detect resource type for Cloudinary (image vs raw file vs video)
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
// Returns encrypted messages — client decrypts them locally
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

    // For each message, return only the encrypted copy relevant to this user:
    // - If sender: return senderContent
    // - If recipient (1-on-1): return content
    // - If group member: return their specific groupEncrypted entry
    const userId = req.user.id;

    const filtered = messages.map((msg) => {
      const m = msg.toObject();

      if (String(m.sender._id) === userId) {
        // Sender reads their own copy
        m.myContent = m.senderContent;
      } else if (m.chat.isGroup || chat.isGroup) {
        // Group: find this user's encrypted copy
        const entry = m.groupEncrypted?.find(
          (e) => String(e.userId) === userId,
        );
        m.myContent = entry?.encryptedContent || null;
      } else {
        // 1-on-1 recipient
        m.myContent = m.content;
      }

      // Strip raw encrypted fields — client only needs myContent
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
