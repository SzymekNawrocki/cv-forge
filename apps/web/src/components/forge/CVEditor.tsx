"use client";

import type { CVData, CVSection } from "@/components/CVDocument";
import SectionEditor from "./SectionEditor";

const inputClass = "w-full box-border bg-forge-base border border-[#222224] rounded py-[5px] px-2 font-body text-xs text-forge-text outline-none";

export default function CVEditor({ data, onChange }: { data: CVData; onChange: (d: CVData) => void }) {
  function updateSection(idx: number, updated: CVSection) {
    const sections = data.sections.map((s, i) => i === idx ? updated : s);
    onChange({ ...data, sections });
  }
  function updateField(field: keyof CVData, value: string) { onChange({ ...data, [field]: value }); }
  function updateContact(field: keyof CVData["contact"], value: string) {
    onChange({ ...data, contact: { ...data.contact, [field]: value } });
  }

  return (
    <div className="flex flex-col gap-0">
      <div className="border-b border-forge-elevated pb-3 mb-1">
        <div className="font-display text-[10px] font-bold tracking-[0.14em] uppercase text-[#5C5C66] mb-2">Header</div>
        <div className="grid grid-cols-2 gap-1.5">
          {([
            { label: "Name", field: "name" as keyof CVData, val: data.name },
            { label: "Title", field: "title" as keyof CVData, val: data.title },
          ]).map(({ label, field, val }) => (
            <div key={field}>
              <div className="font-body text-[10px] text-[#5C5C66] mb-[3px]">{label}</div>
              <input
                value={val as string}
                onChange={(e) => updateField(field, e.target.value)}
                className={inputClass}
              />
            </div>
          ))}
          {(["email", "phone", "portfolio", "github", "location"] as const).map((f) => (
            <div key={f}>
              <div className="font-body text-[10px] text-[#5C5C66] mb-[3px] capitalize">{f}</div>
              <input
                value={data.contact[f] ?? ""}
                onChange={(e) => updateContact(f, e.target.value)}
                className={inputClass}
              />
            </div>
          ))}
        </div>
      </div>
      {data.sections.map((section, i) => (
        <SectionEditor key={i} section={section} onChange={(u) => updateSection(i, u)} />
      ))}
    </div>
  );
}
