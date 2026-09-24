import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import apiClient from "../../services/apiClient.js";

const AnalyticsPage = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data } = await apiClient.get("/analytics/dashboard");
        const analyticsData = data?.data || data;

        setAnalytics(analyticsData);
      } catch (err) {
        const message =
          err?.response?.data?.message ||
          err?.customMessage ||
          "Failed to load analytics";

        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const overviewCards = useMemo(
    () => [
      {
        label: "Total Sessions",
        value: analytics?.overview?.totalSessions || 0,
      },
      {
        label: "Completed Sessions",
        value: analytics?.overview?.completedSessions || 0,
      },
      {
        label: "Total Attempts",
        value: analytics?.overview?.totalAttempts || 0,
      },
      {
        label: "Average Score",
        value: `${Math.round(analytics?.overview?.averageScore || 0)}%`,
      },
      {
        label: "Avg Response Time",
        value: `${Math.round(analytics?.overview?.averageResponseTime || 0)}s`,
      },
    ],
    [analytics]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-slate-300">Loading analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center">
          <h2 className="text-2xl font-semibold">Could not load analytics</h2>
          <p className="text-slate-400 mt-3">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-6 md:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl">
          <p className="text-sm text-indigo-400">Performance Insights</p>
          <h1 className="text-3xl font-bold mt-1">Analytics Dashboard</h1>
          <p className="text-slate-400 mt-3 max-w-3xl">
            Track your interview performance, topic-wise strengths and weaknesses,
            and the trend of your improvement over time.
          </p>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {overviewCards.map((card) => (
            <div
              key={card.label}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5"
            >
              <p className="text-sm text-slate-400">{card.label}</p>
              <h3 className="text-3xl font-bold mt-2">{card.value}</h3>
            </div>
          ))}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <h2 className="text-xl font-semibold mb-4">Skill Insights</h2>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-slate-400">Overall Score</p>
                <p className="text-2xl font-bold mt-1">
                  {Math.round(analytics?.skillInsights?.overallScore || 0)}
                </p>
              </div>

              <div>
                <p className="text-slate-400">Accuracy Rate</p>
                <p className="text-2xl font-bold mt-1">
                  {Math.round(analytics?.skillInsights?.accuracyRate || 0)}%
                </p>
              </div>

              <div>
                <p className="text-slate-400">Improvement Rate</p>
                <p className="text-2xl font-bold mt-1">
                  {Math.round(analytics?.skillInsights?.improvementRate || 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <h2 className="text-xl font-semibold mb-4">Recommendations</h2>
            <div className="space-y-3">
              {(analytics?.recommendations || []).length > 0 ? (
                analytics.recommendations.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-slate-300"
                  >
                    {item}
                  </div>
                ))
              ) : (
                <p className="text-slate-400 text-sm">No recommendations yet.</p>
              )}
            </div>
          </div>
        </section>

        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8">
          <h2 className="text-xl font-semibold mb-4">Topic Performance</h2>
          <div className="space-y-4">
            {(analytics?.topicPerformance || []).length > 0 ? (
              analytics.topicPerformance.map((topic, index) => (
                <div
                  key={`${topic.topic}-${index}`}
                  className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-medium">{topic.topic}</h3>
                      <p className="text-sm text-slate-400 mt-1">
                        {topic.totalQuestions} questions answered
                      </p>
                    </div>

                    <div className="text-sm text-slate-400 md:text-right">
                      <p>Average Score: {Math.round(topic.averageScore || 0)}</p>
                      <p>Confidence: {topic.confidenceLevel || "medium"}</p>
                      <p>Difficulty: {topic.recommendedDifficulty || "medium"}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-sm">No topic performance available.</p>
            )}
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <h2 className="text-xl font-semibold mb-4">Strongest Topics</h2>
            <div className="flex flex-wrap gap-2">
              {(analytics?.skillInsights?.strongestTopics || []).length > 0 ? (
                analytics.skillInsights.strongestTopics.map((topic, index) => (
                  <span
                    key={index}
                    className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-300"
                  >
                    {topic}
                  </span>
                ))
              ) : (
                <p className="text-slate-400 text-sm">No strong topics yet.</p>
              )}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <h2 className="text-xl font-semibold mb-4">Weakest Topics</h2>
            <div className="flex flex-wrap gap-2">
              {(analytics?.skillInsights?.weakestTopics || []).length > 0 ? (
                analytics.skillInsights.weakestTopics.map((topic, index) => (
                  <span
                    key={index}
                    className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-sm text-rose-300"
                  >
                    {topic}
                  </span>
                ))
              ) : (
                <p className="text-slate-400 text-sm">No weak topics yet.</p>
              )}
            </div>
          </div>
        </section>

        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {(analytics?.recentActivity || []).length > 0 ? (
              analytics.recentActivity.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div>
                      <p className="text-sm text-slate-400">{item.role}</p>
                      <h3 className="text-base font-medium mt-1">
                        {item.question}
                      </h3>
                    </div>

                    <div className="text-sm text-slate-400 md:text-right">
                      <p>Score: {Math.round(item.score || 0)}</p>
                      <p>Difficulty: {item.difficulty || "medium"}</p>
                      <p>{item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-sm">No recent activity.</p>
            )}
          </div>
        </section>

        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8">
          <h2 className="text-xl font-semibold mb-4">Score Trend</h2>
          <div className="space-y-3">
            {(analytics?.scoreTrend || []).length > 0 ? (
              analytics.scoreTrend.map((item, index) => (
                <div
                  key={`${item.date}-${index}`}
                  className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3"
                >
                  <span className="text-slate-300">
                    {item.date ? new Date(item.date).toLocaleDateString() : "N/A"}
                  </span>
                  <span className="font-semibold">{Math.round(item.score || 0)}</span>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-sm">No score trend available yet.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AnalyticsPage;
