"use client";

import { useState } from "react";
import type { CVSection } from "@/components/CVDocument";

const textareaClass = "w-full box-border bg-forge-base border border-forge-track rounded-[5px] py-2 px-2.5 font-body text-xs text-forge-steel resize-y outline-none leading-[1.6]";

export default function SectionEditor({
  section,
  onChange,
}: {
  section: CVSection;
  onChange: (updated: CVSection) => void;
}) {
  const [open, setOpen] = useState(false);

  function updateParagraph(content: string) { onChange({ ...section, content }); }
  function updateBullets(raw: string) {
    const items = raw.split("\n").map((l) => l.replace(/^[-•]\s*/, "").trim()).filter(Boolean);
    onChange({ ...section, items });
  }
  function updateEntryBullets(entryIdx: number, raw: string) {
    const bullets = raw.split("\n").map((l) => l.replace(/^[-•]\s*/, "").trim()).filter(Boolean);
    const entries = section.entries!.map((e, i) => i === entryIdx ? { ...e, bullets } : e);
    onChange({ ...section, entries });
  }

  const preview =
    section.type === "paragraph" ? (section.content ?? "").slice(0, 80) + "..."
    : section.type === "bullets" ? `${section.items?.length ?? 0} items`
    : `${section.entries?.length ?? 0} entries`;

  return (
    <div className="border-b border-forge-elevated">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-2.5 bg-none border-none cursor-pointer text-left"
      >
        <span className="font-display text-[11px] font-bold tracking-[0.12em] uppercase text-forge-steel">
          {section.heading}
        </span>
        <span className="font-body text-[10px] text-forge-hint">
          {open ? "▲" : "▼"} {!open && preview}
        </span>
      </button>
      {open && (
        <div className="pb-3">
          {section.type === "paragraph" && (
            <textarea
              value={section.content ?? ""}
              onChange={(e) => updateParagraph(e.target.value)}
              rows={5}
              className={textareaClass}
            />
          )}
          {section.type === "bullets" && (
            <textarea
              value={(section.items ?? []).join("\n")}
              onChange={(e) => updateBullets(e.target.value)}
              rows={Math.max(4, (section.items ?? []).length + 1)}
              className={textareaClass}
            />
          )}
          {section.type === "entries" && section.entries?.map((entry, i) => (
            <div key={i} className="mb-2.5">
              <div className="font-body text-[11px] text-forge-muted mb-1">
                <strong className="text-forge-steel">{entry.org}</strong> — {entry.role} — {entry.date}
              </div>
              <textarea
                value={entry.bullets.join("\n")}
                onChange={(e) => updateEntryBullets(i, e.target.value)}
                rows={Math.max(2, entry.bullets.length + 1)}
                className={textareaClass}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
