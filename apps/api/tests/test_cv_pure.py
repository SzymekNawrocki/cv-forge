"""Unit tests for the pure (no-IO) functions in the CV pipeline."""
from domain.cv_logic.parser import split_sections, merge_sections
from domain.cv_logic.cv_json_builder import _parse_bullets, _extract_header
from services.forge_service import _normalize_cv_markdown, _form_to_markdown
from services.skills_service import build_skills_markdown
from domain.schemas import (
    CVFormData,
    SkillCategoryEntry,
    WorkExperienceEntry,
    EducationEntry,
    CertificationEntry,
)


# ── split_sections ───────────────────────────────────────────────────────────

def test_split_no_sections_returns_body():
    md = "just a body with no ## headers"
    assert split_sections(md) == {"body": md}


def test_split_single_section_extracts_header():
    md = "# Name\nEmail\n\n## About Me\n\nSome text"
    result = split_sections(md)
    assert result["header"] == "# Name\nEmail"
    assert result["About Me"] == "Some text"


def test_split_multiple_sections():
    md = "# Name\n\n## Skills\n\n- Python\n\n## Experience\n\nWorked somewhere"
    result = split_sections(md)
    assert "Skills" in result
    assert "Experience" in result


def test_split_no_content_before_first_section():
    md = "## Skills\n\n- Python"
    result = split_sections(md)
    assert "header" not in result
    assert result["Skills"] == "- Python"


def test_split_empty_section():
    md = "## Skills\n\n## Experience\n\nSome experience"
    result = split_sections(md)
    assert result["Skills"] == ""
    assert result["Experience"] == "Some experience"


# ── merge_sections ────────────────────────────────────────────────────────────

def test_merge_round_trips():
    md = "# Name\nEmail\n\n## Skills\n\n- Python, FastAPI\n\n## Experience\n\n- Did things"
    assert merge_sections(split_sections(md)) == md


def test_merge_without_header():
    sections = {"Skills": "- Python", "Experience": "- Built things"}
    result = merge_sections(sections)
    assert "## Skills" in result
    assert "## Experience" in result
    assert not result.startswith("# ")


def test_merge_with_header_comes_first():
    sections = {"header": "# Name\nEmail", "Skills": "- Python"}
    result = merge_sections(sections)
    assert result.startswith("# Name\nEmail")
    assert "## Skills" in result


# ── _parse_bullets ────────────────────────────────────────────────────────────

def test_parse_bullets_dash():
    assert _parse_bullets("- item one\n- item two") == ["item one", "item two"]


def test_parse_bullets_star():
    assert _parse_bullets("* item one") == ["item one"]


def test_parse_bullets_plus():
    assert _parse_bullets("+ item one") == ["item one"]


def test_parse_bullets_unicode_bullet():
    assert _parse_bullets("• item one") == ["item one"]


def test_parse_bullets_skips_empty_lines():
    assert _parse_bullets("- a\n\n- b") == ["a", "b"]


def test_parse_bullets_no_prefix_passes_through():
    assert _parse_bullets("just a line") == ["just a line"]


def test_parse_bullets_empty_input():
    assert _parse_bullets("") == []


# ── _extract_header ───────────────────────────────────────────────────────────

def test_extract_header_name_and_title():
    header = "# John Doe\nSoftware Engineer\njohn@example.com"
    name, title, contact = _extract_header(header)
    assert name == "John Doe"
    assert title == "Software Engineer"


def test_extract_header_email():
    header = "# Jane\nDev\njane@test.com"
    _, _, contact = _extract_header(header)
    assert contact["email"] == "jane@test.com"


def test_extract_header_phone():
    header = "# Dev\nEngineer\ndev@test.com\n+48 123 456 789"
    _, _, contact = _extract_header(header)
    assert contact["phone"] != ""


def test_extract_header_github():
    header = "# Dev\nEngineer\ngithub.com/devuser"
    _, _, contact = _extract_header(header)
    assert "devuser" in contact["github"]


def test_extract_header_portfolio():
    header = "# Name\nDev\nhttps://mysite.com\ngithub.com/me"
    _, _, contact = _extract_header(header)
    assert "mysite.com" in contact["portfolio"]


def test_extract_header_no_contact_fields():
    header = "# Name\nTitle"
    name, title, contact = _extract_header(header)
    assert name == "Name"
    assert title == "Title"
    assert contact["email"] == ""
    assert contact["phone"] == ""
    assert contact["github"] == ""


def test_extract_header_empty():
    name, title, contact = _extract_header("")
    assert name == ""
    assert title == ""


# ── _normalize_cv_markdown ────────────────────────────────────────────────────

def test_normalize_removes_double_hash_name():
    md = "## # Full Name\nTitle"
    result = _normalize_cv_markdown(md)
    assert result.startswith("# Full Name")
    assert "## #" not in result


def test_normalize_removes_double_section_prefix():
    md = "## ## About Me\n\nSome text"
    result = _normalize_cv_markdown(md)
    assert result.startswith("## About Me")
    assert "## ##" not in result


def test_normalize_leaves_correct_markdown_unchanged():
    md = "# Name\n\n## About Me\n\nText"
    assert _normalize_cv_markdown(md) == md


def test_normalize_handles_multiline():
    md = "## # Full Name\nTitle\n\n## ## Skills\n\n- Python"
    result = _normalize_cv_markdown(md)
    assert "# Full Name" in result
    assert "## Skills" in result
    assert "## #" not in result
    assert "## ##" not in result


# ── _form_to_markdown ─────────────────────────────────────────────────────────

def test_form_to_markdown_minimal():
    data = CVFormData(title="T", name="Test User", job_title="Developer")
    result = _form_to_markdown(data)
    assert result.startswith("# Test User")
    assert "Developer" in result


def test_form_to_markdown_with_contact():
    data = CVFormData(
        title="T", name="J", job_title="Dev",
        email="j@test.com", phone="+48 123", location="Warsaw",
    )
    result = _form_to_markdown(data)
    assert "j@test.com" in result
    assert "+48 123" in result
    assert "Warsaw" in result


def test_form_to_markdown_with_skills():
    data = CVFormData(
        title="T", name="J", job_title="Dev",
        skills=[SkillCategoryEntry(category="Languages", items=["Python", "Go"])],
    )
    result = _form_to_markdown(data)
    assert "## Skills" in result
    assert "**Languages:** Python, Go" in result


def test_form_to_markdown_with_work_experience():
    data = CVFormData(
        title="T", name="J", job_title="Dev",
        work_experience=[
            WorkExperienceEntry(company="Acme", role="Engineer", date_range="2020-2022", bullets=["Did stuff"])
        ],
    )
    result = _form_to_markdown(data)
    assert "### Acme" in result
    assert "Engineer | 2020-2022" in result
    assert "- Did stuff" in result


def test_form_to_markdown_with_education():
    data = CVFormData(
        title="T", name="J", job_title="Dev",
        education=[EducationEntry(institution="MIT", degree="CS", years="2018-2022")],
    )
    result = _form_to_markdown(data)
    assert "## Education" in result
    assert "**MIT:** CS | 2018-2022" in result


def test_form_to_markdown_with_certifications():
    data = CVFormData(
        title="T", name="J", job_title="Dev",
        certifications=[CertificationEntry(name="AWS Solutions Architect", year="2023")],
    )
    result = _form_to_markdown(data)
    assert "## Certifications" in result
    assert "**AWS Solutions Architect 2023**" in result


def test_form_to_markdown_skips_empty_sections():
    data = CVFormData(title="T", name="J", job_title="Dev")
    result = _form_to_markdown(data)
    assert "## Skills" not in result
    assert "## Projects" not in result
    assert "## Work Experience" not in result
    assert "## Education" not in result


def test_form_to_markdown_link_formatting():
    data = CVFormData(
        title="T", name="J", job_title="Dev",
        portfolio_url="https://mysite.com", github_url="https://github.com/me",
    )
    result = _form_to_markdown(data)
    assert "https://mysite.com | https://github.com/me" in result


# ── build_skills_markdown ─────────────────────────────────────────────────────

class _FakeSkill:
    def __init__(self, category: str, items: list[str]) -> None:
        self.category = category
        self.items = items


def test_build_skills_markdown_single():
    skills = [_FakeSkill("Languages", ["Python", "Go"])]
    assert build_skills_markdown(skills) == "- **Languages:** Python, Go"


def test_build_skills_markdown_multiple():
    skills = [_FakeSkill("Languages", ["Python"]), _FakeSkill("Tools", ["Docker", "Git"])]
    lines = build_skills_markdown(skills).split("\n")
    assert lines[0] == "- **Languages:** Python"
    assert lines[1] == "- **Tools:** Docker, Git"


def test_build_skills_markdown_empty():
    assert build_skills_markdown([]) == ""
