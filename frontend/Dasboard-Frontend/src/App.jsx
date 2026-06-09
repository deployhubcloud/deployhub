import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import PublicRoute from "./routes/PublicRoute";
import Login from "./Pages/Login";
import Signup from "./Pages/Signup";
import Home from "./Pages/Home";
import Sessions from "./Pages/Sessions";
import PrivateLayout from "./layouts/PrivateLayout";
import Profile from "./Pages/Profile";
import Projects from "./Pages/Projects";
import NewProject from "./Pages/NewProject";

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
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />

      <Route element={<Protected><PrivateLayout /></Protected>}>
        <Route path="/" element={<Projects />} />
        <Route path="/Builds" element={<Home />} />
        <Route path="/projects/new/:type" element={<NewProject />} />
        <Route path="/settings/sessions" element={<Sessions />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      <Route
        path="*"
        element={
          <div className="min-h-screen bg-[#050810] flex items-center justify-center">
            <div className="text-center">
              <div className="font-syne font-black text-8xl text-[#00e5ff]/20 mb-4">404</div>
              <div className="text-white font-semibold text-xl mb-2">Page not found</div>
              <div className="text-gray-500 text-sm mb-6">The page you're looking for doesn't exist.</div>
              <a href="/" className="bg-[#00e5ff] text-black font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-cyan-300 transition-all">
                Go Home
              </a>
            </div>
          </div>
        }
      />
    </Routes>
  );
}
