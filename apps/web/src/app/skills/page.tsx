"use client";

import { useState, useRef, KeyboardEvent } from "react";
import useSWR from "swr";
import { fetchSkills, createSkill, updateSkill, deleteSkill, type Skill } from "@/lib/api";

const inputClass = "bg-forge-surface border border-forge-track rounded-md py-2 px-3 font-body text-[13px] text-forge-text outline-none w-full";
const labelClass = "font-display text-[10px] font-bold tracking-[0.14em] uppercase text-forge-hint block mb-1.5";

function TagChip({ tag, onRemove }: { tag: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 py-0.5 px-2 bg-[rgba(255,87,34,0.10)] border border-[rgba(255,87,34,0.20)] rounded-full font-body text-[11px] text-forge-heat">
      {tag}
      <button onClick={onRemove} className="text-forge-muted hover:text-[#F87171] cursor-pointer border-none bg-transparent p-0 ml-0.5 leading-none">×</button>
    </span>
  );
}

function TagInput({ items, onChange }: { items: string[]; onChange: (items: string[]) => void }) {
  const [inputVal, setInputVal] = useState("");

  function addTag(val: string) {
    const trimmed = val.trim();
    if (trimmed && !items.includes(trimmed)) {
      onChange([...items, trimmed]);
    }
    setInputVal("");
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(inputVal);
    } else if (e.key === "Backspace" && !inputVal && items.length > 0) {
      onChange(items.slice(0, -1));
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5 p-2 bg-forge-surface border border-forge-track rounded-md min-h-[40px] cursor-text" onClick={() => {}}>
      {items.map((tag) => (
        <TagChip key={tag} tag={tag} onRemove={() => onChange(items.filter((t) => t !== tag))} />
      ))}
      <input
        className="bg-transparent border-none outline-none font-body text-[13px] text-forge-text min-w-[120px] py-0.5"
        placeholder={items.length === 0 ? "Type a skill, press Enter..." : "Add more..."}
        value={inputVal}
        onChange={(e) => setInputVal(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => { if (inputVal.trim()) addTag(inputVal); }}
      />
    </div>
  );
}

function SkillRow({ skill, onSave, onDelete }: {
  skill: Skill;
  onSave: (id: number, category: string, items: string[]) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [category, setCategory] = useState(skill.category);
  const [items, setItems] = useState(skill.items);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!category.trim()) return;
    setSaving(true);
    try {
      await onSave(skill.id, category.trim(), items);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <div className="flex items-start justify-between py-4 px-4 bg-forge-surface border border-forge-elevated rounded-lg group">
        <div className="flex-1 min-w-0">
          <p className="font-display text-[11px] font-bold tracking-[0.1em] uppercase text-forge-text mb-2">{skill.category}</p>
          <div className="flex flex-wrap gap-1.5">
            {skill.items.map((item) => (
              <span key={item} className="py-0.5 px-2 bg-[rgba(255,87,34,0.08)] border border-[rgba(255,87,34,0.15)] rounded-full font-body text-[11px] text-forge-heat">
                {item}
              </span>
            ))}
          </div>
        </div>
        <div className="flex gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setEditing(true)}
            className="py-1 px-2.5 bg-transparent border border-forge-border rounded-[4px] font-display text-[10px] font-bold tracking-[0.1em] uppercase text-forge-muted cursor-pointer hover:text-forge-text hover:border-forge-ghost transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(skill.id)}
            className="py-1 px-2.5 bg-transparent border border-[rgba(248,113,113,0.25)] rounded-[4px] font-display text-[10px] font-bold tracking-[0.1em] uppercase text-[#F87171] cursor-pointer hover:border-[rgba(248,113,113,0.50)] transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4 px-4 bg-forge-surface border border-forge-orange/30 rounded-lg flex flex-col gap-3">
      <div>
        <label className={labelClass}>Category</label>
        <input className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)} />
      </div>
      <div>
        <label className={labelClass}>Skills (press Enter to add)</label>
        <TagInput items={items} onChange={setItems} />
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving || !category.trim()}
          className="py-[7px] px-5 rounded-[5px] font-display text-[11px] font-bold tracking-[0.1em] uppercase text-white border-none cursor-pointer disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #FF5722, #FF8C42)" }}
        >
          {saving ? "Saving..." : "Save"}
        </button>
        <button
          onClick={() => { setEditing(false); setCategory(skill.category); setItems(skill.items); }}
          className="py-[7px] px-4 bg-transparent border border-forge-border rounded-[5px] font-display text-[11px] font-bold tracking-[0.1em] uppercase text-forge-muted cursor-pointer hover:text-forge-text transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function SkillsPage() {
  const { data: skills = [], mutate } = useSWR<Skill[]>("skills", fetchSkills);
  const [addCategory, setAddCategory] = useState("");
  const [addItems, setAddItems] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  async function handleAdd() {
    if (!addCategory.trim()) return;
    setAdding(true);
    setAddError(null);
    try {
      const skill = await createSkill(addCategory.trim(), addItems);
      mutate([skill, ...skills], { revalidate: false });
      setAddCategory("");
      setAddItems([]);
      setShowAdd(false);
    } catch {
      setAddError("Failed to save skill category.");
    } finally {
      setAdding(false);
    }
  }

  async function handleSave(id: number, category: string, items: string[]) {
    const updated = await updateSkill(id, category, items);
    mutate(skills.map((s) => (s.id === id ? updated : s)), { revalidate: false });
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this skill category?")) return;
    await deleteSkill(id);
    mutate(skills.filter((s) => s.id !== id), { revalidate: false });
  }

  return (
    <main className="min-h-screen bg-forge-base text-forge-text py-10 px-8">
      <div className="max-w-[640px] mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display font-extrabold text-[28px] tracking-[0.06em] uppercase text-forge-text m-0">
              SKILLS<span className="text-forge-orange"> /</span>
            </h1>
            <p className="font-body text-[13px] text-forge-muted mt-1">
              Skill categories injected into forged CVs for ATS keyword coverage.
            </p>
          </div>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="py-2.5 px-5 rounded-md font-display text-[12px] font-bold tracking-[0.12em] uppercase text-white border-none cursor-pointer"
            style={{ background: "linear-gradient(135deg, #FF5722, #FF8C42)" }}
          >
            {showAdd ? "Cancel" : "+ Add Category"}
          </button>
        </div>

        {/* Add new skill */}
        {showAdd && (
          <div className="mb-6 py-5 px-5 bg-forge-surface border border-forge-elevated rounded-lg flex flex-col gap-4">
            <div>
              <label className={labelClass}>Category Name</label>
              <input
                className={inputClass}
                placeholder="e.g. Frontend, Backend, Tools..."
                value={addCategory}
                onChange={(e) => setAddCategory(e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <label className={labelClass}>Skills (press Enter to add)</label>
              <TagInput items={addItems} onChange={setAddItems} />
            </div>
            {addError && <p className="font-body text-[12px] text-[#F87171] m-0">{addError}</p>}
            <button
              onClick={handleAdd}
              disabled={adding || !addCategory.trim()}
              className="self-start py-2.5 px-6 rounded-md font-display text-[12px] font-bold tracking-[0.12em] uppercase text-white border-none cursor-pointer disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #FF5722, #FF8C42)" }}
            >
              {adding ? "Saving..." : "Save Category"}
            </button>
          </div>
        )}

        {/* Empty state */}
        {skills.length === 0 && !showAdd && (
          <div className="text-center py-16">
            <p className="font-display text-forge-muted text-sm tracking-[0.08em] uppercase mb-2">No skills yet</p>
            <p className="font-body text-forge-hint text-[13px] mb-6">Add a category to help the AI target the right keywords.</p>
            <button
              onClick={() => setShowAdd(true)}
              className="py-2.5 px-6 rounded-md font-display text-[12px] font-bold tracking-[0.12em] uppercase text-white border-none cursor-pointer"
              style={{ background: "linear-gradient(135deg, #FF5722, #FF8C42)" }}
            >
              + Add Category
            </button>
          </div>
        )}

        {/* Skills list */}
        <div className="flex flex-col gap-3">
          {skills.map((skill) => (
            <SkillRow key={skill.id} skill={skill} onSave={handleSave} onDelete={handleDelete} />
          ))}
        </div>
      </div>
    </main>
  );
}
