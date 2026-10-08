import { Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import CalendarPage from "./pages/CalendarPage";
import AddEntry from "./pages/AddEntry";
import History from "./pages/History";
import Insights from "./pages/Insights";
import PlaceholderPage from "./pages/PlaceholderPage";
import AppShell from "./components/AppShell";
import ProtectedRoute from "./components/ProtectedRoute";
import { Sparkles, ShieldCheck, Settings as SettingsIcon } from "lucide-react";
import PrivacyCenter from "./pages/PrivacyCenter";
import Settings from "./pages/Settings";

const shell = (node) => (
  <ProtectedRoute>
    <AppShell>{node}</AppShell>
  </ProtectedRoute>
);
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={shell(<Dashboard />)} />
      <Route path="/calendar" element={shell(<CalendarPage />)} />
      <Route path="/entry" element={shell(<AddEntry />)} />
      <Route path="/history" element={shell(<History />)} />
      <Route path="/insights" element={shell(<Insights />)} />
     <Route
  path="/privacy"
  element={shell(<PrivacyCenter />)}
/>
     <Route
  path="/settings"
  element={shell(<Settings />)}
/>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
