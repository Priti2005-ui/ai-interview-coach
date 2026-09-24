import mongoose from "mongoose";

const resumeProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
      index: true,
    },

    fileName: {
      type: String,
      default: "",
    },

    originalName: {
      type: String,
      default: "",
    },

    fileUrl: {
      type: String,
      default: "",
    },

    targetRole: {
      type: String,
      default: "",
    },

    experienceLevel: {
      type: String,
      enum: ["fresher", "junior", "mid", "senior"],
      default: "mid",
    },

    summary: {
      type: String,
      default: "",
    },

    skills: {
      type: [String],
      default: [],
    },

    strongAreas: {
      type: [String],
      default: [],
    },

    weakAreas: {
      type: [String],
      default: [],
    },

    suggestedTopics: {
      type: [String],
      default: [],
    },

    projects: {
      type: [String],
      default: [],
    },

    companiesOrDomains: {
      type: [String],
      default: [],
    },

    rawTextSnippet: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

resumeProfileSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model("ResumeProfile", resumeProfileSchema);