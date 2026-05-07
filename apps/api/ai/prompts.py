ANALYZE_JD_PROMPT = """\
Analyze this job description. Extract keywords and required skills.
Return ONLY valid JSON:
{{
  "keywords": ["keyword1", "keyword2"],
  "required_skills": ["skill1", "skill2"],
  "role_summary": "one sentence summary"
}}

Job Description:
{jd_text}
"""

FORGE_SECTION_PROMPT = """\
Rewrite this CV section to better match the target job. Optimize for ATS keywords.
CRITICAL RULES:
- PRESERVE every specific technical skill, tool, language, and framework already in the original. Do NOT remove or omit them.
- You may rephrase or reorder skills to highlight relevance, but never delete them.
- Do NOT invent facts, certifications, or experience not in the original.
- Keep same structure and professional tone.
Return ONLY valid JSON:
{{
  "rewritten": "full rewritten section in markdown"
}}

Target keywords: {keywords}

Original section (preserve all technical skills listed here):
{section_content}
"""

MATCH_SCORE_PROMPT = """\
Analytically score how well this CV matches the job description. Be precise, not generous.

Step 1 — List every critical skill/keyword from the job description that is MISSING from the CV.
Step 2 — Start at 100. Subtract 8 points per missing critical skill (max deduction 80). Subtract 3 points per missing nice-to-have skill.
Step 3 — Output the final score and the list of missing critical skills.

Return ONLY valid JSON:
{{
  "score": 62,
  "missing_critical": ["Kubernetes", "CI/CD pipelines"],
  "reasoning": "Missing 2 critical skills from JD"
}}

Job Description:
{jd_text}

CV:
{cv_text}
"""

CLEAN_CV_PROMPT = """\
Format this raw CV text into clean Markdown.
Use # for name, ## for section headers (Summary, Experience, Education, Skills).
Return ONLY valid JSON:
{{
  "markdown": "full formatted CV in markdown"
}}

Raw CV text:
{raw_text}
"""

FORMAT_CV_JSON_PROMPT = """\
Convert this CV markdown into structured JSON for rendering a PDF.

Section type rules:
- "paragraph": single prose block (About Me, Summary, Profile)
- "bullets": list items (Skills, Languages, Certifications, Projects)
- "entries": dated org entries (Work Experience, Education)

For bullets items: preserve **bold:** prefixes exactly as written.
For entries: extract org name, role/title, date range, and bullet points.
Contact fields: use empty string "" if not found in the CV.

Return ONLY valid JSON with this exact structure:
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
    {{"heading": "WORK EXPERIENCE", "type": "entries", "entries": [
      {{"org": "COMPANY", "role": "Job Title", "date": "date range", "bullets": ["achievement"]}}
    ]}}
  ]
}}

CV Markdown:
{cv_markdown}
"""
