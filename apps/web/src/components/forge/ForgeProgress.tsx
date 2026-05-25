"use client";

import { useState, useEffect } from "react";

const STEPS = [
  { label: "Analyzing job description", sub: "Extracting keywords and requirements..." },
  { label: "Scoring original CV", sub: "Calculating ATS keyword match..." },
  { label: "Forging CV sections", sub: "Rewriting with job-specific keywords..." },
  { label: "Reconstructing document", sub: "Building structured CV output..." },
  { label: "Calculating final score", sub: "Measuring improvement..." },
];

// Advance to next step after these elapsed seconds: [3, 7, 37, 42]
const THRESHOLDS = [3, 7, 37, 42];

export default function ForgeProgress() {
  const [step, setStep] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const ticker = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(ticker);
  }, []);

  useEffect(() => {
    const nextThreshold = THRESHOLDS[step];
    if (nextThreshold !== undefined && elapsed >= nextThreshold) {
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
    }
  }, [elapsed, step]);

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  return (
    <div className="bg-forge-surface border border-[rgba(255,87,34,0.14)] rounded-[10px] p-6 w-full max-w-[340px]">
      <p className="font-display text-[10px] font-bold tracking-[0.18em] uppercase text-forge-orange mb-5 m-0">
        Forging in progress
      </p>
      <div className="flex flex-col gap-3 mt-5">
        {STEPS.map((s, i) => {
          const isDone = i < step;
          const isActive = i === step;
          return (
            <div key={i} className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-[3px] w-[14px] h-[14px] flex items-center justify-center">
                {isDone ? (
                  <span className="text-forge-orange text-[11px] leading-none">✓</span>
                ) : (
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      isActive ? "bg-forge-orange animate-pulse" : "bg-forge-border"
                    }`}
                  />
                )}
              </div>
              <div>
                <p className={`font-body text-[13px] leading-none m-0 ${
                  isDone ? "text-forge-muted" : isActive ? "text-forge-text" : "text-forge-ghost"
                }`}>
                  {s.label}
                </p>
                {isActive && (
                  <p className="font-body text-[11px] text-forge-muted m-0 mt-1">{s.sub}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <p className="font-body text-[11px] text-forge-muted text-right mt-5 mb-0">
        {mm}:{ss}
      </p>
    </div>
  );
}
