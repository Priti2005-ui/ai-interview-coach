import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

import Card from "../../components/ui/Card.jsx";
import Loader from "../../components/ui/Loader.jsx";
import apiClient from "../../services/apiClient.js";
import { useAppSelector } from "../../store/hooks.js";

const DashboardPage = () => {
  const { userInfo } = useAppSelector((state) => state.auth);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const quickActions = [
    {
      title: "Start Interview",
      desc: "Create a new adaptive session",
      to: "/interview/history",
    },
    {
      title: "Upload Resume",
      desc: "Generate personalized questions",
      to: "/resume/upload",
    },
    {
      title: "View Analytics",
      desc: "Track skill growth and weak areas",
      to: "/analytics",
    },
  ];

  useEffect(() => {
    const fetchDashboardAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data } = await apiClient.get("/analytics/dashboard");
        setAnalytics(data?.data || data);
      } catch (err) {
        const message =
          err?.response?.data?.message ||
          err?.customMessage ||
          "Failed to load dashboard analytics";

        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardAnalytics();
  }, []);

  const weakTopics = analytics?.skillInsights?.weakestTopics || [];
  const recentActivity = analytics?.recentActivity || [];

  const stats = useMemo(
    () => [
      {
        label: "Sessions",
        value: analytics?.overview?.totalSessions || 0,
      },
      {
        label: "Questions Answered",
        value: analytics?.overview?.totalAttempts || 0,
      },
      {
        label: "Average Score",
        value: `${Math.round(analytics?.overview?.averageScore || 0)}%`,
      },
      {
        label: "Weak Topics",
        value: weakTopics.length,
      },
    ],
    [analytics, weakTopics.length]
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-8 md:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <Card as="section" className="rounded-3xl p-6 shadow-xl md:p-8">
          <p className="text-sm text-indigo-400 mb-2">Welcome back</p>
          <h1 className="text-3xl md:text-4xl font-bold">
            {userInfo?.name || "User"}, keep building your interview strength
          </h1>
          <p className="text-slate-400 mt-3 max-w-2xl">
            Your AI interview coach tracks performance, finds weak areas, and adapts
            every next question based on your answers.
          </p>
        </Card>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            <Card className="p-5 sm:col-span-2 lg:col-span-4">
              <Loader label="Loading dashboard stats..." />
            </Card>
          ) : (
            stats.map((item) => (
              <Card
                key={item.label}
                className="p-5"
              >
                <p className="text-sm text-slate-400">{item.label}</p>
                <h3 className="text-3xl font-bold mt-2">{item.value}</h3>
              </Card>
            ))
          )}
        </section>

        {error ? (
          <Card className="border-rose-500/30 bg-rose-500/10 p-4">
            <p className="text-sm text-rose-200">{error}</p>
          </Card>
        ) : null}

        <section>
          <div className="flex items-end justify-between gap-4 mb-4">
            <div>
              <h2 className="text-2xl font-semibold">Quick Actions</h2>
              <p className="text-slate-400 text-sm mt-1">
                Jump into the most important parts of the platform.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action) => (
              <Card
                as={Link}
                key={action.title}
                to={action.to}
                className="group block p-6 transition-all hover:border-indigo-500"
              >
                <h3 className="text-xl font-semibold group-hover:text-indigo-400 transition-colors">
                  {action.title}
                </h3>
                <p className="text-slate-400 mt-2 text-sm">{action.desc}</p>
                <span className="inline-flex mt-5 text-sm text-indigo-400">
                  Open →
                </span>
              </Card>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-3">Current Focus</h2>
            {weakTopics.length > 0 ? (
              <div className="mb-4 flex flex-wrap gap-2">
                {weakTopics.slice(0, 5).map((topic) => (
                  <span
                    key={topic}
                    className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-sm text-rose-300"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-sm mb-4">
                No weak topics yet. Start answering questions to build your focus list.
              </p>
            )}
            <Link
              to="/interview/history"
              className="inline-flex rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-sm font-medium transition-all"
            >
              Practice Focus Areas
            </Link>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-3">Recent Activity</h2>
            {recentActivity.length > 0 ? (
              <div className="mb-4 space-y-3">
                {recentActivity.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3"
                  >
                    <p className="text-xs text-slate-400">{item.role || "Interview"}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-200">
                      {item.question || "Question attempt"}
                    </p>
                    <p className="mt-2 text-xs text-indigo-300">
                      Score: {Math.round(item.score || 0)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-sm mb-4">
                No answer attempts yet. Your latest evaluated answers will appear here.
              </p>
            )}
            <Link
              to="/analytics"
              className="inline-flex rounded-xl border border-slate-700 hover:border-indigo-500 px-4 py-2 text-sm font-medium transition-all"
            >
              Open Analytics
            </Link>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default DashboardPage;
