"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import Link from "next/link";
import { fetchMasterCVs, fetchSkills } from "@/lib/api";

type Step = 1 | 2 | 3;

function StepDot({ n, current }: { n: Step; current: Step }) {
  const done = n < current;
  const active = n === current;
  return (
    <div className={`w-6 h-6 rounded-full flex items-center justify-center font-display text-[11px] font-bold transition-all ${
      done ? "bg-forge-orange text-white" : active ? "bg-forge-elevated border-2 border-forge-orange text-forge-orange" : "bg-forge-elevated text-forge-muted"
    }`}>
      {done ? "✓" : n}
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [checking, setChecking] = useState(false);

  const { data: cvs } = useSWR("masterCVs", fetchMasterCVs, { refreshInterval: 2000 });
  const { data: skills } = useSWR("skills", fetchSkills, { refreshInterval: 2000 });

  const hasCV = (cvs?.length ?? 0) > 0;
  const hasSkills = (skills?.length ?? 0) > 0;

  // Auto-advance steps when data arrives
  useEffect(() => {
    if (step === 2 && hasCV) setStep(3);
  }, [hasCV, step]);

  function handleContinue() {
    if (step === 1) { setStep(2); return; }
    if (step === 2 && !hasCV) return;
    if (step === 3 && !hasSkills) return;
    router.push("/forge");
  }

  return (
    <main className="min-h-screen bg-forge-base flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-[520px]">
        {/* Progress dots */}
        <div className="flex items-center gap-3 mb-10">
          {([1, 2, 3] as Step[]).map((n) => (
            <div key={n} className="flex items-center gap-3">
              <StepDot n={n} current={step} />
              {n < 3 && <div className={`h-px flex-1 w-14 ${n < step ? "bg-forge-orange" : "bg-forge-elevated"}`} />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div>
            <h1 className="font-display text-[34px] font-extrabold tracking-[0.06em] uppercase text-forge-text leading-tight mb-4">
              Welcome to<br /><span className="text-forge-orange">CV Forge</span>
            </h1>
            <p className="font-body text-[15px] text-forge-muted leading-relaxed mb-8">
              CV Forge rewrites your CV for each job description using AI — inserting the right keywords to pass ATS filters. You review every change.
            </p>
            <div className="flex flex-col gap-3 mb-10">
              {[
                { n: 1, label: "Import or fill in your master CV" },
                { n: 2, label: "Add your skill categories" },
                { n: 3, label: "Paste a job description and forge" },
              ].map(({ n, label }) => (
                <div key={n} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-forge-elevated flex items-center justify-center font-display text-[10px] font-bold text-forge-orange shrink-0">{n}</div>
                  <span className="font-body text-[13px] text-forge-text">{label}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setStep(2)}
              className="w-full py-3 rounded-md font-display text-sm font-bold tracking-[0.12em] uppercase text-white border-none cursor-pointer"
              style={{ background: "linear-gradient(135deg, #FF5722, #FF8C42)" }}
            >
              Get Started
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="font-display text-[28px] font-extrabold tracking-[0.06em] uppercase text-forge-text mb-2">
              Add Your CV
            </h2>
            <p className="font-body text-[13px] text-forge-muted mb-8">
              Import your existing CV text, or fill in the form manually. The forge needs a master CV to rewrite from.
            </p>
            <div className="flex flex-col gap-3 mb-8">
              <Link
                href="/cv-manager?tab=import"
                className="py-3 px-5 rounded-md border border-forge-orange font-display text-[13px] font-bold tracking-[0.12em] uppercase text-forge-orange no-underline text-center hover:bg-[rgba(255,87,34,0.06)] transition-colors"
              >
                Import from Text
              </Link>
              <Link
                href="/cv-manager?tab=form"
                className="py-3 px-5 rounded-md border border-forge-border font-display text-[13px] font-bold tracking-[0.12em] uppercase text-forge-muted no-underline text-center hover:text-forge-text hover:border-forge-ghost transition-colors"
              >
                Fill In Manually
              </Link>
            </div>
            {hasCV && (
              <div className="py-3 px-4 bg-[rgba(76,175,80,0.08)] border border-[rgba(76,175,80,0.25)] rounded-md flex items-center gap-2">
                <span className="text-[#4caf50] text-sm">✓</span>
                <span className="font-body text-[13px] text-[#4caf50]">CV added! Moving to next step...</span>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="font-display text-[28px] font-extrabold tracking-[0.06em] uppercase text-forge-text mb-2">
              Add Your Skills
            </h2>
            <p className="font-body text-[13px] text-forge-muted mb-8">
              Skills help the AI target the right keywords for each job. Group them by category (e.g. "Frontend", "Backend", "Tools").
            </p>
            <Link
              href="/skills"
              className="inline-block py-3 px-6 rounded-md border border-forge-orange font-display text-[13px] font-bold tracking-[0.12em] uppercase text-forge-orange no-underline hover:bg-[rgba(255,87,34,0.06)] transition-colors mb-8"
            >
              Manage Skills
            </Link>
            {hasSkills && (
              <div className="py-3 px-4 bg-[rgba(76,175,80,0.08)] border border-[rgba(76,175,80,0.25)] rounded-md flex items-center gap-2 mb-6">
                <span className="text-[#4caf50] text-sm">✓</span>
                <span className="font-body text-[13px] text-[#4caf50]">Skills added!</span>
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => router.push("/forge")}
                className="flex-1 py-3 rounded-md font-display text-sm font-bold tracking-[0.12em] uppercase text-white border-none cursor-pointer"
                style={{ background: "linear-gradient(135deg, #FF5722, #FF8C42)" }}
              >
                {hasSkills ? "Start Forging" : "Skip for Now"}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
