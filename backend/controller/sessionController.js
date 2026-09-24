
import mongoose from "mongoose";
import Session from "../model/Session.js";
import Question from "../model/Question.js";
import AnswerAttempt from "../model/AnswerAttempt.js";
import asyncHandler from "../utils/asyncHandler.js";

// 🔐 Helper
const isOwner = (resourceUserId, loggedInUserId) =>
  resourceUserId.toString() === loggedInUserId.toString();

// 🚀 CREATE SESSION (with transaction)
export const createSession = asyncHandler(async (req, res) => {
  const dbSession = await mongoose.startSession();
  dbSession.startTransaction();

  try {
    const {
      role,
      jobRole,
      experience,
      experienceLevel,
      difficulty,
      topicsToFocus,
      description,
      questions,
    } = req.body;
    const resolvedRole = role || jobRole;
    const resolvedExperience = experience || experienceLevel;

    if (!resolvedRole || !resolvedExperience || !Array.isArray(questions) || !questions.length) {
      throw new Error("Invalid input");
    }

    const session = await Session.create(
      [
        {
          user: req.user._id,
          jobRole: resolvedRole,
          experienceLevel: resolvedExperience,
          difficulty: difficulty || "medium",
          topicsToFocus: topicsToFocus || [],
          description: description || "",
          status: "active",
          startedAt: new Date(),
        },
      ],
      { session: dbSession }
    );

    const sessionId = session[0]._id;

    const questionDocs = await Question.insertMany(
      questions.map((q) => ({
        session: sessionId,
        question: q.question,
        type: q.type || "technical",
        difficulty: q.difficulty || difficulty || "medium",
        idealAnswer: q.idealAnswer || q.answer || "",
      })),
      { session: dbSession }
    );

    await Session.findByIdAndUpdate(
      sessionId,
      {
        $push: { questions: { $each: questionDocs.map((q) => q._id) } },
        totalQuestions: questionDocs.length,
      },
      { session: dbSession }
    );

    await dbSession.commitTransaction();
    dbSession.endSession();

    res.status(201).json({
      success: true,
      sessionId,
      questions: questionDocs,
    });
  } catch (error) {
    await dbSession.abortTransaction();
    dbSession.endSession();

    throw error;
  }
});

// 📘 GET SESSION
export const getSessionById = asyncHandler(async (req, res) => {
  const session = await Session.findOne({
    _id: req.params.id,
    user: req.user._id,
  }).populate({
    path: "questions",
    select: "question type difficulty idealAnswer userNotes pinned createdAt",
    options: { sort: { pinned: -1, createdAt: 1 } },
  });

  if (!session) {
    return res.status(404).json({ success: false, message: "Session not found" });
  }

  const attempts = await AnswerAttempt.find({
    session: session._id,
    user: req.user._id,
  })
    .sort({ createdAt: 1 })
    .populate("question", "question difficulty type");

  res.json({
    success: true,
    data: {
      ...session.toObject(),
      attempts,
    },
  });
});

// 📚 GET ALL SESSIONS (paginated)
export const getMySession = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10;

  const sessions = await Session.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  res.json({ success: true, data: sessions });
});

export const deleteSession = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.id);

  if (!session) {
    return res.status(404).json({ success: false, message: "Session not found" });
  }

  if (!isOwner(session.user, req.user._id)) {
    return res.status(403).json({ success: false, message: "Not authorized" });
  }

  await Promise.all([
    Question.deleteMany({ session: session._id }),
    AnswerAttempt.deleteMany({ session: session._id, user: req.user._id }),
  ]);
  await session.deleteOne();

  res.json({ success: true, message: "Session deleted" });
});

export const endSession = asyncHandler(async (req, res) => {
  const session = await Session.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!session) {
    return res.status(404).json({ success: false, message: "Session not found" });
  }

  if (session.status === "completed") {
    return res.status(200).json({
      success: true,
      message: "Session already completed",
      data: session,
    });
  }

  const completedQuestions = await AnswerAttempt.distinct("question", {
    session: session._id,
    user: req.user._id,
    evaluationStatus: "completed",
  });

  session.status = "completed";
  session.completedQuestions = completedQuestions.length;
  session.totalQuestions = Math.max(
    session.totalQuestions || 0,
    session.questions?.length || 0
  );
  session.endedAt = new Date();
  session.lastActivityAt = new Date();

  await session.save();

  res.status(200).json({
    success: true,
    message: "Session completed successfully",
    data: session,
  });
});

