import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";

// ============================================================
// PROVIDERS
// ============================================================

const PROVIDERS = [
  {
    name: "gemini",
    enabled: () => Boolean(process.env.GEMINI_API_KEY),
    timeoutMs: 60000,
    kind: "gemini",

    get model() {
      return process.env.GEMINI_MODEL || "gemini-3.6-flash";
    },
  },

  {
    name: "openrouter",
    enabled: () => Boolean(process.env.OPENROUTER_API_KEY),
    timeoutMs: 12000,
    kind: "openai-compatible",

    get baseURL() {
      return (
        process.env.OPENROUTER_BASE_URL ||
        "https://openrouter.ai/api/v1"
      );
    },

    get model() {
      return (
        process.env.OPENROUTER_MODEL ||
        "deepseek/deepseek-chat-v3-0324:free"
      );
    },
  },

  {
    name: "groq",
    enabled: () => Boolean(process.env.GROQ_API_KEY),
    timeoutMs: 10000,
    kind: "openai-compatible",

    get baseURL() {
      return (
        process.env.GROQ_BASE_URL ||
        "https://api.groq.com/openai/v1"
      );
    },

    get model() {
      return (
        process.env.GROQ_MODEL ||
        "llama-3.3-70b-versatile"
      );
    },
  },

  {
    name: "huggingface",
    enabled: () =>
      Boolean(process.env.HF_API_KEY) &&
      Boolean(process.env.HF_BASE_URL),

    timeoutMs: 15000,
    kind: "openai-compatible",

    get baseURL() {
      return process.env.HF_BASE_URL;
    },

    get model() {
      return (
        process.env.HF_MODEL ||
        "meta-llama/Llama-3.1-8B-Instruct"
      );
    },
  },
];

// ============================================================
// PROVIDER STATE / CIRCUIT BREAKER
// ============================================================

const providerState = new Map();

const now = () => Date.now();

const isBlocked = (name) => {
  const state = providerState.get(name);

  if (!state) {
    return false;
  }

  return Boolean(
    state.blockedUntil &&
      state.blockedUntil > now()
  );
};

const recordSuccess = (name) => {
  providerState.set(name, {
    fails: 0,
    blockedUntil: 0,
  });
};

const recordFailure = (name) => {
  const previous =
    providerState.get(name) || {
      fails: 0,
      blockedUntil: 0,
    };

  const fails = previous.fails + 1;

  const blockedUntil =
    fails >= 3
      ? now() + 5 * 60 * 1000
      : 0;

  providerState.set(name, {
    fails,
    blockedUntil,
  });
};

// ============================================================
// HELPERS
// ============================================================

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const withTimeout = (
  promise,
  timeoutMs,
  providerName
) => {
  let timer;

  const timeoutPromise = new Promise(
    (_, reject) => {
      timer = setTimeout(() => {
        reject(
          new Error(
            `${providerName} timed out after ${timeoutMs}ms`
          )
        );
      }, timeoutMs);
    }
  );

  return Promise.race([
    promise,
    timeoutPromise,
  ]).finally(() => {
    clearTimeout(timer);
  });
};

const toGeminiPrompt = (messages) =>
  messages
    .map(
      (message) =>
        `${message.role.toUpperCase()}:\n${message.content}`
    )
    .join("\n\n");

const createOpenAIClient = ({
  apiKey,
  baseURL,
}) =>
  new OpenAI({
    apiKey,
    baseURL,
  });

// ============================================================
// GEMINI
// ============================================================

const getGeminiText = async ({
  modelName,
  messages,
}) => {
  const client = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  const prompt = toGeminiPrompt(messages);

  const maxAttempts = 3;

  for (
    let attempt = 1;
    attempt <= maxAttempts;
    attempt++
  ) {
    try {
      console.log(
        `🔄 Gemini attempt ${attempt}/${maxAttempts} | model: ${modelName}`
      );

      const response =
        await client.models.generateContent({
          model: modelName,
          contents: prompt,
        });

      const text =
        response?.text || "";

      if (!text.trim()) {
        throw new Error(
          "Gemini returned empty output"
        );
      }

      console.log(
        `✅ Gemini response received on attempt ${attempt}`
      );

      return text;
    } catch (error) {
      const status = error?.status;

      console.error(
        `❌ Gemini attempt ${attempt} failed:`,
        JSON.stringify(
          {
            message: error?.message,
            status,
          },
          null,
          2
        )
      );

      // Retry temporary server/rate-limit errors
      const retryableStatuses = [
        429,
        500,
        502,
        503,
        504,
      ];

      if (
        !retryableStatuses.includes(status)
      ) {
        throw error;
      }

      if (attempt < maxAttempts) {
        const delay = attempt * 3000;

        console.log(
          `⏳ Gemini temporarily unavailable. Retrying in ${
            delay / 1000
          } seconds...`
        );

        await sleep(delay);
      } else {
        console.error(
          "❌ Gemini failed after all retry attempts."
        );

        throw error;
      }
    }
  }

  throw new Error(
    "Gemini request failed after retries"
  );
};

// ============================================================
// OPENAI-COMPATIBLE PROVIDERS
// ============================================================

const getOpenAICompatibleText = async ({
  apiKey,
  baseURL,
  model,
  messages,
}) => {
  const client = createOpenAIClient({
    apiKey,
    baseURL,
  });

  const completion =
    await client.chat.completions.create({
      model,
      messages,
      temperature: 0.2,
    });

  return (
    completion?.choices?.[0]?.message?.content ||
    ""
  );
};

// ============================================================
// CLEAN MODEL TEXT
// ============================================================

export const cleanModelText = (
  text = ""
) =>
  String(text)
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .replace(
      /^Here is the JSON:\s*/i,
      ""
    )
    .trim();

// ============================================================
// EXTRACT JSON
// ============================================================

export const extractJsonBlock = (
  text = ""
) => {
  const cleaned = cleanModelText(text);

  const firstArray =
    cleaned.indexOf("[");

  const firstObject =
    cleaned.indexOf("{");

  const startsWithArray =
    firstArray !== -1 &&
    (
      firstObject === -1 ||
      firstArray < firstObject
    );

  if (startsWithArray) {
    const end =
      cleaned.lastIndexOf("]");

    if (end !== -1) {
      return cleaned.slice(
        firstArray,
        end + 1
      );
    }
  } else if (firstObject !== -1) {
    const end =
      cleaned.lastIndexOf("}");

    if (end !== -1) {
      return cleaned.slice(
        firstObject,
        end + 1
      );
    }
  }

  return cleaned;
};

// ============================================================
// PARSE JSON
// ============================================================

export const parseModelJson = (
  text
) => {
  const jsonText =
    extractJsonBlock(text);

  console.log(
    "RAW MODEL OUTPUT:",
    jsonText
  );

  try {
    return JSON.parse(jsonText);
  } catch (error) {
    console.error(
      "FAILED TO PARSE:",
      jsonText
    );

    throw new Error(
      `Invalid JSON response: ${error.message}`
    );
  }
};

// ============================================================
// MAIN LLM FALLBACK
// ============================================================

export const generateWithFallback =
  async ({
    messages,
    preferredProviders = [],
  }) => {
    if (
      !Array.isArray(messages) ||
      messages.length === 0
    ) {
      throw new Error(
        "messages must be a non-empty array"
      );
    }

    const preferredSet =
      new Set(preferredProviders);

    const orderedProviders = [
      ...preferredProviders
        .map((name) =>
          PROVIDERS.find(
            (provider) =>
              provider.name === name
          )
        )
        .filter(Boolean),

      ...PROVIDERS.filter(
        (provider) =>
          !preferredSet.has(
            provider.name
          )
      ),
    ];

    const errors = [];

    const anyEnabled =
      orderedProviders.some(
        (provider) =>
          provider.enabled()
      );

    if (!anyEnabled) {
      throw new Error(
        "No LLM provider is enabled. Check that API keys are set in your .env file."
      );
    }

    for (const provider of orderedProviders) {
      if (!provider.enabled()) {
        continue;
      }

      if (
        isBlocked(provider.name)
      ) {
        console.warn(
          `⚠️ Provider blocked (circuit open): ${provider.name}`
        );

        continue;
      }

      try {
        console.log(
          `➡️ Trying provider: ${provider.name} | model: ${provider.model}`
        );

        let text = "";

        switch (provider.kind) {
          // --------------------------------------------------
          // GEMINI
          // --------------------------------------------------

          case "gemini":
            text =
              await withTimeout(
                getGeminiText({
                  modelName:
                    provider.model,
                  messages,
                }),
                provider.timeoutMs,
                provider.name
              );

            break;

          // --------------------------------------------------
          // OPENAI COMPATIBLE
          // --------------------------------------------------

          case "openai-compatible": {
            const apiKey =
              provider.name ===
              "openrouter"
                ? process.env
                    .OPENROUTER_API_KEY
                : provider.name ===
                  "groq"
                ? process.env.GROQ_API_KEY
                : process.env.HF_API_KEY;

            text =
              await withTimeout(
                getOpenAICompatibleText({
                  apiKey,
                  baseURL:
                    provider.baseURL,
                  model:
                    provider.model,
                  messages,
                }),
                provider.timeoutMs,
                provider.name
              );

            break;
          }

          default:
            throw new Error(
              `Unsupported provider kind: ${provider.kind}`
            );
        }

        if (
          !text ||
          !text.trim()
        ) {
          throw new Error(
            `${provider.name} returned empty output`
          );
        }

        console.log(
          `✅ Provider succeeded: ${provider.name}`
        );

        recordSuccess(
          provider.name
        );

        return {
          provider:
            provider.name,
          text: text.trim(),
        };
      } catch (error) {
        console.error(
          `❌ Provider failed: ${provider.name}`,
          JSON.stringify(
            {
              message:
                error?.message,
              status:
                error?.status,
              data:
                error?.response?.data,
            },
            null,
            2
          )
        );

        recordFailure(
          provider.name
        );

        errors.push({
          provider:
            provider.name,
          message:
            error?.response?.data
              ? JSON.stringify(
                  error.response.data
                )
              : error?.message,
        });
      }
    }

    const detail =
      errors
        .map(
          (error) =>
            `${error.provider}: ${error.message}`
        )
        .join(" | ");

    throw new Error(
      `All providers failed. ${detail}`
    );
  };

// ============================================================
// NORMAL INTERVIEW QUESTION PROMPT
// ============================================================

export const buildQuestionMessages = ({
  role,
  experience,
  topicsToFocus = [],
  numberOfQuestions = 5,
}) => {
  const topicText =
    Array.isArray(topicsToFocus) &&
    topicsToFocus.length > 0
      ? topicsToFocus.join(", ")
      : "general interview topics";

  return [
    {
      role: "system",
      content:
        "You are a senior technical interviewer. Return STRICT JSON only. No markdown. No explanation.",
    },

    {
      role: "user",
      content: `
Generate ${numberOfQuestions} interview questions.

Role: ${role}
Experience: ${experience}
Topics: ${topicText}

Return ONLY valid JSON.

[
  {
    "question": "string",
    "answer": "string",
    "keyPoints": ["string"],
    "followUp": "string",
    "evaluation": "string"
  }
]
      `.trim(),
    },
  ];
};

// ============================================================
// EXPLANATION PROMPT
// ============================================================

export const buildExplanationMessages = ({
  question,
}) => {
  return [
    {
      role: "system",
      content:
        "You are a technical interview coach. Return STRICT JSON only.",
    },

    {
      role: "user",
      content: `
Explain this interview question:

"${question}"

Return ONLY valid JSON.

{
  "concept": "string",
  "importance": "string",
  "approach": "string",
  "mistakes": ["string"],
  "tips": ["string"]
}
      `.trim(),
    },
  ];
};