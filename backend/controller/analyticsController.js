import mongoose from "mongoose";
import Session from "../model/Session.js";
import AnswerAttempt from "../model/AnswerAttempt.js";
import SkillProfile from "../model/SkillProfile.js";
import asyncHandler from "../utils/asyncHandler.js";

const GENERIC_TOPICS = new Set(["technical", "behavioral", "mcq", "general"]);

/**
 * GET /api/v1/analytics/dashboard
 */
export const getDashboardAnalytics = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const [
    totalSessions,
    completedSessions,
    totalAttempts,
    averageScoreResult,
    averageTimeResult,
    recentAttempts,
    skillProfile,
  ] = await Promise.all([
    Session.countDocuments({ user: userId }),

    Session.countDocuments({
      user: userId,
      status: "completed",
    }),

    AnswerAttempt.countDocuments({
      user: userId,
    }),

    AnswerAttempt.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $group: {
          _id: null,
          avgScore: {
            $avg: "$aiEvaluation.score",
          },
        },
      },
    ]),

    AnswerAttempt.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $group: {
          _id: null,
          avgTime: {
            $avg: "$timeTaken",
          },
        },
      },
    ]),

    AnswerAttempt.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("question", "question difficulty")
      .populate("session", "jobRole"),

    SkillProfile.findOne({ user: userId }),
  ]);

  const averageScore = averageScoreResult?.[0]?.avgScore || 0;
  const averageResponseTime = averageTimeResult?.[0]?.avgTime || 0;

  const scoreTrend = (skillProfile?.scoreHistory || []).map((item) => ({
    score: item.score,
    date: item.date,
  }));

  const topicPerformance =
    skillProfile?.topics
      ?.filter(
        (topic) =>
          topic?.topic &&
          !GENERIC_TOPICS.has(String(topic.topic).toLowerCase())
      )
      .map((topic) => ({
        topic: topic.topic,
        averageScore: topic.averageScore,
        totalQuestions: topic.totalQuestions,
        confidenceLevel: topic.confidenceLevel,
        recommendedDifficulty: topic.recommendedDifficulty,
      })) || [];

  const strengths = (skillProfile?.strongestTopics || []).filter(
    (t) => t && !GENERIC_TOPICS.has(String(t).toLowerCase())
  );

  const weaknesses = (skillProfile?.weakestTopics || []).filter(
    (t) => t && !GENERIC_TOPICS.has(String(t).toLowerCase())
  );

  const latestRecommendations = skillProfile?.aiRecommendations || [];

  return res.status(200).json({
    success: true,
    data: {
      overview: {
        totalSessions,
        completedSessions,
        totalAttempts,
        averageScore: Number(averageScore.toFixed(2)),
        averageResponseTime: Number(averageResponseTime.toFixed(2)),
      },

      skillInsights: {
        strongestTopics: strengths,
        weakestTopics: weaknesses,
        overallScore: skillProfile?.overallScore || 0,
        accuracyRate: skillProfile?.accuracyRate || 0,
        improvementRate: skillProfile?.improvementRate || 0,
      },

      topicPerformance,

      scoreTrend,

      recommendations: latestRecommendations,

      recentActivity: recentAttempts.map((attempt) => ({
        id: attempt._id,
        question: attempt.question?.question || "",
        role: attempt.session?.jobRole || "",
        score: attempt.aiEvaluation?.score || 0,
        difficulty: attempt.question?.difficulty || "medium",
        createdAt: attempt.createdAt,
      })),
    },
  });
});

/**
 * GET /api/v1/analytics/weak-topics
 */
export const getWeakTopicAnalytics = asyncHandler(async (req, res) => {
  const profile = await SkillProfile.findOne({
    user: req.user._id,
  });

  if (!profile) {
    return res.status(404).json({
      success: false,
      message: "Skill profile not found",
    });
  }

  const weakTopics =
    (profile.topics || [])
      .filter(
        (t) =>
          t?.topic &&
          !GENERIC_TOPICS.has(String(t.topic).toLowerCase()) &&
          (t.averageScore || 0) < 50
      )
      .sort((a, b) => (a.averageScore || 0) - (b.averageScore || 0));

  return res.status(200).json({
    success: true,
    data: weakTopics,
  });
});

/**
 * GET /api/v1/analytics/performance-trend
 */
export const getPerformanceTrend = asyncHandler(async (req, res) => {
  const attempts = await AnswerAttempt.find({
    user: req.user._id,
  })
    .sort({ createdAt: 1 })
    .select("aiEvaluation.score createdAt");

  const trend = attempts.map((a) => ({
    score: a.aiEvaluation?.score || 0,
    date: a.createdAt,
  }));

  return res.status(200).json({
    success: true,
    data: trend,
  });
});