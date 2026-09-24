// controllers/aiController.js
import asyncHandler from "../utils/asyncHandler.js";
import {
  generateWithFallback,
  buildQuestionMessages,
  buildExplanationMessages,
  parseModelJson,
} from "../utils/llmRouter.js";


export const generateQuestions = asyncHandler(async (req, res) => {
  const {
    role,
    experience,
    topicsToFocus = [],
    numberOfQuestions = 5,
  } = req.body;

  if (!role || !experience) {
    return res.status(400).json({
      success: false,
      message: "role and experience are required",
    });
  }

  const messages = buildQuestionMessages({
    role,
    experience,
    topicsToFocus,
    numberOfQuestions,
  });

  const result = await generateWithFallback({
    messages,
    preferredProviders: ["gemini", "openrouter", "groq", "huggingface"],
  });
  console.log("RAW MODEL OUTPUT:", JSON.stringify(result.text)); // undefined?

  const questions = parseModelJson(result.text);

  if (!Array.isArray(questions)) {
    return res.status(502).json({
      success: false,
      message: "AI response must be an array of questions",
      provider: result.provider,
    });
  }

  return res.status(200).json({
    success: true,
    provider: result.provider,
    count: questions.length,
    questions,
  });
});

export const generateExplanation = asyncHandler(async (req, res) => {
  const { question } = req.body;

  if (!question) {
    return res.status(400).json({
      success: false,
      message: "question is required",
    });
  }

  const messages = buildExplanationMessages({ question });

  const result = await generateWithFallback({
    messages,
    preferredProviders: ["gemini", "openrouter", "groq", "huggingface"],
  });

  const explanation = parseModelJson(result.text);

  if (!explanation || typeof explanation !== "object" || Array.isArray(explanation)) {
    return res.status(502).json({
      success: false,
      message: "AI response must be a JSON object",
      provider: result.provider,
    });
  }

  return res.status(200).json({
    success: true,
    provider: result.provider,
    explanation,
  });
});