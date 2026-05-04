import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, unique: true },
    email: String,
    password: String,
    avatar: String,
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
