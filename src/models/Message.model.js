import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" },
    content: String,
    file: String,
  },
  { timestamps: true }
);

export default mongoose.model("Message", messageSchema);
