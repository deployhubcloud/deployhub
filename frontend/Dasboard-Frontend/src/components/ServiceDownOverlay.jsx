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
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
        >
            <div
                className="w-full max-w-sm rounded-2xl overflow-hidden text-center"
                style={{ background: "#0c1118", border: "1px solid rgba(255,255,255,0.09)" }}
            >
                <div
                    className="h-px w-full"
                    style={{ background: "linear-gradient(90deg, transparent, #f87171, transparent)" }}
                />

                <div className="p-6 flex flex-col items-center">
                    {/* Animated pulse rings */}
                    <div className="relative w-16 h-16 mb-5 flex items-center justify-center">
                        <span
                            className="absolute inset-0 rounded-full animate-ping"
                            style={{ background: "rgba(248,113,113,0.15)" }}
                        />
                        <span
                            className="absolute inset-2 rounded-full animate-pulse"
                            style={{ background: "rgba(248,113,113,0.1)" }}
                        />
                        <div
                            className="relative w-12 h-12 rounded-2xl flex items-center justify-center"
                            style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)" }}
                        >
                            <svg
                                className="w-6 h-6"
                                style={{ color: "#f87171" }}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.75}
                                    d="M12 9v3.75m9-1.5a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                                />
                            </svg>
                        </div>
                    </div>

                    <h3 className="font-syne font-black text-lg text-white mb-1">
                        Service unavailable
                    </h3>
                    <p className="text-sm mb-5" style={{ color: "#6b7280" }}>
                        {message}
                    </p>

                    {/* Animated dots */}
                    <div className="flex items-center gap-1.5 mb-5">
                        {[0, 1, 2].map((i) => (
                            <span
                                key={i}
                                className="w-1.5 h-1.5 rounded-full animate-bounce"
                                style={{
                                    background: "#f87171",
                                    animationDelay: `${i * 0.15}s`,
                                }}
                            />
                        ))}
                    </div>

                    <div className="flex items-center gap-3 w-full">
                        <button
                            onClick={() => setShow(false)}
                            className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105"
                            style={{
                                background: "rgba(255,255,255,0.05)",
                                color: "#9ca3af",
                                border: "1px solid rgba(255,255,255,0.08)",
                            }}
                        >
                            Dismiss
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-black transition-all hover:scale-105 flex items-center justify-center gap-2"
                            style={{
                                background: "linear-gradient(135deg, #f87171, #cc4f4f)",
                                boxShadow: "0 4px 16px rgba(248,113,113,0.25)",
                            }}
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2.5}
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                />
                            </svg>
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}