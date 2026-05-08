"use client";

import { useState, useEffect } from "react";
import { fetchSkills, createSkill, updateSkill, deleteSkill, type Skill } from "@/lib/api";

const F = {
  display: '"Barlow Condensed", sans-serif',
  body: '"IBM Plex Sans", sans-serif',
};

function TagInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [input, setInput] = useState("");

  function addItem() {
    const trimmed = input.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInput("");
  }

  function removeItem(item: string) {
    onChange(value.filter((i) => i !== item));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", minHeight: "32px" }}>
        {value.map((item) => (
          <span
            key={item}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              padding: "3px 10px",
              background: "rgba(255,87,34,0.10)",
              border: "1px solid rgba(255,87,34,0.25)",
              borderRadius: "4px",
              fontFamily: F.body,
              fontSize: "12px",
              color: "#E2E2E4",
            }}
          >
            {item}
            <button
              onClick={() => removeItem(item)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#7A7A84", padding: 0, fontSize: "13px", lineHeight: 1 }}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addItem(); } }}
          placeholder="Type skill, press Enter or comma"
          style={{
            flex: 1,
            background: "#161618",
            border: "1px solid #222224",
            borderRadius: "5px",
            padding: "7px 10px",
            fontFamily: F.body,
            fontSize: "12px",
            color: "#E2E2E4",
            outline: "none",
          }}
        />
        <button
          onClick={addItem}
          style={{
            padding: "7px 14px",
            background: "#1E1E20",
            border: "1px solid #2A2A2C",
            borderRadius: "5px",
            fontFamily: F.body,
            fontSize: "12px",
            color: "#B0BEC5",
            cursor: "pointer",
          }}
        >
          Add
        </button>
      </div>
    </div>
  );
}

function SkillRow({
  skill,
  onSave,
  onDelete,
}: {
  skill: Skill;
  onSave: (id: number, category: string, items: string[]) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [category, setCategory] = useState(skill.category);
  const [items, setItems] = useState<string[]>(skill.items);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await onSave(skill.id, category, items);
    setSaving(false);
    setEditing(false);
  }

  function handleCancel() {
    setCategory(skill.category);
    setItems(skill.items);
    setEditing(false);
  }

  return (
    <div style={{
      padding: "16px",
      background: "#161618",
      border: "1px solid #222224",
      borderRadius: "7px",
    }}>
      {editing ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{
              background: "#0D0D0E",
              border: "1px solid #2A2A2C",
              borderRadius: "5px",
              padding: "7px 10px",
              fontFamily: F.display,
              fontSize: "13px",
              fontWeight: 700,
              letterSpacing: "0.06em",
              color: "#E2E2E4",
              outline: "none",
            }}
          />
          <TagInput value={items} onChange={setItems} />
          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
            <button onClick={handleCancel} style={{ padding: "6px 14px", background: "none", border: "1px solid #2A2A2C", borderRadius: "5px", fontFamily: F.body, fontSize: "12px", color: "#7A7A84", cursor: "pointer" }}>
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving} style={{ padding: "6px 14px", background: "rgba(255,87,34,0.15)", border: "1px solid rgba(255,87,34,0.35)", borderRadius: "5px", fontFamily: F.body, fontSize: "12px", color: "#FF8C42", cursor: "pointer" }}>
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
          <div style={{ flex: 1 }}>
            <span style={{ fontFamily: F.display, fontSize: "13px", fontWeight: 700, letterSpacing: "0.06em", color: "#E2E2E4" }}>
              {skill.category}
            </span>
            <div style={{ marginTop: "8px", display: "flex", flexWrap: "wrap", gap: "5px" }}>
              {skill.items.map((item) => (
                <span key={item} style={{ padding: "2px 8px", background: "#1E1E20", border: "1px solid #2A2A2C", borderRadius: "3px", fontFamily: F.body, fontSize: "11px", color: "#B0BEC5" }}>
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
            <button onClick={() => setEditing(true)} style={{ padding: "5px 12px", background: "none", border: "1px solid #2A2A2C", borderRadius: "5px", fontFamily: F.body, fontSize: "11px", color: "#7A7A84", cursor: "pointer" }}>
              Edit
            </button>
            <button onClick={() => onDelete(skill.id)} style={{ padding: "5px 12px", background: "none", border: "1px solid rgba(248,113,113,0.20)", borderRadius: "5px", fontFamily: F.body, fontSize: "11px", color: "#F87171", cursor: "pointer" }}>
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AddSkillForm({ onAdd }: { onAdd: (category: string, items: string[]) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [items, setItems] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!category.trim() || items.length === 0) return;
    setSaving(true);
    await onAdd(category.trim(), items);
    setCategory("");
    setItems([]);
    setSaving(false);
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          width: "100%",
          padding: "12px",
          background: "none",
          border: "1px dashed #2A2A2C",
          borderRadius: "7px",
          fontFamily: F.body,
          fontSize: "13px",
          color: "#5C5C66",
          cursor: "pointer",
          textAlign: "center",
        }}
      >
        + Add skill category
      </button>
    );
  }

  return (
    <div style={{ padding: "16px", background: "#161618", border: "1px solid rgba(255,87,34,0.18)", borderRadius: "7px", display: "flex", flexDirection: "column", gap: "10px" }}>
      <input
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        placeholder="Category name (e.g. AI Workflow)"
        style={{
          background: "#0D0D0E",
          border: "1px solid #2A2A2C",
          borderRadius: "5px",
          padding: "7px 10px",
          fontFamily: F.display,
          fontSize: "13px",
          fontWeight: 700,
          letterSpacing: "0.06em",
          color: "#E2E2E4",
          outline: "none",
        }}
      />
      <TagInput value={items} onChange={setItems} />
      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
        <button onClick={() => { setOpen(false); setCategory(""); setItems([]); }} style={{ padding: "6px 14px", background: "none", border: "1px solid #2A2A2C", borderRadius: "5px", fontFamily: F.body, fontSize: "12px", color: "#7A7A84", cursor: "pointer" }}>
          Cancel
        </button>
        <button
          onClick={handleAdd}
          disabled={saving || !category.trim() || items.length === 0}
          style={{ padding: "6px 14px", background: "linear-gradient(135deg, #FF5722, #FF8C42)", border: "none", borderRadius: "5px", fontFamily: F.body, fontSize: "12px", color: "#fff", cursor: "pointer" }}
        >
          {saving ? "Adding..." : "Add"}
        </button>
      </div>
    </div>
  );
}

export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSkills()
      .then(setSkills)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleAdd(category: string, items: string[]) {
    try {
      const skill = await createSkill(category, items);
      setSkills((prev) => [...prev, skill]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add skill");
    }
  }

  async function handleSave(id: number, category: string, items: string[]) {
    try {
      const skill = await updateSkill(id, category, items);
      setSkills((prev) => prev.map((s) => (s.id === id ? skill : s)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update skill");
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteSkill(id);
      setSkills((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete skill");
    }
  }

  return (
    <main style={{ flex: 1, padding: "24px 32px", background: "#0D0D0E", minHeight: 0 }}>
      <div style={{ maxWidth: "640px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ fontFamily: F.display, fontSize: "28px", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "#E2E2E4", margin: 0, lineHeight: 1 }}>
            SKILLS<span style={{ color: "#FF5722" }}> /</span>
          </h1>
          <p style={{ fontFamily: F.body, fontSize: "12px", color: "#7A7A84", margin: "5px 0 0 0" }}>
            Your skill database — Forge pulls from here when tailoring your CV
          </p>
        </div>

        {error && (
          <div style={{ marginBottom: "16px", padding: "10px 14px", background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.20)", borderRadius: "7px", fontFamily: F.body, fontSize: "13px", color: "#F87171" }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ fontFamily: F.body, fontSize: "13px", color: "#5C5C66" }}>Loading...</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {skills.map((skill) => (
              <SkillRow key={skill.id} skill={skill} onSave={handleSave} onDelete={handleDelete} />
            ))}
            <AddSkillForm onAdd={handleAdd} />
          </div>
        )}
      </div>
    </main>
  );
}
