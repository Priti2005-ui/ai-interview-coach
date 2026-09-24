// src/pages/resume/ResumeUploadPage.jsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import apiClient from "../../services/apiClient.js";

const ResumeUploadPage = () => {
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [numberOfQuestions, setNumberOfQuestions] = useState(5);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      toast.error("Please upload a resume file");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("resume", file);
      formData.append("numberOfQuestions", numberOfQuestions);

      const { data } = await apiClient.post("/resume/session", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const sessionId = data?.data?.session?._id || data?.session?._id;

      toast.success("Resume-based session created successfully");

      if (sessionId) {
        navigate(`/interview/session/${sessionId}`);
      } else {
        navigate("/resume");
      }
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.customMessage ||
        "Failed to create resume session";

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-6 md:px-8">
      <div className="max-w-3xl mx-auto">
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl">
          <p className="text-sm text-indigo-400">Resume-Based Interview</p>
          <h1 className="text-3xl font-bold mt-1">Upload Resume</h1>
          <p className="text-slate-400 mt-3">
            The AI will analyze your resume and generate role-specific interview
            questions based on your experience, skills, and projects.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5 mt-8">
            <div>
              <label className="block text-sm text-slate-300 mb-2">
                Resume File
              </label>
              <input
                type="file"
                accept=".pdf,.txt,.md"
                onChange={handleFileChange}
                className="w-full rounded-2xl bg-slate-950 border border-slate-800 px-4 py-3 text-white outline-none focus:border-indigo-500 file:mr-4 file:rounded-xl file:border-0 file:bg-indigo-600 file:px-4 file:py-2 file:text-white file:cursor-pointer"
              />
              <p className="text-xs text-slate-500 mt-2">
                Supported formats: PDF, TXT, MD
              </p>
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">
                Number of Questions
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={numberOfQuestions}
                onChange={(e) => setNumberOfQuestions(Number(e.target.value))}
                className="w-full rounded-2xl bg-slate-950 border border-slate-800 px-4 py-3 text-white outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-indigo-600 hover:bg-indigo-500 transition-all py-3 font-semibold disabled:opacity-60"
            >
              {loading ? "Analyzing Resume..." : "Generate Resume-Based Session"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default ResumeUploadPage;
