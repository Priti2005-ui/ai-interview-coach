
import express from "express";
import {
  generateQuestions,
  generateExplanation,
} from "../controller/aiController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/questions/generate", protect, generateQuestions);
router.post("/explanations/generate", protect, generateExplanation);

export default router;

