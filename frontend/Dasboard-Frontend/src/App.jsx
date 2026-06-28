import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import PublicRoute from "./routes/PublicRoute";
import Login from "./Pages/Login";
import Signup from "./Pages/Signup";
import { Builds } from "./Pages/Builds";
import Sessions from "./Pages/Sessions";
import PrivateLayout from "./layouts/PrivateLayout";
import Profile from "./Pages/Profile";
import Projects from "./Pages/Projects";
import NewProject from "./Pages/NewProject";
import ProjectLayout from "./layouts/ProjectLayout";
import Overview from "./Pages/Overview";
import ServiceDownOverlay from "./components/ServiceDownOverlay";
import { Builds as ProjectBuilds } from "./Pages/Project/Builds";
import Logs from "./Pages/Project/Logs";
import { Metrics } from "./Pages/Project/Metrics";
import { Settings } from "./Pages/Project/Settings";
import { Domain } from "./Pages/Project/Domain";
import { Billing } from "./Pages/Project/Billing";
import { BuildLogs } from "./Pages/Project/BuildLogs";

function Protected({ children }) {
  const { isAuthenticated, isAuthReady } = useAuth();
  const location = useLocation();

  if (!isAuthReady) return null;

  return isAuthenticated
    ? children
    : <Navigate to="/login" replace state={{ from: location }} />;
}

export default function App() {
  return (
    <>
      <ServiceDownOverlay />
      <Routes>

        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />

        <Route element={<Protected><PrivateLayout /></Protected>}>
          <Route path="/" element={<Projects />} />
          <Route path="/Builds" element={<Builds />} />
          <Route path="/projects/new/:type" element={<NewProject />} />
          <Route path="/settings/sessions" element={<Sessions />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        <Route element={<Protected><ProjectLayout /></Protected>}>
          <Route path="/project/:id" element={<Overview />} />
          <Route path="/project/:id/builds" element={<ProjectBuilds />} />
          <Route path="/project/:id/logs" element={<Logs />} />
          <Route path="/project/:id/logs/:buildId" element={<BuildLogs />} />
          <Route path="/project/:id/metrics" element={<Metrics />} />
          <Route path="/project/:id/settings" element={<Settings />} />
          <Route path="/project/:id/domains" element={<Domain />} />
          <Route path="/project/:id/billing" element={<Billing />} />
        </Route>

        <Route
          path="*"
          element={
            <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
              <div className="text-center">
                <div className="text-8xl font-semibold text-white/[0.06] mb-4">404</div>
                <div className="text-white font-semibold text-xl mb-2">Page not found</div>
                <div className="text-neutral-500 text-sm mb-6">The page you're looking for doesn't exist.</div>
                <a href="/" className="bg-amber-500 hover:bg-amber-400 text-black font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors">
                  Go Home
                </a>
              </div>
            </div>
          }
        />
      </Routes>
    </>
  );
}
