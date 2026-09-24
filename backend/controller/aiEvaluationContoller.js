import mongoose from "mongoose";
import Question from "../model/Question.js";
import Session from "../model/Session.js";
import AnswerAttempt from "../model/AnswerAttempt.js";
import SkillProfile from "../model/SkillProfile.js";
import asyncHandler from "../utils/asyncHandler.js";
import { generateWithFallback } from "../utils/llmRouter.js";
import {
  updateSkillProfileFromAttempt,
  getAdaptiveTarget,
} from "../service/skillProfileServices.js";
/**
 * Build the AI evaluation prompt.
 * Keep the response STRICT JSON so parsing stays stable.
 */
const buildEvaluationMessages = ({
  role,
  experienceLevel,
  topic,
  questionText,
  userAnswer,
  difficulty,
}) => {
  return [
    {
      role: "system",
      content:
        "You are a strict interview evaluator. Return STRICT JSON only. No markdown, no extra text.",
    },
    {
      role: "user",
      content: `
Evaluate this interview answer.

Role: ${role}
Experience: ${experienceLevel}
Topic: ${topic}
Difficulty: ${difficulty}

Question:
${questionText}

User Answer:
${userAnswer}

Return this exact JSON shape:
{
  "score": 0,
  "strengths": ["string"],
  "weaknesses": ["string"],
  "idealAnswer": "string",
  "feedback": "string",
  "followUpQuestion": "string",
  "topicTags": ["string"],
  "isCorrect": true
}

Rules:
- score must be between 0 and 100
- strengths and weaknesses must be short and specific
- idealAnswer should be concise but complete
- followUpQuestion should be based on the weak area
- topicTags should contain 1 to 4 relevant tags
- isCorrect should be true only if the answer is strong enough for the given level
      `.trim(),
    },
  ];
};

const safeJsonParse = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    const cleaned = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(cleaned);
  }
};

const normalizeScore = (score) => {
  const n = Number(score);
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, n));
};

const getTopicFromQuestion = (questionDoc, sessionDoc) => {
  if (questionDoc?.type) return questionDoc.type;
  if (sessionDoc?.topicsToFocus?.length) return sessionDoc.topicsToFocus[0];
  return "general";
};

const updateSkillProfile = async ({
  userId,
  role,
  questionTopic,
  score,
  timeTaken,
  topicTags = [],
  isCorrect,
  difficultyAtAttempt,
}) => {
  const skillProfile = await SkillProfile.findOne({ user: userId });

  if (!skillProfile) {
    const newProfile = await SkillProfile.create({
      user: userId,
      targetRole: role || "",
      topics: [
        {
          topic: questionTopic,
          averageScore: score,
          totalQuestions: 1,
          strengths: [],
          weaknesses: [],
          confidenceLevel: score >= 80 ? "high" : score >= 50 ? "medium" : "low",
          recommendedDifficulty:
            score >= 80 ? "hard" : score >= 50 ? "medium" : "easy",
          lastDifficultySolved: difficultyAtAttempt,
          lastPracticed: new Date(),
        },
      ],
      overallScore: score,
      accuracyRate: isCorrect ? 100 : 0,
      strongestTopics: score >= 70 ? [questionTopic] : [],
      weakestTopics: score < 50 ? [questionTopic] : [],
      totalSessions: 0,
      totalQuestionsAttempted: 1,
      averageResponseTime: timeTaken || 0,
      improvementRate: 0,
      aiRecommendations: [],
      scoreHistory: [{ score, date: new Date() }],
    });

    return newProfile;
  }

  skillProfile.targetRole = skillProfile.targetRole || role || "";

  const topics = Array.isArray(skillProfile.topics) ? skillProfile.topics : [];
  const existingTopicIndex = topics.findIndex((t) => t.topic === questionTopic);

  if (existingTopicIndex >= 0) {
    const topicObj = topics[existingTopicIndex];
    const prevTotal = topicObj.totalQuestions || 0;
    const prevAvg = topicObj.averageScore || 0;

    topicObj.averageScore =
      (prevAvg * prevTotal + score) / (prevTotal + 1);
    topicObj.totalQuestions = prevTotal + 1;
    topicObj.lastPracticed = new Date();
    topicObj.lastDifficultySolved = difficultyAtAttempt;

    topicObj.confidenceLevel =
      topicObj.averageScore >= 80
        ? "high"
        : topicObj.averageScore >= 50
          ? "medium"
          : "low";

    topicObj.recommendedDifficulty =
      topicObj.averageScore >= 80
        ? "hard"
        : topicObj.averageScore >= 50
          ? "medium"
          : "easy";

    if (score >= 70 && !topicObj.strengths.includes(questionTopic)) {
      topicObj.strengths = [...new Set([...(topicObj.strengths || []), questionTopic])];
    }

    if (score < 50 && !topicObj.weaknesses.includes(questionTopic)) {
      topicObj.weaknesses = [...new Set([...(topicObj.weaknesses || []), questionTopic])];
    }

    skillProfile.topics[existingTopicIndex] = topicObj;
  } else {
    skillProfile.topics.push({
      topic: questionTopic,
      averageScore: score,
      totalQuestions: 1,
      strengths: score >= 70 ? [questionTopic] : [],
      weaknesses: score < 50 ? [questionTopic] : [],
      confidenceLevel: score >= 80 ? "high" : score >= 50 ? "medium" : "low",
      recommendedDifficulty:
        score >= 80 ? "hard" : score >= 50 ? "medium" : "easy",
      lastDifficultySolved: difficultyAtAttempt,
      lastPracticed: new Date(),
    });
  }

  const allScores = skillProfile.scoreHistory?.map((x) => x.score) || [];
  const nextScoreHistory = [...(skillProfile.scoreHistory || []), { score, date: new Date() }];

  skillProfile.overallScore =
    ((skillProfile.overallScore || 0) * (skillProfile.totalQuestionsAttempted || 0) + score) /
    ((skillProfile.totalQuestionsAttempted || 0) + 1);

  skillProfile.accuracyRate =
    (((skillProfile.accuracyRate || 0) * (skillProfile.totalQuestionsAttempted || 0)) +
      (isCorrect ? 100 : 0)) /
    ((skillProfile.totalQuestionsAttempted || 0) + 1);

  skillProfile.totalQuestionsAttempted = (skillProfile.totalQuestionsAttempted || 0) + 1;

  skillProfile.averageResponseTime =
    (((skillProfile.averageResponseTime || 0) * (skillProfile.totalQuestionsAttempted - 1)) +
      (timeTaken || 0)) /
    skillProfile.totalQuestionsAttempted;

  skillProfile.strongestTopics = skillProfile.topics
    .filter((t) => t.averageScore >= 70)
    .sort((a, b) => b.averageScore - a.averageScore)
    .map((t) => t.topic);

  skillProfile.weakestTopics = skillProfile.topics
    .filter((t) => t.averageScore < 50)
    .sort((a, b) => a.averageScore - b.averageScore)
    .map((t) => t.topic);

  skillProfile.aiRecommendations = [
    ...new Set([
      ...(skillProfile.aiRecommendations || []),
      ...(score < 50 ? [`Practice more on ${questionTopic}`] : []),
      ...(score >= 80 ? [`Increase difficulty for ${questionTopic}`] : []),
    ]),
  ];

  skillProfile.scoreHistory = nextScoreHistory.slice(-50);

  await skillProfile.save();
  return skillProfile;
};

/**
 * POST /api/v1/answers/evaluate
 * Body:
 * {
 *   "sessionId": "...",
 *   "questionId": "...",
 *   "userAnswer": "...",
 *   "timeTaken": 42
 * }
 */
export const evaluateAnswer = asyncHandler(async (req, res) => {
  const { sessionId, questionId, userAnswer, timeTaken } = req.body;

  if (!sessionId || !questionId || !userAnswer) {
    return res.status(400).json({
      success: false,
      message: "sessionId, questionId, and userAnswer are required",
    });
  }

  if (
    !mongoose.Types.ObjectId.isValid(sessionId) ||
    !mongoose.Types.ObjectId.isValid(questionId)
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid sessionId or questionId",
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
      message: "Cannot evaluate answers for a completed session",
    });
  }

  const question = await Question.findOne({
    _id: questionId,
    session: sessionId,
  });

  if (!question) {
    return res.status(404).json({
      success: false,
      message: "Question not found",
    });
  }

  const questionTopic = getTopicFromQuestion(question, session);

  const evaluationMessages = buildEvaluationMessages({
    role: session.jobRole,
    experienceLevel: session.experienceLevel,
    topic: questionTopic,
    questionText: question.question,
    userAnswer,
    difficulty: question.difficulty || session.difficulty || "medium",
  });

  const { text: rawText, provider } = await generateWithFallback({
    messages: evaluationMessages,
  });

  const parsed = safeJsonParse(rawText);

  const score = normalizeScore(parsed.score);

  const attemptCount = await AnswerAttempt.countDocuments({
    user: req.user._id,
    session: sessionId,
    question: questionId,
  });

  const attempt = await AnswerAttempt.create({
    user: req.user._id,
    session: sessionId,
    question: questionId,
    userAnswer,
    aiEvaluation: {
      score,
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
      idealAnswer: parsed.idealAnswer || "",
      feedback: parsed.feedback || "",
      followUpQuestion: parsed.followUpQuestion || "",
    },
    topicTags: Array.isArray(parsed.topicTags) ? parsed.topicTags : [questionTopic],
    difficultyAtAttempt: question.difficulty || session.difficulty || "medium",
    timeTaken: typeof timeTaken === "number" ? timeTaken : undefined,
    isCorrect: typeof parsed.isCorrect === "boolean" ? parsed.isCorrect : score >= 60,
    attemptNumber: attemptCount + 1,
    evaluationStatus: "completed",
    aiModel: provider,
    evaluatedAt: new Date(),
  });

  if (!question.idealAnswer && parsed.idealAnswer) {
    question.idealAnswer = parsed.idealAnswer;
  }
  await question.save();

 const parsedTopicTags = Array.isArray(parsed.topicTags) ? parsed.topicTags : [];

const primaryTopic =
  parsedTopicTags.length > 0 ? parsedTopicTags[0] : questionTopic;

const updatedSkillProfile = await updateSkillProfileFromAttempt({
  userId: req.user._id,
  role: session.jobRole,
  topic: primaryTopic,
  score,
  timeTaken: typeof timeTaken === "number" ? timeTaken : 0,
  isCorrect: typeof parsed.isCorrect === "boolean" ? parsed.isCorrect : score >= 60,
  difficultyAtAttempt: question.difficulty || session.difficulty || "medium",
  strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
  weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
  topicTags: parsedTopicTags.length > 0 ? parsedTopicTags : [primaryTopic],
});


  session.score = updatedSkillProfile.overallScore;
  session.totalQuestions = Math.max(session.totalQuestions || 0, session.questions?.length || 0);
  session.lastActivityAt = new Date();
  await session.save();

  let nextDifficulty = session.difficulty || "medium";
  if (score >= 80) nextDifficulty = "hard";
  else if (score >= 50) nextDifficulty = "medium";
  else nextDifficulty = "easy";

  let nextFocusTopic = questionTopic;
  if (
    updatedSkillProfile.weakestTopics &&
    updatedSkillProfile.weakestTopics.length > 0 &&
    score < 50
  ) {
    nextFocusTopic = updatedSkillProfile.weakestTopics[0];
  }

  const followUpQuestion =
    parsed.followUpQuestion ||
    `Can you explain more about ${nextFocusTopic} at a ${nextDifficulty} level?`;

  return res.status(200).json({
    success: true,
    message: "Answer evaluated successfully",
    data: {
      attemptId: attempt._id,
      providerUsed: provider,
      evaluation: {
        score,
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
        weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
        idealAnswer: parsed.idealAnswer || "",
        feedback: parsed.feedback || "",
        followUpQuestion,
        topicTags: Array.isArray(parsed.topicTags) ? parsed.topicTags : [questionTopic],
        isCorrect: typeof parsed.isCorrect === "boolean" ? parsed.isCorrect : score >= 60,
      },
      adaptive: {
        nextDifficulty,
        nextFocusTopic,
      },
      skillProfile: {
        overallScore: updatedSkillProfile.overallScore,
        accuracyRate: updatedSkillProfile.accuracyRate,
        strongestTopics: updatedSkillProfile.strongestTopics,
        weakestTopics: updatedSkillProfile.weakestTopics,
      },
    },
  });
});
