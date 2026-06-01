"""Tests for demo mode: canned forge result shape and seed_demo_user smoke test."""
import pytest
from services.demo_service import build_canned_forge_result


# ── build_canned_forge_result ─────────────────────────────────────────────────

def test_canned_result_top_level_keys():
    content_json, initial_score, final_score = build_canned_forge_result()
    assert isinstance(content_json, dict)
    assert {"name", "title", "contact", "sections"} <= content_json.keys()


def test_canned_result_scores():
    _, initial_score, final_score = build_canned_forge_result()
    assert 0 < initial_score < final_score <= 100


def test_canned_result_contact_fields():
    content_json, _, _ = build_canned_forge_result()
    contact = content_json["contact"]
    assert "email" in contact
    assert "github" in contact
    assert "portfolio" in contact


def test_canned_result_sections_types():
    content_json, _, _ = build_canned_forge_result()
    sections = content_json["sections"]
    assert len(sections) > 0
    valid_types = {"paragraph", "bullets", "entries"}
    for sec in sections:
        assert sec["type"] in valid_types
        assert isinstance(sec["heading"], str)
        assert sec["heading"] == sec["heading"].upper(), (
            f"heading '{sec['heading']}' must be uppercase"
        )


def test_canned_result_entries_section_shape():
    content_json, _, _ = build_canned_forge_result()
    entry_sections = [s for s in content_json["sections"] if s["type"] == "entries"]
    assert len(entry_sections) >= 1
    for sec in entry_sections:
        for entry in sec["entries"]:
            assert {"org", "role", "date", "bullets"} <= entry.keys()
            assert isinstance(entry["bullets"], list)


def test_canned_result_bullets_section_shape():
    content_json, _, _ = build_canned_forge_result()
    bullet_sections = [s for s in content_json["sections"] if s["type"] == "bullets"]
    assert len(bullet_sections) >= 1
    for sec in bullet_sections:
        assert isinstance(sec["items"], list)
        assert len(sec["items"]) > 0


def test_canned_result_paragraph_section_shape():
    content_json, _, _ = build_canned_forge_result()
    para_sections = [s for s in content_json["sections"] if s["type"] == "paragraph"]
    assert len(para_sections) >= 1
    for sec in para_sections:
        assert isinstance(sec.get("content"), str)
        assert len(sec["content"]) > 20
