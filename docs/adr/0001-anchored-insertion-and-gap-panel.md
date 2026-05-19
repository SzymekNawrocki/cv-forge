# ADR-0001: Replace Fabrication with Anchored Insertion + Gap Panel

**Status**: Accepted  
**Date**: 2026-05-19

## Context

The forge loop used `FORGE_SECTION_PROMPT` rule 2: *"Freely INSERT gap keywords even if not present in the original CV."* This produced high match scores but required heavy manual editing because the AI fabricated experience the candidate never had. The edit burden was high and the CV text was frequently inaccurate.

## Decision

Replace free fabrication with two mechanisms:

1. **Anchored Insertion** — the AI inserts a JD keyword only when it can tie it to existing experience in the section. Every inserted phrase is wrapped in an `[AI: ...]` marker visible in both the PDF preview and the Edit tab. Markers are stripped by a "Clean & Download" action.

2. **Unmet Gap reporting** — keywords the AI cannot anchor are collected in a `gaps: list[str]` field on `ForgeResult` and surfaced in a dedicated **Gap Panel** sidebar in the Review phase. The CV text itself stays clean of unanchorable keywords.

## Consequences

- `FORGE_SECTION_PROMPT` rule 2 changes to require anchoring and marker wrapping, and adds a `gaps` array to the JSON return schema.
- `ForgeResult` schema gains `gaps: list[str] = []`.
- `TailoredCV` DB model gains a `gaps_json` column to persist unmet gaps across sessions.
- The forge API response includes aggregated gaps.
- Match scores will be slightly lower post-forge (fewer free insertions), but the output requires less editing.

## Alternatives Considered

- **Keep fabrication, add diff highlighting** — rejected: doesn't reduce editing burden, just reorders it.
- **Gap report only, no insertion** — rejected: leaves the CV text unchanged; provides information but no value.
