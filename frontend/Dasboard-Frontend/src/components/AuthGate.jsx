import { useAuth } from "../context/AuthContext";

export default function AuthGate({ children }) {
  const { isAuthReady } = useAuth();

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
        <div className="h-6 w-6 rounded-full border-2 border-white/10 border-t-amber-500 animate-spin" />
      </div>
    );
  }

  return children;
}
