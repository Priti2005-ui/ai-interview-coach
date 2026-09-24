
import express from "express";
import {
  createSession,
  getSessionById,
  getMySession,
  deleteSession,
  endSession,
} from "../controller/sessionController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createSession);
router.get("/my-session", protect, getMySession);
router.patch("/:id/end", protect, endSession);
router.get("/:id", protect, getSessionById);
router.delete("/:id", protect, deleteSession);

export default router;

