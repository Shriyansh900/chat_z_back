import FriendRequest from '../models/FriendRequest.model.js';
import User from '../models/User.model.js';

// POST /api/friends/request
// Send a friend request
export const sendFriendRequest = async (req, res) => {
  try {
    const { receiverId } = req.body;

    if (!receiverId) {
      return res.status(400).json({ message: 'receiverId is required' });
    }

    if (receiverId === req.user.id) {
      return res
        .status(400)
        .json({ message: 'Cannot send request to yourself' });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) return res.status(404).json({ message: 'User not found' });

    const existing = await FriendRequest.findOne({
      sender: req.user.id,
      receiver: receiverId,
      status: 'pending',
    });
    if (existing) {
      return res.status(409).json({ message: 'Friend request already sent' });
    }

    const request = await FriendRequest.create({
      sender: req.user.id,
      receiver: receiverId,
    });

    await request.populate('sender receiver', 'username avatar');

    res.status(201).json(request);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/friends/requests
// Get all pending incoming friend requests for the logged-in user
export const getFriendRequests = async (req, res) => {
  try {
    const requests = await FriendRequest.find({
      receiver: req.user.id,
      status: 'pending',
    }).populate('sender', 'username avatar');

    res.json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/friends/request/:id
// Accept or reject a friend request  (body: { action: "accept" | "reject" })
export const respondToRequest = async (req, res) => {
  try {
    const { action } = req.body;

    if (!['accept', 'reject'].includes(action)) {
      return res
        .status(400)
        .json({ message: "action must be 'accept' or 'reject'" });
    }

    const request = await FriendRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    if (String(request.receiver) !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    request.status = action === 'accept' ? 'accepted' : 'rejected';
    await request.save();

    res.json(request);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/friends
// Get all accepted friends of the logged-in user
export const getFriends = async (req, res) => {
  try {
    const requests = await FriendRequest.find({
      $or: [{ sender: req.user.id }, { receiver: req.user.id }],
      status: 'accepted',
    }).populate('sender receiver', 'username avatar email');

    const friends = requests.map((r) =>
      String(r.sender._id) === req.user.id ? r.receiver : r.sender,
    );

    res.json(friends);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/friends/:userId
// Remove an accepted friend
export const unfriend = async (req, res) => {
  try {
    const result = await FriendRequest.findOneAndDelete({
      $or: [
        { sender: req.user.id, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.user.id },
      ],
      status: 'accepted',
    });

    if (!result) {
      return res.status(404).json({ message: 'Friendship not found' });
    }

    res.json({ message: 'Friend removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
