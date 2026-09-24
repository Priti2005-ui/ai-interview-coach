import mongoose from "mongoose";

const topicPerformanceSchema = new mongoose.Schema(
  {
    topic: {
      type: String,
      required: true,
    },

    averageScore: {
      type: Number,
      default: 0,
    },

    totalQuestions: {
      type: Number,
      default: 0,
    },

    strengths: {
      type: [String],
      default: [],
    },

    weaknesses: {
      type: [String],
      default: [],
    },

    weaknessPriority: {
      type: Number,
      default: 1,
    },

    confidenceLevel: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },

    recommendedDifficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },

    lastDifficultySolved: {
      type: String,
      enum: ["easy", "medium", "hard"],
    },

    lastPracticed: {
      type: Date,
    },
  },
  { _id: false }
);

const skillProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    targetRole: {
      type: String,
      default: "",
    },

    preferredTopics: {
      type: [String],
      default: [],
    },

    topics: {
      type: [topicPerformanceSchema],
      default: [],
    },

    overallScore: {
      type: Number,
      default: 0,
    },

    accuracyRate: {
      type: Number,
      default: 0,
    },

    strongestTopics: {
      type: [String],
      default: [],
    },

    weakestTopics: {
      type: [String],
      default: [],
    },

    totalSessions: {
      type: Number,
      default: 0,
    },

    totalQuestionsAttempted: {
      type: Number,
      default: 0,
    },

    averageResponseTime: {
      type: Number,
      default: 0,
    },

    improvementRate: {
      type: Number,
      default: 0,
    },

    aiRecommendations: {
      type: [String],
      default: [],
    },

    scoreHistory: [
      {
        score: Number,
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("SkillProfile", skillProfileSchema);
