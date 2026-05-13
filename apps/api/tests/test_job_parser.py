import json
import pytest
from domain.parsers.job_parser import parse_job_text
from domain.models import Job


def make_fake_ai(response: dict):
    def ai_fn(prompt: str) -> str:
        return json.dumps(response)
    return ai_fn


FAKE_FULL = {
    "title": "Software Engineer",
    "company": "Acme Corp",
    "tech_stack": ["Python", "FastAPI", "PostgreSQL", "Docker"],
    "salary_min": 15000,
    "salary_max": 25000,
    "currency": "PLN",
    "contact_email": "hire@acme.com",
}

FAKE_NO_EMAIL = {
    "title": "Senior Backend Engineer",
    "company": "GlobalTech",
    "tech_stack": ["Go", "Kubernetes", "gRPC"],
    "salary_min": 120000,
    "salary_max": 160000,
    "currency": "USD",
    "contact_email": None,
}

FAKE_MINIMAL = {
    "title": "Junior Developer",
    "company": "StartupXYZ",
    "tech_stack": [],
    "salary_min": None,
    "salary_max": None,
    "currency": None,
    "contact_email": None,
}


def test_parse_returns_job_model():
    result = parse_job_text("any text", ai_fn=make_fake_ai(FAKE_FULL))
    assert isinstance(result, Job)


def test_parse_title_and_company():
    result = parse_job_text("any text", ai_fn=make_fake_ai(FAKE_FULL))
    assert result.title == "Software Engineer"
    assert result.company == "Acme Corp"


def test_parse_tech_stack():
    result = parse_job_text("any text", ai_fn=make_fake_ai(FAKE_FULL))
    assert "Python" in result.tech_stack
    assert "FastAPI" in result.tech_stack


def test_parse_salary_pln():
    result = parse_job_text("any text", ai_fn=make_fake_ai(FAKE_FULL))
    assert result.salary_min == 15000
    assert result.salary_max == 25000
    assert result.currency == "PLN"


def test_parse_contact_email():
    result = parse_job_text("any text", ai_fn=make_fake_ai(FAKE_FULL))
    assert result.contact_email == "hire@acme.com"


def test_parse_no_email_returns_none():
    result = parse_job_text("any text", ai_fn=make_fake_ai(FAKE_NO_EMAIL))
    assert result.contact_email is None


def test_parse_no_salary_returns_none():
    result = parse_job_text("any text", ai_fn=make_fake_ai(FAKE_MINIMAL))
    assert result.salary_min is None
    assert result.salary_max is None


def test_parse_usd_salary():
    result = parse_job_text("any text", ai_fn=make_fake_ai(FAKE_NO_EMAIL))
    assert result.salary_min == 120000
    assert result.salary_max == 160000
    assert result.currency == "USD"


def test_parse_minimal_no_crash():
    result = parse_job_text("any text", ai_fn=make_fake_ai(FAKE_MINIMAL))
    assert result.title == "Junior Developer"
    assert result.company == "StartupXYZ"


def test_parse_retries_on_bad_json():
    calls = []

    def bad_then_good(prompt: str) -> str:
        calls.append(prompt)
        if len(calls) == 1:
            return "not valid json!!!"
        return json.dumps(FAKE_FULL)

    result = parse_job_text("any text", ai_fn=bad_then_good)
    assert len(calls) == 2
    assert result.title == "Software Engineer"
