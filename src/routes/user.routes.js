import express from "express";
import { searchUsers } from "../controllers/user.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/search", protect, searchUsers);

export default router;
