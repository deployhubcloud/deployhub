import { useEffect, useState } from "react";
import { SERVICE_DOWN_EVENT } from "../api/apiclient";

export default function ServiceDownOverlay() {
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const handler = (e) => {
      setMessage(e.detail?.message || "Service temporarily unavailable.");
      setShow(true);
    };
    window.addEventListener(SERVICE_DOWN_EVENT, handler);
    return () => window.removeEventListener(SERVICE_DOWN_EVENT, handler);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75">
      <div className="w-full max-w-sm rounded-xl overflow-hidden text-center bg-[#111114] border border-white/[0.06]">
        <div className="p-6 flex flex-col items-center">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 bg-red-500/10 border border-red-500/20">
            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                d="M12 9v3.75m9-1.5a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">Service unavailable</h3>
          <p className="text-sm text-neutral-500 mb-6">{message}</p>
          <div className="flex items-center gap-3 w-full">
            <button onClick={() => setShow(false)}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-white/10 text-neutral-300 hover:bg-white/5 transition-colors">
              Dismiss
            </button>
            <button onClick={() => window.location.reload()}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-black transition-colors">
              Retry
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
