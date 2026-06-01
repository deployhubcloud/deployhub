import { useEffect, useRef, useState } from "react";

const RATE_LIMIT_EVENT = "deployhub:rate-limit";
const NOTICE_VISIBLE_MS = 6000;

export default function RateLimitNotice() {
  const [notice, setNotice] = useState(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const handleRateLimit = (event) => {
      window.clearTimeout(timeoutRef.current);
      setNotice({
        message:
          event.detail?.message ||
          "Too many requests. Please wait a moment and try again.",
        retryAfter: event.detail?.retryAfter || null,
      });

      timeoutRef.current = window.setTimeout(() => {
        setNotice(null);
      }, NOTICE_VISIBLE_MS);
    };

    window.addEventListener(RATE_LIMIT_EVENT, handleRateLimit);
    if (import.meta.env.DEV) {
      window.__showRateLimitNotice = (message) => {
        window.dispatchEvent(
          new CustomEvent(RATE_LIMIT_EVENT, {
            detail: {
              message:
                message ||
                "Too many requests. Please wait a moment and try again.",
              retryAfter: null,
            },
          })
        );
      };
    }

    return () => {
      window.removeEventListener(RATE_LIMIT_EVENT, handleRateLimit);
      window.clearTimeout(timeoutRef.current);
      if (import.meta.env.DEV) {
        delete window.__showRateLimitNotice;
      }
    };
  }, []);

  if (!notice) return null;

  return (
    <div className="fixed inset-x-0 top-4 z-[9999] flex justify-center px-4 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-xl rounded-2xl border border-red-400/25 bg-[#100d12]/95 shadow-2xl shadow-red-950/40 backdrop-blur-xl">
        <div className="flex items-start gap-4 px-5 py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/15 text-sm font-black text-red-300 ring-1 ring-red-400/25">
            429
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold text-white">Too many requests</div>
            <div className="mt-1 text-sm leading-5 text-red-100/80">
              {notice.message}
            </div>
            {notice.retryAfter && (
              <div className="mt-2 text-xs font-medium text-red-200/60">
                Retry after {notice.retryAfter}s
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setNotice(null)}
            aria-label="Dismiss rate limit notice"
            className="rounded-full p-1.5 text-red-100/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <span className="block text-lg leading-none">&times;</span>
          </button>
        </div>
      </div>
    </div>
  );
}
