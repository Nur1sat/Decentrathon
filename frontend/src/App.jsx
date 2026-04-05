import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));
const CandidateDetail = lazy(() => import("./pages/CandidateDetail.jsx"));
const Apply = lazy(() => import("./pages/Apply.jsx"));
const Stats = lazy(() => import("./pages/Stats.jsx"));
const AiInsights = lazy(() => import("./pages/AiInsights.jsx"));
const Settings = lazy(() => import("./pages/Settings.jsx"));

function AppLoader() {
  return (
    <div className="min-h-screen bg-surface-100 flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-2 border-surface-400 border-t-primary-400 animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<AppLoader />}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/candidates" element={<Dashboard />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/ai-insights" element={<AiInsights />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/apply" element={<Apply />} />
          <Route path="/candidates/:id" element={<CandidateDetail />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
