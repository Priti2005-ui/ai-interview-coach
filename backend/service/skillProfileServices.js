import SkillProfile from "../model/SkillProfile.js";

const GENERIC_TOPICS = new Set(["technical", "behavioral", "mcq", "general"]);

export const getWeakestTopicForUser = (skillProfile) => {
  if (!skillProfile) return null;

  if (
    Array.isArray(skillProfile.weakestTopics) &&
    skillProfile.weakestTopics.length > 0
  ) {
    const found = skillProfile.weakestTopics.find(
      (t) => t && !GENERIC_TOPICS.has(String(t).toLowerCase())
    );
    if (found) return found;
  }

  if (Array.isArray(skillProfile.topics) && skillProfile.topics.length > 0) {
    const sorted = [...skillProfile.topics].sort(
      (a, b) => (a.averageScore || 0) - (b.averageScore || 0)
    );

    const found = sorted.find(
      (t) => t?.topic && !GENERIC_TOPICS.has(String(t.topic).toLowerCase())
    );

    return found?.topic || null;
  }

  return null;
};
/**
 * Update or create a user's skill profile after one answer attempt.
 */
export const updateSkillProfileFromAttempt = async ({
  userId,
  role = "",
  topic,
  score = 0,
  timeTaken = 0,
  isCorrect = false,
  difficultyAtAttempt = "medium",
  strengths = [],
  weaknesses = [],
  topicTags = [],
}) => {
  let skillProfile = await SkillProfile.findOne({ user: userId });

  if (!skillProfile) {
    skillProfile = await SkillProfile.create({
      user: userId,
      targetRole: role,
      topics: [],
      overallScore: 0,
      accuracyRate: 0,
      strongestTopics: [],
      weakestTopics: [],
      totalSessions: 0,
      totalQuestionsAttempted: 0,
      averageResponseTime: 0,
      improvementRate: 0,
      aiRecommendations: [],
      scoreHistory: [],
      preferredTopics: [],
    });
  }

  const topicName = topic || "general";
  const topics = Array.isArray(skillProfile.topics) ? skillProfile.topics : [];

  const topicIndex = topics.findIndex((t) => t.topic === topicName);
  const safeScore = Number.isFinite(score) ? score : 0;

  if (topicIndex >= 0) {
    const currentTopic = topics[topicIndex];
    const prevCount = currentTopic.totalQuestions || 0;
    const prevAvg = currentTopic.averageScore || 0;

    const nextCount = prevCount + 1;
    const nextAvg = (prevAvg * prevCount + safeScore) / nextCount;

    currentTopic.averageScore = nextAvg;
    currentTopic.totalQuestions = nextCount;
    currentTopic.strengths = [...new Set([...(currentTopic.strengths || []), ...strengths])];
    currentTopic.weaknesses = [...new Set([...(currentTopic.weaknesses || []), ...weaknesses])];
    currentTopic.confidenceLevel =
      nextAvg >= 80 ? "high" : nextAvg >= 50 ? "medium" : "low";
    currentTopic.recommendedDifficulty =
      nextAvg >= 80 ? "hard" : nextAvg >= 50 ? "medium" : "easy";
    currentTopic.lastDifficultySolved = difficultyAtAttempt;
    currentTopic.lastPracticed = new Date();

    topics[topicIndex] = currentTopic;
  } else {
    topics.push({
      topic: topicName,
      averageScore: safeScore,
      totalQuestions: 1,
      strengths: [...new Set(strengths)],
      weaknesses: [...new Set(weaknesses)],
      confidenceLevel: safeScore >= 80 ? "high" : safeScore >= 50 ? "medium" : "low",
      recommendedDifficulty:
        safeScore >= 80 ? "hard" : safeScore >= 50 ? "medium" : "easy",
      lastDifficultySolved: difficultyAtAttempt,
      lastPracticed: new Date(),
    });
  }

  const prevAttempted = skillProfile.totalQuestionsAttempted || 0;
  const nextAttempted = prevAttempted + 1;

  skillProfile.topics = topics;
  skillProfile.targetRole = skillProfile.targetRole || role;
  skillProfile.totalQuestionsAttempted = nextAttempted;
  skillProfile.overallScore =
    ((skillProfile.overallScore || 0) * prevAttempted + safeScore) / nextAttempted;

  skillProfile.accuracyRate =
    (((skillProfile.accuracyRate || 0) * prevAttempted) + (isCorrect ? 100 : 0)) / nextAttempted;

  skillProfile.averageResponseTime =
    (((skillProfile.averageResponseTime || 0) * prevAttempted) + (timeTaken || 0)) / nextAttempted;

  skillProfile.strongestTopics = topics
    .filter((t) => (t.averageScore || 0) >= 70)
    .sort((a, b) => (b.averageScore || 0) - (a.averageScore || 0))
    .map((t) => t.topic);

  skillProfile.weakestTopics = topics
    .filter((t) => (t.averageScore || 0) < 50)
    .sort((a, b) => (a.averageScore || 0) - (b.averageScore || 0))
    .map((t) => t.topic);

  skillProfile.improvementRate = nextAttempted > 1 ? skillProfile.overallScore - (skillProfile.scoreHistory?.[0]?.score || 0) : 0;

  skillProfile.aiRecommendations = [
    ...new Set([
      ...(skillProfile.aiRecommendations || []),
      ...(safeScore < 50 ? [`Revise ${topicName}`] : []),
      ...(safeScore >= 80 ? [`Increase difficulty for ${topicName}`] : []),
      ...(topicTags?.length ? [`Focus on ${topicTags[0]}`] : []),
    ]),
  ];

  skillProfile.scoreHistory = [
    ...(skillProfile.scoreHistory || []),
    {
      score: safeScore,
      date: new Date(),
    },
  ].slice(-50);

  await skillProfile.save();
  return skillProfile;
};

/**
 * Get next topic + difficulty for adaptive question generation.
 */
export const getAdaptiveTarget = (skillProfile, session) => {
  const weakTopic = getWeakestTopicForUser(skillProfile);

  const sessionTopic =
    Array.isArray(session?.topicsToFocus) && session.topicsToFocus.length > 0
      ? session.topicsToFocus.find(
          (t) => t && !["technical", "behavioral", "mcq", "general"].includes(String(t).toLowerCase())
        ) || null
      : null;

  const topic = weakTopic || sessionTopic || "general";

  let difficulty = session?.difficulty || "medium";

  const topicData = skillProfile?.topics?.find((t) => t.topic === topic);
  if (topicData?.recommendedDifficulty) {
    difficulty = topicData.recommendedDifficulty;
  }

  return { topic, difficulty };
};