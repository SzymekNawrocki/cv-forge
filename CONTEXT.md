# CV Forge — Domain Glossary

## Forge
The AI pipeline that takes a **Master CV** + **Job Description** and produces a **Tailored CV**. Consists of: JD analysis → match scoring → section rewriting → gap collection → JSON build.

## Anchored Insertion
An AI-inserted keyword or phrase that is tied to existing experience in the CV. The AI must find a plausible connection to something already present before inserting. Contrast with *Fabrication* (old behaviour — inserting regardless of existing context).

## Fabrication
The old forge behaviour (pre-ADR-0001): inserting JD keywords freely into CV sections even when no related experience exists. Replaced by *Anchored Insertion* + *Unmet Gap* reporting.

## AI Marker
A `[AI: inserted text]` tag wrapping every phrase the forge inserts into a CV section. Visible in both the PDF preview and the Edit tab. Stripped by the "Clean & Download" action before the final PDF is generated.

## Unmet Gap
A JD keyword the forge could not anchor to any existing experience. Collected per section during the forge loop and surfaced in the **Gap Panel** rather than inserted into the CV text.

## Gap Panel
A dedicated sidebar in the Review phase listing all Unmet Gaps for the current forge run. Acts as a checklist — the user uses it to decide whether to manually add experience or leave the gap unaddressed.

## Master CV
A saved CV in markdown format. Source of truth for all non-skills content. One user may have multiple Master CVs.

## Tailored CV
The forge output: structured JSON derived from a rewritten Master CV, scored against a specific Job Description. Stored with `initial_match_score` (before forge) and `match_score` (after forge).

## Forge Phases (UI)
The forge page has three distinct phases that morph on a single surface:
1. **Setup** — CV selector + JD input dominate the screen.
2. **Forging** — loading state with spinner; layout unchanged.
3. **Review** — JD collapses to a narrow strip; Review panel (PDF preview + Gap Panel) expands to fill the viewport.

## Match Score
An AI-calculated 0–100 score measuring keyword coverage of a CV against a JD. Deducts 8 per missing critical skill (max 80) and 2 per missing nice-to-have. Shown as Before/After badges in the Review phase.
