import { useAuth } from "../context/AuthContext";

export default function AuthGate({ children }) {
  const { isAuthReady } = useAuth();

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-[#050810] flex items-center justify-center text-white">
        <div className="h-6 w-6 rounded-full border-2 border-white/15 border-t-[#00e5ff] animate-spin" />
      </div>
    );
  }

  return children;
}
