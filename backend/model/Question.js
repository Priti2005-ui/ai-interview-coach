import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
    },

    question: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ["technical", "behavioral", "mcq"],
      default: "technical",
    },

    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },

    idealAnswer: {
      type: String,
      default: "",
    },

    userNotes: {
      type: String,
      default: "",
      trim: true,
    },

    pinned: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

questionSchema.index({ session: 1, createdAt: -1 });

export default mongoose.model("Question", questionSchema);