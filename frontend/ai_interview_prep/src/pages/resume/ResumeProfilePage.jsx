import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import apiClient from "../../services/apiClient.js";

const ResumeProfilePage = () => {
  const { sessionId } = useParams();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data } = await apiClient.get(`/resume/${sessionId}`);
        const profileData = data?.data || data;

        setProfile(profileData);
      } catch (err) {
        const message =
          err?.response?.data?.message ||
          err?.customMessage ||
          "Failed to load resume profile";

        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) fetchProfile();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-slate-300">Loading resume profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center">
          <h2 className="text-2xl font-semibold">Could not load profile</h2>
          <p className="text-slate-400 mt-3">{error}</p>
          <Link
            to="/resume/upload"
            className="inline-flex mt-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 font-medium"
          >
            Upload Another Resume
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-6 md:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8">
          <p className="text-sm text-indigo-400">Resume Analysis</p>
          <h1 className="text-2xl md:text-3xl font-bold mt-1">
            {profile?.targetRole || "Resume Profile"}
          </h1>
          <p className="text-slate-400 mt-2">
            Experience: {profile?.experienceLevel || "N/A"}
          </p>

          <p className="text-slate-300 mt-6 leading-7 max-w-4xl">
            {profile?.summary || "No summary available."}
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <h2 className="text-xl font-semibold mb-4">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {(profile?.skills || []).length > 0 ? (
                profile.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="rounded-full border border-slate-700 px-3 py-1 text-sm text-slate-300"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <p className="text-slate-400 text-sm">No skills extracted.</p>
              )}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <h2 className="text-xl font-semibold mb-4">Suggested Topics</h2>
            <div className="flex flex-wrap gap-2">
              {(profile?.suggestedTopics || []).length > 0 ? (
                profile.suggestedTopics.map((topic, index) => (
                  <span
                    key={index}
                    className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-sm text-indigo-300"
                  >
                    {topic}
                  </span>
                ))
              ) : (
                <p className="text-slate-400 text-sm">No topics suggested.</p>
              )}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <h2 className="text-xl font-semibold mb-4">Strong Areas</h2>
            <ul className="space-y-2 text-slate-300 list-disc list-inside">
              {(profile?.strongAreas || []).length > 0 ? (
                profile.strongAreas.map((item, index) => <li key={index}>{item}</li>)
              ) : (
                <li>No strong areas identified.</li>
              )}
            </ul>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <h2 className="text-xl font-semibold mb-4">Weak Areas</h2>
            <ul className="space-y-2 text-slate-300 list-disc list-inside">
              {(profile?.weakAreas || []).length > 0 ? (
                profile.weakAreas.map((item, index) => <li key={index}>{item}</li>)
              ) : (
                <li>No weak areas identified.</li>
              )}
            </ul>
          </div>
        </section>

        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8">
          <h2 className="text-xl font-semibold mb-4">Projects</h2>
          <div className="space-y-3">
            {(profile?.projects || []).length > 0 ? (
              profile.projects.map((project, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-slate-300"
                >
                  {project}
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-sm">No projects extracted.</p>
            )}
          </div>
        </section>

        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8">
          <h2 className="text-xl font-semibold mb-4">Resume Session</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-300">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-slate-400">File Name</p>
              <p className="mt-2">{profile?.originalName || "N/A"}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-slate-400">Uploaded At</p>
              <p className="mt-2">
                {profile?.createdAt ? new Date(profile.createdAt).toLocaleString() : "N/A"}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-slate-400">Session Link</p>
              <Link
                to={profile?.session?._id ? `/interview/session/${profile.session._id}` : "/interview/history"}
                className="mt-2 inline-flex text-indigo-400 hover:text-indigo-300"
              >
                Open Session
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ResumeProfilePage;
