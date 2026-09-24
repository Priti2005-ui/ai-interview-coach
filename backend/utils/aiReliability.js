import crypto from "crypto";
import {
  generateWithFallback,
  parseModelJson,
} from "./llmRouter.js";

/**
 * In-memory cache for AI responses.
 * Great for single-instance dev/demo.
 * For production with multiple servers, replace with Redis.
 */
const aiCache = new Map();

const DEFAULT_CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const DEFAULT_RETRIES = 2;
const DEFAULT_BACKOFF_MS = 500;
const MAX_CACHE_SIZE = 500;

const now = () => Date.now();

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const sha1 = (input) =>
  crypto.createHash("sha1").update(input).digest("hex");

export const buildCacheKey = ({
  scope = "default",
  messages = [],
}) => {
  return sha1(
    JSON.stringify({
      scope,
      messages,
    })
  );
};

export const getCachedAIResponse = (cacheKey) => {
  const cached = aiCache.get(cacheKey);
  if (!cached) return null;

  if (cached.expiresAt < now()) {
    aiCache.delete(cacheKey);
    return null;
  }

  return cached.value;
};

const evictOldestCacheEntry = () => {
  const firstKey = aiCache.keys().next().value;
  if (firstKey) {
    aiCache.delete(firstKey);
  }
};

export const setCachedAIResponse = (
  cacheKey,
  value,
  ttlMs = DEFAULT_CACHE_TTL
) => {
  if (aiCache.size >= MAX_CACHE_SIZE) {
    evictOldestCacheEntry();
  }

  aiCache.set(cacheKey, {
    value,
    expiresAt: now() + ttlMs,
  });
};

export const clearAIResponseCache = () => {
  aiCache.clear();
};

const normalizeText = (text) => {
  if (typeof text !== "string") return "";
  return text.trim();
};

export const generateReliableAIResponse = async ({
  messages,
  cacheScope = "default",
  cacheTTL = DEFAULT_CACHE_TTL,
  retries = DEFAULT_RETRIES,
  preferredProviders = [],
  forceRefresh = false,
  parseJson = false,
}) => {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error("messages must be a non-empty array");
  }

  const requestId = crypto.randomUUID();

  const cacheKey = buildCacheKey({
    scope: cacheScope,
    messages,
  });

  if (!forceRefresh) {
    const cached = getCachedAIResponse(cacheKey);
    if (cached) {
      return {
        requestId,
        fromCache: true,
        provider: cached.provider,
        text: cached.text,
        parsed: cached.parsed,
      };
    }
  }

  let lastError = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const { provider, text } = await generateWithFallback({
        messages,
        preferredProviders,
      });

      const cleanText = normalizeText(text);

      if (!cleanText) {
        throw new Error("AI returned empty output");
      }

      const parsed = parseJson ? parseModelJson(cleanText) : null;

      const payload = {
        provider,
        text: cleanText,
        parsed,
      };

      setCachedAIResponse(cacheKey, payload, cacheTTL);

      return {
        requestId,
        fromCache: false,
        ...payload,
      };
    } catch (error) {
      lastError = error;

      if (attempt < retries) {
        await sleep(DEFAULT_BACKOFF_MS * Math.pow(2, attempt));
      }
    }
  }

  throw lastError || new Error("AI generation failed");
};