"use client";

import { useState, useEffect, useTransition } from "react";
import { getProfile, updateProfile, type UserProfile } from "@/lib/api";

const F = {
  display: '"Barlow Condensed", sans-serif',
  body: '"IBM Plex Sans", sans-serif',
  mono: '"IBM Plex Mono", "Courier New", monospace',
};

const inputStyle = {
  background: '#161618',
  border: '1px solid #222224',
  borderRadius: '6px',
  padding: '10px 14px',
  fontFamily: F.body,
  fontSize: '13px',
  color: '#E2E2E4',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box' as const,
};

const labelStyle = {
  fontFamily: F.display,
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase' as const,
  color: '#9A9AA4',
  marginBottom: '6px',
  display: 'block',
};

function Field({
  label,
  value,
  onChange,
  placeholder,
  isLink,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  isLink?: boolean;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      <label style={labelStyle}>{label}</label>
      <div style={{ position: 'relative' }}>
        {isLink && (
          <span style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#FF5722',
            fontFamily: F.mono,
            fontSize: '12px',
            pointerEvents: 'none',
          }}>
            ↗
          </span>
        )}
        <input
          className="forge-input"
          style={{ ...inputStyle, paddingLeft: isLink ? '30px' : '14px' }}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      </div>
      {isLink && value && (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontFamily: F.body,
            fontSize: '11px',
            color: '#FF5722',
            marginTop: '4px',
            paddingLeft: '2px',
            textDecoration: 'none',
            opacity: 0.8,
          }}
        >
          {value}
        </a>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const [form, setForm] = useState({
    name: "",
    job_title: "",
    email: "",
    phone: "",
    location: "",
    github_url: "",
    portfolio_url: "",
  });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getProfile().then((p) => {
      setForm({
        name: p.name ?? "",
        job_title: p.job_title ?? "",
        email: p.email ?? "",
        phone: p.phone ?? "",
        location: p.location ?? "",
        github_url: p.github_url ?? "",
        portfolio_url: p.portfolio_url ?? "",
      });
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  function set(field: keyof typeof form) {
    return (v: string) => setForm((prev) => ({ ...prev, [field]: v }));
  }

  function handleSave() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        await updateProfile({
          name: form.name || null,
          job_title: form.job_title || null,
          email: form.email || null,
          phone: form.phone || null,
          location: form.location || null,
          github_url: form.github_url || null,
          portfolio_url: form.portfolio_url || null,
        } as Partial<UserProfile>);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Save failed");
      }
    });
  }

  return (
    <main style={{ flex: 1, background: '#0D0D0E', padding: '40px 36px', maxWidth: '560px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontFamily: F.display,
          fontSize: '28px',
          fontWeight: 800,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: '#E2E2E4',
          margin: 0,
        }}>
          PROFILE<span style={{ color: '#FF5722' }}> /</span> SETTINGS
        </h1>
        <p style={{ fontFamily: F.body, fontSize: '13px', color: '#A8A8B4', marginTop: '6px' }}>
          Global defaults auto-filled when creating a new CV. Links appear in every tailored PDF.
        </p>
      </div>

      {!loaded ? (
        <p style={{ fontFamily: F.body, fontSize: '13px', color: '#9A9AA4' }}>Loading...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <SectionLabel>Identity</SectionLabel>
          <Field label="Full Name" value={form.name} onChange={set("name")} placeholder="Szymon Nawrocki" />
          <Field label="Job Title" value={form.job_title} onChange={set("job_title")} placeholder="Web Developer" />

          <SectionLabel>Contact</SectionLabel>
          <Field label="Email" value={form.email} onChange={set("email")} placeholder="you@example.com" />
          <Field label="Phone" value={form.phone} onChange={set("phone")} placeholder="+48 000 000 000" />
          <Field label="Location" value={form.location} onChange={set("location")} placeholder="Warsaw" />

          <SectionLabel>Links</SectionLabel>
          <Field
            label="Portfolio URL"
            value={form.portfolio_url}
            onChange={set("portfolio_url")}
            placeholder="https://yoursite.com"
            isLink
          />
          <Field
            label="GitHub URL"
            value={form.github_url}
            onChange={set("github_url")}
            placeholder="https://github.com/username"
            isLink
          />

          {error && (
            <p style={{ fontFamily: F.body, fontSize: '13px', color: '#F87171', margin: 0 }}>{error}</p>
          )}

          <button
            onClick={handleSave}
            disabled={isPending}
            style={{
              alignSelf: 'flex-start',
              padding: '10px 28px',
              background: saved
                ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                : isPending
                  ? '#1E1E20'
                  : 'linear-gradient(135deg, #FF5722, #FF8C42)',
              border: isPending ? '1px solid #272729' : '1px solid transparent',
              borderRadius: '6px',
              cursor: isPending ? 'not-allowed' : 'pointer',
              fontFamily: F.display,
              fontSize: '13px',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: isPending ? '#3A3A3E' : '#fff',
              transition: 'all 0.2s ease',
            }}
          >
            {isPending ? 'Saving...' : saved ? 'Saved' : 'Save Profile'}
          </button>
        </div>
      )}
    </main>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      borderTop: '1px solid #1E1E20',
      paddingTop: '20px',
      fontFamily: '"Barlow Condensed", sans-serif',
      fontSize: '10px',
      fontWeight: 700,
      letterSpacing: '0.18em',
      textTransform: 'uppercase',
      color: '#5C5C70',
    }}>
      {children}
    </div>
  );
}
