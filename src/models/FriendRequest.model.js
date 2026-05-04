import mongoose from "mongoose";

const schema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: { type: String, default: "pending" },
});

export default mongoose.model("FriendRequest", schema);
