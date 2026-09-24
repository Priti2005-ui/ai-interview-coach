import mongoose from "mongoose";

const answerAttemptSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
    },

    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },

    userAnswer: {
      type: String,
      required: true,
      trim: true,
    },

    aiEvaluation: {
      score: {
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

      idealAnswer: {
        type: String,
        default: "",
      },

      feedback: {
        type: String,
        default: "",
      },

      followUpQuestion: {
        type: String,
        default: "",
      },
    },

    topicTags: {
      type: [String],
      default: [],
    },

    difficultyAtAttempt: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },

    timeTaken: {
      type: Number,
    },

    isCorrect: {
      type: Boolean,
      default: null,
    },

    attemptNumber: {
      type: Number,
      default: 1,
    },

    evaluationStatus: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },

    aiModel: {
      type: String,
      default: "gemini",
    },

    evaluatedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

answerAttemptSchema.index({ user: 1, createdAt: -1 });
answerAttemptSchema.index({ session: 1 });
answerAttemptSchema.index({ user: 1, session: 1, question: 1 });
answerAttemptSchema.index({ session: 1, question: 1, attemptNumber: 1 });

export default mongoose.model("AnswerAttempt", answerAttemptSchema);