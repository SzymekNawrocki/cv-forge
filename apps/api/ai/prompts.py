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
Rewrite this CV section to match the target job. Optimize for ATS keywords.
Keep same structure, professional tone, accurate content — do NOT invent facts.
Return ONLY valid JSON:
{{
  "rewritten": "full rewritten section in markdown"
}}

Target keywords: {keywords}

Original section:
{section_content}
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
