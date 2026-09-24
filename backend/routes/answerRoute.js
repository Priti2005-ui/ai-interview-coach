
import express from "express";
import { evaluateAnswer } from "../controller/aiEvaluationContoller.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/evaluate", protect, evaluateAnswer);

export default router;