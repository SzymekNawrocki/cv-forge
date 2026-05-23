import { describe, it, expect } from "vitest";
import { stripMarkers, splitMarkers, countMarkers } from "./aiMarker";

describe("stripMarkers", () => {
  it("strips a single marker", () => {
    expect(stripMarkers("Used [AI: Docker] in prod")).toBe("Used Docker in prod");
  });

  it("strips multiple markers in one string", () => {
    expect(stripMarkers("[AI: Docker] and [AI: Kubernetes]")).toBe("Docker and Kubernetes");
  });

  it("passes through text with no markers unchanged", () => {
    expect(stripMarkers("No markers here")).toBe("No markers here");
  });

  it("strips case-insensitively", () => {
    expect(stripMarkers("[ai: Python]")).toBe("Python");
  });

  it("handles extra whitespace inside marker", () => {
    expect(stripMarkers("[AI:  Node.js ]")).toBe("Node.js ");
  });
});

describe("splitMarkers", () => {
  it("returns single non-AI segment for plain text", () => {
    expect(splitMarkers("hello world")).toEqual([{ text: "hello world", ai: false }]);
  });

  it("splits a single AI marker", () => {
    const result = splitMarkers("Built [AI: Docker] for containers");
    expect(result).toEqual([
      { text: "Built ", ai: false },
      { text: "Docker", ai: true },
      { text: " for containers", ai: false },
    ]);
  });

  it("splits multiple AI markers", () => {
    const result = splitMarkers("[AI: React] and [AI: TypeScript]");
    expect(result).toEqual([
      { text: "React", ai: true },
      { text: " and ", ai: false },
      { text: "TypeScript", ai: true },
    ]);
  });

  it("handles adjacent markers", () => {
    const result = splitMarkers("[AI: A][AI: B]");
    expect(result).toEqual([
      { text: "A", ai: true },
      { text: "B", ai: true },
    ]);
  });

  it("returns empty array for empty string", () => {
    expect(splitMarkers("")).toEqual([]);
  });
});

describe("countMarkers", () => {
  it("counts zero markers in plain text", () => {
    expect(countMarkers("no markers")).toBe(0);
  });

  it("counts one marker", () => {
    expect(countMarkers("used [AI: Docker]")).toBe(1);
  });

  it("counts multiple markers", () => {
    expect(countMarkers("[AI: A], [AI: B], [AI: C]")).toBe(3);
  });
});
