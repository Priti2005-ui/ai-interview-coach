import express from "express";
import { protect } from "../middleware/authMiddleware.js";

import {
  getDashboardAnalytics,
  getWeakTopicAnalytics,
  getPerformanceTrend,
} from "../controller/analyticsController.js";

const router = express.Router();

router.get("/dashboard", protect, getDashboardAnalytics);

router.get("/weak-topics", protect, getWeakTopicAnalytics);

router.get("/performance-trend", protect, getPerformanceTrend);

export default router;