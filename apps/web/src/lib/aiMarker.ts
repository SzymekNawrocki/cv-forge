export const AI_MARKER = /\[AI:\s*([^\]]+)\]/gi;

export function stripMarkers(s: string): string {
  return s.replace(/\[AI:\s*([^\]]+)\]/gi, "$1");
}

export function splitMarkers(s: string): { text: string; ai: boolean }[] {
  const parts = s.split(/(\[AI:\s*[^\]]+\])/gi);
  return parts
    .filter((p) => p !== "")
    .map((part) => {
      const m = /^\[AI:\s*(.*)\]$/i.exec(part);
      if (m) return { text: m[1], ai: true };
      return { text: part, ai: false };
    });
}

export function countMarkers(s: string): number {
  return (s.match(/\[AI:\s*([^\]]+)\]/gi) ?? []).length;
}
