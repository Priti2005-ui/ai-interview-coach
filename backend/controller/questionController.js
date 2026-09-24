
import Question from "../model/Question.js";
import Session from "../model/Session.js";
import asyncHandler from "../utils/asyncHandler.js";

// 🔐 Helper
const isOwner = (resourceUserId, loggedInUserId) =>
  resourceUserId.toString() === loggedInUserId.toString();

// 🔄 Toggle Pin
export const togglePinQuestion = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const question = await Question.findById(id).populate("session");

  if (!question) {
    return res.status(404).json({ success: false, message: "Question not found" });
  }

  if (!isOwner(question.session.user, req.user._id)) {
    return res.status(403).json({ success: false, message: "Not authorized" });
  }

  question.pinned = !question.pinned;
  await question.save();

  res.status(200).json({
    success: true,
    message: "Pin toggled",
    data: {
      questionId: question._id,
      pinned: question.pinned,
    },
  });
});

// 📝 Update Notes
export const updateQuestionNote = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { note } = req.body;

  if (typeof note !== "string") {
    return res.status(400).json({ success: false, message: "Invalid note format" });
  }

  const question = await Question.findById(id).populate("session");

  if (!question) {
    return res.status(404).json({ success: false, message: "Question not found" });
  }

  if (!isOwner(question.session.user, req.user._id)) {
    return res.status(403).json({ success: false, message: "Not authorized" });
  }

  question.userNotes = note;
  await question.save();

  res.status(200).json({
    success: true,
    message: "Note updated",
    data: { note: question.userNotes },
  });
});

// ➕ Add Questions
export const addQuestionToSession = asyncHandler(async (req, res) => {
  const { sessionId, questions } = req.body;

  if (!sessionId || !Array.isArray(questions)) {
    return res.status(400).json({
      success: false,
      message: "Session ID and valid questions array are required",
    });
  }

  const session = await Session.findById(sessionId);

  if (!session) {
    return res.status(404).json({ success: false, message: "Session not found" });
  }

  if (!isOwner(session.user, req.user._id)) {
    return res.status(403).json({ success: false, message: "Not authorized" });
  }

  if (session.status === "completed") {
    return res.status(400).json({
      success: false,
      message: "Cannot modify completed session",
    });
  }

  const validQuestions = questions.filter((q) => q.question);

  if (!validQuestions.length) {
    return res.status(400).json({
      success: false,
      message: "No valid questions provided",
    });
  }

  const insertedQuestions = await Question.insertMany(
    validQuestions.map((q) => ({
      session: sessionId,
      question: q.question,
      answer: q.answer || "",
    }))
  );

  session.questions.push(...insertedQuestions.map((q) => q._id));
  session.totalQuestions = session.questions.length;

  await session.save();

  res.status(201).json({
    success: true,
    message: "Questions added successfully",
    data: insertedQuestions,
  });
});

