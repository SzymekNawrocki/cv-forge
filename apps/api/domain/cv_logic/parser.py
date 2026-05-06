from __future__ import annotations
import re

_HEADER_RE = re.compile(r"^##\s+(.+)$", re.MULTILINE)
FORGEABLE = {"Summary", "Experience", "Skills"}


def split_sections(markdown: str) -> dict[str, str]:
    """Return {title: content}. Key 'header' = content before first ## ."""
    matches = list(_HEADER_RE.finditer(markdown))
    if not matches:
        return {"body": markdown}

    sections: dict[str, str] = {}
    if matches[0].start() > 0:
        sections["header"] = markdown[: matches[0].start()].strip()

    for i, m in enumerate(matches):
        title = m.group(1).strip()
        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(markdown)
        sections[title] = markdown[start:end].strip()

    return sections


def merge_sections(sections: dict[str, str]) -> str:
    """Reconstruct markdown from split_sections output."""
    parts: list[str] = []
    if "header" in sections:
        parts.append(sections["header"])
    for title, content in sections.items():
        if title == "header":
            continue
        parts.append(f"## {title}\n\n{content}")
    return "\n\n".join(parts)
