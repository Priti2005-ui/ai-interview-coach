import mongoose from "mongoose";
import Session from "../model/Session.js";
import Question from "../model/Question.js";
import AnswerAttempt from "../model/AnswerAttempt.js";
import SkillProfile from "../model/SkillProfile.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  generateWithFallback,
  parseModelJson,
} from "../utils/llmRouter.js";

const buildNextQuestionMessages = ({
  role,
  experienceLevel,
  topic,
  difficulty,
  previousScore,
}) => {
  return [
    {
      role: "system",
      content:
        "You are an expert technical interviewer. Return STRICT JSON only. No markdown, no extra text.",
    },
    {
      role: "user",
      content: `
Generate exactly 1 adaptive interview question.

Context:
- Role: ${role}
- Experience: ${experienceLevel}
- Focus topic: ${topic}
- Difficulty: ${difficulty}
- Previous score: ${previousScore}

Return this exact JSON shape:
{
  "question": "string",
  "type": "technical|behavioral|mcq",
  "difficulty": "easy|medium|hard",
  "idealAnswer": "string",
  "topicTags": ["string"],
  "reason": "string"
}

Rules:
- If previous score is low, simplify the question.
- If previous score is high, increase difficulty.
- Prefer the weak topic from the skill profile.
- Keep the question interview-relevant and specific.
      `.trim(),
    },
  ];
};

const decideNextDifficulty = (score, currentDifficulty = "medium") => {
  if (score >= 80) return "hard";
  if (score >= 50)
    return currentDifficulty === "easy" ? "medium" : currentDifficulty;
  return "easy";
};

const pickWeakTopic = (skillProfile, session) => {
  const weakTopics = skillProfile?.weakestTopics || [];
  if (weakTopics.length > 0) return weakTopics[0];

  const sessionTopics = session?.topicsToFocus || [];
  if (sessionTopics.length > 0) return sessionTopics[0];

  return "general";
};

/**
 * GET /api/v1/adaptive/next?sessionId=...
 * Returns the next adaptive question and saves it to DB.
 */
export const getNextAdaptiveQuestion = asyncHandler(async (req, res) => {
  const { sessionId } = req.query;

  if (!sessionId) {
    return res.status(400).json({
      success: false,
      message: "sessionId is required",
    });
  }

  if (!mongoose.Types.ObjectId.isValid(sessionId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid sessionId",
    });
  }

  const session = await Session.findOne({
    _id: sessionId,
    user: req.user._id,
  });

  if (!session) {
    return res.status(404).json({
      success: false,
      message: "Session not found or not authorized",
    });
  }

  if (session.status === "completed") {
    return res.status(400).json({
      success: false,
      message: "Cannot generate questions for a completed session",
    });
  }

  const skillProfile = await SkillProfile.findOne({ user: req.user._id });

  const lastAttempt = await AnswerAttempt.findOne({
    user: req.user._id,
    session: sessionId,
  })
    .sort({ createdAt: -1 })
    .populate("question");

  const previousScore = lastAttempt?.aiEvaluation?.score || 0;

  const topic = pickWeakTopic(skillProfile, session);

  const difficulty = decideNextDifficulty(
    previousScore,
    skillProfile?.topics?.find((t) => t.topic === topic)?.recommendedDifficulty ||
      session.difficulty ||
      "medium"
  );

  const evaluationContext = {
    role: session.jobRole,
    experienceLevel: session.experienceLevel,
    topic,
    difficulty,
    previousScore,
  };

  const { text: rawText, provider } = await generateWithFallback({
    messages: buildNextQuestionMessages(evaluationContext),
  });

  console.log("✅ Adaptive provider:", provider);

  const parsed = parseModelJson(rawText);

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid adaptive question response");
  }

  const questionText = parsed.question || "";
  const questionType = ["technical", "behavioral", "mcq"].includes(parsed.type)
    ? parsed.type
    : "technical";
  const finalDifficulty = ["easy", "medium", "hard"].includes(parsed.difficulty)
    ? parsed.difficulty
    : difficulty;

  if (!questionText.trim()) {
    return res.status(500).json({
      success: false,
      message: "AI did not generate a valid question",
    });
  }

  const questionDoc = await Question.create({
    session: session._id,
    question: questionText,
    type: questionType,
    difficulty: finalDifficulty,
    idealAnswer: parsed.idealAnswer || "",
    topicTags: Array.isArray(parsed.topicTags) ? parsed.topicTags : [topic],
    userNotes: "",
    pinned: false,
  });

  session.questions.push(questionDoc._id);
  session.totalQuestions = (session.totalQuestions || 0) + 1;
  session.lastActivityAt = new Date();
  if (!session.startedAt) session.startedAt = new Date();

  await session.save();

  return res.status(200).json({
    success: true,
    message: "Next adaptive question generated successfully",
    data: {
      providerUsed: provider,
      question: questionDoc,
      adaptive: {
        topic,
        difficulty: finalDifficulty,
        previousScore,
        reason:
          parsed.reason ||
          `Selected because ${topic} is currently a weak area and the last score was ${previousScore}.`,
      },
    },
  });
});
