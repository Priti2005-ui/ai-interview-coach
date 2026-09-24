import fs from "fs/promises";
import mongoose from "mongoose";
import Session from "../model/Session.js";
import Question from "../model/Question.js";
import ResumeProfile from "../model/resumeProfile.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  extractResumeText,
  analyzeResumeWithAI,
  generateResumeQuestionsWithAI,
} from "../service/resumeServices.js";

export const createResumeBasedSession = asyncHandler(async (req, res) => {
  const { numberOfQuestions = 5 } = req.body;

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Resume file is required",
    });
  }

  const parsedCount = Number(numberOfQuestions);
  const finalCount = Number.isFinite(parsedCount)
    ? Math.min(Math.max(parsedCount, 1), 10)
    : 5;

  const filePath = req.file.path;
  const mimeType = req.file.mimetype;

  try {
    const resumeText = await extractResumeText(filePath, mimeType);

    if (!resumeText || resumeText.trim().length < 50) {
      return res.status(400).json({
        success: false,
        message: "Resume text is too short or unreadable",
      });
    }

    const analysis = await analyzeResumeWithAI(resumeText);

    if (!analysis || typeof analysis !== "object") {
      return res.status(500).json({
        success: false,
        message: "Failed to analyze resume",
      });
    }

    const session = await Session.create({
      user: req.user._id,
      jobRole: analysis.targetRole || "Unknown Role",
      experienceLevel: analysis.experienceLevel || "mid",
      mode: "resume-based",
      difficulty: "medium",
      topicsToFocus: analysis.suggestedTopics || [],
      description: analysis.summary || "Resume-based interview session",
      status: "active",
      startedAt: new Date(),
      source: "resume",
      aiMeta: {
        model: "multi-provider",
        temperature: 0.7,
      },
    });

    const questions = await generateResumeQuestionsWithAI(analysis, finalCount);

    const validQuestions = Array.isArray(questions) ? questions : [];
    if (!validQuestions.length) {
      return res.status(500).json({
        success: false,
        message: "No questions generated from resume",
      });
    }

    const questionDocs = await Question.insertMany(
      validQuestions.map((q) => ({
        session: session._id,
        question: q.question,
        type: q.type || "technical",
        difficulty: q.difficulty || "medium",
        idealAnswer: q.idealAnswer || "",
        topicTags: Array.isArray(q.topicTags) ? q.topicTags : [],
        userNotes: "",
        pinned: false,
      }))
    );

    session.questions = questionDocs.map((q) => q._id);
    session.totalQuestions = questionDocs.length;
    session.lastActivityAt = new Date();
    await session.save();

    await ResumeProfile.create({
      user: req.user._id,
      session: session._id,
      fileName: req.file.filename || "",
      originalName: req.file.originalname || "",
      fileUrl: req.file.filename
        ? `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`
        : "",
      targetRole: analysis.targetRole || "",
      experienceLevel: analysis.experienceLevel || "mid",
      summary: analysis.summary || "",
      skills: analysis.skills || [],
      strongAreas: analysis.strongAreas || [],
      weakAreas: analysis.weakAreas || [],
      suggestedTopics: analysis.suggestedTopics || [],
      projects: analysis.projects || [],
      companiesOrDomains: analysis.companiesOrDomains || [],
      rawTextSnippet: resumeText.slice(0, 2000),
    });

    return res.status(201).json({
      success: true,
      message: "Resume-based session created successfully",
      data: {
        session,
        analysis,
        questions: questionDocs,
      },
    });
  } catch (error) {
    console.error("Resume flow error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create resume-based session",
    });
  } finally {
    try {
      if (filePath) {
        await fs.unlink(filePath);
      }
    } catch {
      // ignore cleanup errors
    }
  }
});

export const getResumeProfiles = asyncHandler(async (req, res) => {
  const profiles = await ResumeProfile.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .populate("session", "jobRole experienceLevel status score");

  res.status(200).json({
    success: true,
    data: profiles,
  });
});

export const getResumeProfileBySession = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(sessionId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid sessionId",
    });
  }

  const profile = await ResumeProfile.findOne({
    user: req.user._id,
    session: sessionId,
  }).populate("session");

  if (!profile) {
    return res.status(404).json({
      success: false,
      message: "Resume profile not found",
    });
  }

  res.status(200).json({
    success: true,
    data: profile,
  });
});
