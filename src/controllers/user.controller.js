import User from '../models/User.model.js';

export const searchUsers = async (req, res) => {
  try {
    const keyword = req.query.search;

    if (!keyword) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const users = await User.find({
      username: { $regex: keyword, $options: 'i' },
    }).select('-password');

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
