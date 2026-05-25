"use client";

import type { MasterCV } from "@/lib/api";

interface Props {
  cv: MasterCV;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  disabled: boolean;
}

export default function CVListRow({ cv, isSelected, onSelect, onDelete, disabled }: Props) {
  return (
    <div className="flex items-center gap-0.5">
      <button
        onClick={onSelect}
        className={`flex-1 text-left py-[9px] px-3 rounded-md font-body text-[13px] cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap transition-all duration-[180ms] min-w-0 border ${
          isSelected
            ? "font-medium text-forge-text border-[rgba(255,87,34,0.32)]"
            : "font-normal text-forge-hint border-transparent hover:bg-white/[0.025] hover:border-forge-line"
        }`}
        style={{
          background: isSelected
            ? "linear-gradient(135deg, rgba(255,87,34,0.08), rgba(22,22,24,0.95))"
            : undefined,
        }}
      >
        {cv.title}
      </button>
      <button
        onClick={onDelete}
        disabled={disabled}
        className="py-2 px-[9px] bg-transparent border-none cursor-pointer text-[17px] leading-none shrink-0 text-forge-hint hover:text-[#F87171] disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-[180ms]"
        title="Delete"
      >
        ×
      </button>
    </div>
  );
}
