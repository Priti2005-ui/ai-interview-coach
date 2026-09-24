import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    jobRole: {
      type: String,
      required: true,
    },

    experienceLevel: {
      type: String,
      enum: ["fresher", "junior", "mid", "senior"],
      required: true,
    },

    mode: {
      type: String,
      enum: ["practice", "mock", "resume-based"],
      default: "practice",
    },

    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },

    topicsToFocus: {
      type: [String],
      default: [],
    },

    description: {
      type: String,
      default: "",
    },

    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
      },
    ],

    status: {
      type: String,
      enum: ["active", "completed", "paused"],
      default: "active",
    },

    currentQuestionIndex: {
      type: Number,
      default: 0,
    },

    completedQuestions: {
      type: Number,
      default: 0,
    },

    score: {
      type: Number,
      default: 0,
    },

    totalQuestions: {
      type: Number,
      default: 0,
    },

    lastActivityAt: {
      type: Date,
      default: Date.now,
    },

    startedAt: {
      type: Date,
    },

    endedAt: {
      type: Date,
    },

    source: {
      type: String,
      enum: ["manual", "resume", "template"],
      default: "manual",
    },

    aiMeta: {
      model: { type: String, default: "gemini" },
      temperature: { type: Number, default: 0.7 },
    },
  },
  {
    timestamps: true,
  }
);

sessionSchema.index({ user: 1, createdAt: -1 });
sessionSchema.index({ user: 1, status: 1 });

const Session = mongoose.model("Session", sessionSchema);

export default Session;