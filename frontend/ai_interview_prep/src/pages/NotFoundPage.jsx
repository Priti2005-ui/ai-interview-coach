// src/pages/NotFoundPage.jsx

import { Link } from "react-router-dom";

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        <div className="inline-flex items-center justify-center w-28 h-28 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-8">
          <span className="text-5xl font-bold text-indigo-400">
            404
          </span>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Page Not Found
        </h1>

        <p className="text-slate-400 text-lg leading-7 max-w-md mx-auto">
          The page you are looking for does not exist or may have been moved.
          Continue your AI interview preparation from the dashboard.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 hover:bg-indigo-500 transition-all px-6 py-3 font-semibold"
          >
            Go To Dashboard
          </Link>

          <Link
            to="/interview/history"
            className="inline-flex items-center justify-center rounded-2xl border border-slate-700 hover:border-indigo-500 transition-all px-6 py-3 font-semibold"
          >
            View Sessions
          </Link>
        </div>

        <div className="mt-12 rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
          <p className="text-sm text-slate-400 mb-3">
            Suggested Actions
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            <Link
              to="/resume/upload"
              className="rounded-2xl border border-slate-800 bg-slate-950/60 hover:border-indigo-500 transition-all p-4"
            >
              <h3 className="font-semibold text-white">
                Resume Interview
              </h3>

              <p className="text-sm text-slate-400 mt-1">
                Upload your resume and generate AI interview sessions.
              </p>
            </Link>

            <Link
              to="/analytics"
              className="rounded-2xl border border-slate-800 bg-slate-950/60 hover:border-indigo-500 transition-all p-4"
            >
              <h3 className="font-semibold text-white">
                Analytics
              </h3>

              <p className="text-sm text-slate-400 mt-1">
                Track strengths, weak topics, and score trends.
              </p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;