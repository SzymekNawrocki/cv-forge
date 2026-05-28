PARSE_ENTRIES_PROMPT = """\
Extract structured entries from this CV section.

Section: {section_name}

Return ONLY valid JSON:
{{
  "entries": [
    {{"org": "Company or University", "role": "Job Title or Degree", "date": "date range", "bullets": ["bullet 1", "bullet 2"]}}
  ]
}}

Rules:
- Extract every entry present in the section — do not skip any
- For entries with no bullet points, use an empty array for "bullets"
- Preserve dates exactly as written
- Use empty string "" for missing fields

Section content:
{section_content}
"""

ANALYZE_JD_PROMPT = """\
Analyze this job description carefully.

Return ONLY valid JSON:
{{
  "job_title": "exact job title from the posting",
  "seniority": "entry/mid/senior",
  "keywords": ["ats keyword 1", "ats keyword 2"],
  "required_skills": ["must-have skill 1", "must-have skill 2"],
  "nice_to_have": ["preferred skill 1"],
  "role_summary": "2-sentence summary of the role and its main purpose"
}}

Job Description:
{jd_text}
"""

from enum import Enum


class ForgeStrategy(str, Enum):
    ANCHORED = "anchored"
    AGGRESSIVE = "aggressive"


FORGE_SECTION_PROMPT_ANCHORED = """\
You are a precise ATS optimiser. Maximise keyword coverage while keeping every insertion honest
and anchored to real experience.

Section to rewrite: "{section_name}"
Target role: {job_title}

MISSING CRITICAL — required skills the JD demands that are absent from this CV:
{missing_critical}

MISSING NICE-TO-HAVE — preferred by the JD:
{missing_nice_to_have}

ALREADY COVERED — preserve any that appear in this section verbatim:
{existing_keywords}

Full CV (context only — do not duplicate content from other sections):
{full_cv}

Current section — {section_name}:
{section_content}

Rules (strict priority order):
1. NEVER remove, paraphrase, or abbreviate any existing keyword, tool, technology, or metric.
2. INSERT a missing keyword ONLY when you can anchor it to existing experience in this section or
   the full CV (a related tool, similar domain, transferable responsibility). Wrap every inserted
   phrase in an [AI: ...] marker using exact JD terminology. Example:
   "...using [AI: Docker] to containerise the existing Python services...".
3. For any missing keyword you CANNOT anchor, simply leave it out. Do not mention it.
4. Return ONLY the section body — bullet points or prose. Do NOT include the ## heading.
5. Bullet points use strong past-tense action verbs; no "I" or "my".
6. Keyword coverage beats stylistic polish.

Return ONLY valid JSON:
{{
  "rewritten": "full rewritten section in markdown"
}}
"""

FORGE_SECTION_PROMPT_AGGRESSIVE = """\
You are an aggressive ATS optimiser. Your single objective is maximum literal keyword coverage for
the target role. The candidate personally reviews and deletes anything inaccurate, so err heavily
toward inclusion.

Section to rewrite: "{section_name}"
Target role: {job_title}

MISSING CRITICAL — INSERT EVERY ONE of these:
{missing_critical}

MISSING NICE-TO-HAVE — INSERT THESE TOO:
{missing_nice_to_have}

ALREADY COVERED — preserve any that appear in this section verbatim:
{existing_keywords}

Full CV (context only — do not duplicate content from other sections):
{full_cv}

Current section — {section_name}:
{section_content}

Rules (strict priority order):
1. NEVER remove, paraphrase, or abbreviate any existing keyword, tool, technology, or metric.
   Also preserve any existing [AI: ...] markers verbatim — they are already-reviewed insertions
   from a prior pass.
2. INSERT every missing keyword above into this section using exact JD terminology — ATS matches
   literal strings. You do NOT need an anchor. If no real experience exists, FABRICATE plausible,
   concrete bullet content using the keyword (realistic tools, tasks, and measurable outcomes for
   the target role).
3. Wrap EVERY phrase you insert or invent in an [AI: ...] marker so the candidate can find and
   review it. Example: "- Built REST services with [AI: Docker] and [AI: Kubernetes] for
   container orchestration, cutting deploy time by [AI: 40%]."
4. Return ONLY the section body — bullet points or prose. Do NOT include the ## heading.
5. Bullet points use strong past-tense action verbs; no "I" or "my".
6. Coverage beats elegance — a denser rewrite naming more keywords is better.

Return ONLY valid JSON:
{{
  "rewritten": "full rewritten section in markdown"
}}
"""

FORGE_PROMPTS: dict[ForgeStrategy, str] = {
    ForgeStrategy.ANCHORED: FORGE_SECTION_PROMPT_ANCHORED,
    ForgeStrategy.AGGRESSIVE: FORGE_SECTION_PROMPT_AGGRESSIVE,
}

CLEAN_CV_JSON_PROMPT = """\
Parse this raw CV text into structured fields. Extract all information faithfully — do not add, remove, or invent anything.

Return ONLY valid JSON with this exact structure:
{{
  "name": "Full Name",
  "job_title": "Current or most recent job title",
  "email": "email@example.com",
  "phone": "+48 000 000 000",
  "portfolio_url": "https://portfolio.example.com",
  "github_url": "https://github.com/username",
  "location": "City, Country",
  "about_me": "Professional summary as a single prose paragraph.",
  "skills": [
    {{"category": "Languages", "items": ["Python", "TypeScript", "SQL"]}}
  ],
  "projects": [
    {{"name": "Project Name", "description": "What it does and tech used", "url": "", "date_range": "2023"}}
  ],
  "work_experience": [
    {{"company": "Company Name", "role": "Job Title", "date_range": "Jan 2020 – Dec 2022", "bullets": ["Achievement 1", "Achievement 2"]}}
  ],
  "education": [
    {{"institution": "University Name", "degree": "BSc Computer Science", "years": "2018–2022"}}
  ],
  "languages": [
    {{"language": "English", "level": "C1"}}
  ],
  "certifications": [
    {{"name": "AWS Certified Developer", "url": "", "year": "2023"}}
  ]
}}

Rules:
- Extract ALL jobs, projects, education entries — do not skip any
- If a field is not present in the CV, use empty string "" for strings and [] for arrays
- Preserve all specific details: tool names, company names, dates, metrics, certifications exactly as written
- about_me: combine Profile/Summary/Objective sections into one prose paragraph; use "" if none
- skills: group items by category (e.g. Languages, Frameworks, Tools, Databases)
- portfolio_url and github_url: extract from contact info if present, otherwise ""
- name must be non-empty — use the full name from the CV header

Raw CV text:
{raw_text}
"""

FORMAT_CV_JSON_PROMPT = """\
Convert this CV markdown into structured JSON for rendering a PDF.

CRITICAL: You must include EVERY section present in the CV. Do not skip, merge, or omit any section regardless of type.

Section type rules:
- "paragraph": single prose block (About Me, Summary, Profile, Objective)
- "bullets": list items (Skills, Projects, Languages, Certifications, Achievements)
- "entries": dated org entries (Work Experience, Experience, Education)

For bullets: preserve **bold:** prefixes exactly as written.
For entries: extract org name, role/title, date range, and bullet points. Use empty string "" for missing fields.
Contact fields: use empty string "" if not found.

Return ONLY valid JSON with this exact structure (your sections array must contain ALL sections from the CV):
{{
  "name": "Full Name",
  "title": "Job Title or empty string",
  "contact": {{
    "email": "",
    "phone": "",
    "location": "",
    "portfolio": "",
    "github": ""
  }},
  "sections": [
    {{"heading": "ABOUT ME", "type": "paragraph", "content": "prose text"}},
    {{"heading": "SKILLS", "type": "bullets", "items": ["**Category:** value"]}},
    {{"heading": "PROJECTS", "type": "bullets", "items": ["Project name: description"]}},
    {{"heading": "WORK EXPERIENCE", "type": "entries", "entries": [
      {{"org": "COMPANY", "role": "Job Title", "date": "date range", "bullets": ["achievement"]}}
    ]}},
    {{"heading": "EDUCATION", "type": "entries", "entries": [
      {{"org": "University Name", "role": "Degree", "date": "date range", "bullets": []}}
    ]}},
    {{"heading": "LANGUAGES", "type": "bullets", "items": ["English: C1"]}},
    {{"heading": "CERTIFICATIONS", "type": "bullets", "items": ["Certificate name year"]}}
  ]
}}

CV Markdown:
{cv_markdown}
"""
