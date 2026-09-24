
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getNextAdaptiveQuestion } from "../controller/adaptiveController.js";

const router = express.Router();

router.get("/next", protect, getNextAdaptiveQuestion);

export default router;