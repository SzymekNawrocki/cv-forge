from __future__ import annotations
import re
from domain.cv_logic.parser import split_sections

_PARAGRAPH_SECTIONS = {"summary", "about me", "profile", "objective"}
_ENTRIES_SECTIONS = {"experience", "work experience"}


def _parse_bullets(content: str) -> list[str]:
    items = []
    for line in content.split("\n"):
        stripped = line.strip()
        if not stripped:
            continue
        cleaned = re.sub(r"^[•\-\*\+]\s*", "", stripped)
        if cleaned:
            items.append(cleaned)
    return items


def _extract_header(header_text: str) -> tuple[str, str, dict]:
    lines = [re.sub(r"^#+\s*", "", l).strip() for l in header_text.split("\n") if l.strip()]

    name = lines[0] if lines else ""

    title = ""
    for line in lines[1:]:
        if not re.search(r"@|http|github|\+\d|\d{3,}", line, re.IGNORECASE):
            title = line
            break

    email = (re.search(r"[\w.+-]+@[\w-]+\.\w+", header_text) or type("", (), {"group": lambda s, n: ""})()).group(0)
    phone_m = re.search(r"\+?[\d][\d\s\-\(\)]{7,}", header_text)
    phone = phone_m.group(0).strip() if phone_m else ""
    github_m = re.search(r"github\.com/\S+", header_text, re.IGNORECASE)
    github = github_m.group(0) if github_m else ""
    portfolio_m = re.search(r"https?://(?!github\.com)\S+", header_text, re.IGNORECASE)
    portfolio = portfolio_m.group(0).rstrip(".,)") if portfolio_m else ""

    # Location: any line with no digits, @, http that looks like a city
    location = ""
    for line in lines:
        if not re.search(r"@|http|\d", line) and 3 < len(line) < 40 and line != name and line != title:
            location = line
            break

    return name, title, {
        "email": email,
        "phone": phone,
        "location": location,
        "portfolio": portfolio,
        "github": github,
    }


async def build_cv_json(
    cv_markdown: str,
    client,
    github_url: str | None = None,
    portfolio_url: str | None = None,
) -> dict:
    sections_map = split_sections(cv_markdown)
    header_text = sections_map.get("header", "")
    name, title, contact = _extract_header(header_text)

    # Prefer explicit DB-stored links over regex extraction from markdown
    if github_url:
        contact["github"] = github_url
    if portfolio_url:
        contact["portfolio"] = portfolio_url

    result_sections = []
    for sec_title, content in sections_map.items():
        if sec_title == "header":
            continue

        key = sec_title.lower()
        heading = sec_title.upper()

        if key in _PARAGRAPH_SECTIONS:
            result_sections.append({
                "heading": heading,
                "type": "paragraph",
                "content": content.strip(),
            })
        elif key in _ENTRIES_SECTIONS:
            entries = await client.parse_entries_section(sec_title, content)
            result_sections.append({
                "heading": heading,
                "type": "entries",
                "entries": entries,
            })
        else:
            result_sections.append({
                "heading": heading,
                "type": "bullets",
                "items": _parse_bullets(content),
            })

    return {"name": name, "title": title, "contact": contact, "sections": result_sections}
