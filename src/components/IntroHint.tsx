"use client";

import { useEffect, useState } from "react";

const VISIBLE_MS = 1500;
const FADE_MS = 500;

/**
 * A one-time hint that covers the page with a blurred backdrop when the chart
 * first loads, stays for three seconds, then fades out and removes itself.
 * Clicking anywhere starts the fade early.
 */
export function IntroHint() {
  const [phase, setPhase] = useState<"shown" | "fading" | "gone">("shown");

  // Each phase schedules the next one, so an early click still gets a full fade.
  useEffect(() => {
    if (phase === "gone") return;
    const next = phase === "shown" ? "fading" : "gone";
    const timer = setTimeout(() => setPhase(next), phase === "shown" ? VISIBLE_MS : FADE_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  if (phase === "gone") return null;

  return (
    <div
      role="status"
      onClick={() => setPhase("fading")}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-bg/40 px-4 backdrop-blur-md transition-opacity duration-500 ease-out motion-reduce:transition-none ${
        phase === "fading" ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <p className="max-w-md rounded-[2px] border border-rule-strong bg-bg px-6 py-4 text-center text-[15px] font-medium shadow-lg">
        Click any of the highlighted elements to see its closest passage.
      </p>
    </div>
  );
}
