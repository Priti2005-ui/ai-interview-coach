// src/routes/AppRoutes.jsx

import { Routes, Route, Navigate } from "react-router-dom";

import ProtectedRoute from "./ProtectedRoute.jsx";
import ProtectedLayout from "../components/layout/ProtectedLayout.jsx";

import LoginPage from "../pages/auth/LoginPage.jsx";
import RegisterPage from "../pages/auth/RegisterPage.jsx";

import DashboardPage from "../pages/dashboard/DashboardPage.jsx";

import SessionPage from "../pages/interview/SessionPage.jsx";
import SessionHistoryPage from "../pages/interview/SessionHistoryPage.jsx";
import SessionDetailPage from "../pages/interview/SessionDetailPage.jsx";

import ResumeUploadPage from "../pages/resume/ResumeUploadPage.jsx";
import ResumeProfilePage from "../pages/resume/ResumeProfilePage.jsx";

import AnalyticsPage from "../pages/analytics/AnalyticsPage.jsx";

import NotFoundPage from "../pages/NotFoundPage.jsx";

const withProtectedLayout = (page) => (
  <ProtectedRoute>
    <ProtectedLayout>{page}</ProtectedLayout>
  </ProtectedRoute>
);

const AppRoutes = () => {
  return (
    <Routes>
      {/* PUBLIC ROUTES */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* PROTECTED ROUTES */}
      <Route
        path="/dashboard"
        element={withProtectedLayout(<DashboardPage />)}
      />

      {/* INTERVIEW */}
      <Route
        path="/interview/history"
        element={withProtectedLayout(<SessionHistoryPage />)}
      />

      <Route
        path="/interview/session/:sessionId"
        element={withProtectedLayout(<SessionPage />)}
      />

      <Route
        path="/interview/details/:sessionId"
        element={withProtectedLayout(<SessionDetailPage />)}
      />

      {/* RESUME */}
      <Route
        path="/resume/upload"
        element={withProtectedLayout(<ResumeUploadPage />)}
      />

      <Route
        path="/resume/:sessionId"
        element={withProtectedLayout(<ResumeProfilePage />)}
      />

      {/* ANALYTICS */}
      <Route
        path="/analytics"
        element={withProtectedLayout(<AnalyticsPage />)}
      />

      {/* DEFAULT */}
      <Route
        path="/"
        element={<Navigate to="/dashboard" replace />}
      />

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
