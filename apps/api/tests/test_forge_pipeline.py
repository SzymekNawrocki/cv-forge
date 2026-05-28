"""Pure (no-IO) tests for forge_pipeline.forge_cv."""
import pytest
import pytest_asyncio
from ai.prompts import ForgeStrategy
from ai.schemas import ForgeResult, JDAnalysis
from domain.cv_logic.forge_pipeline import forge_cv, TARGET_SCORE

# Keywords that, when inserted into sections, guarantee a perfect match score.
_HIGH_SCORE_CONTENT = "Python Docker Kubernetes"
# Content that has none of the JD keywords → score stays low → retry fires.
_LOW_SCORE_CONTENT = "rewritten content without matching keywords"


# ── Fake provider ─────────────────────────────────────────────────────────────

class FakeProvider:
    """Minimal fake that records calls and returns configurable results."""

    def __init__(
        self,
        *,
        forge_rewritten: str = _LOW_SCORE_CONTENT,
        forge_rewritten_retry: str | None = None,
    ):
        self.forge_rewritten = forge_rewritten
        self.forge_rewritten_retry = forge_rewritten_retry if forge_rewritten_retry is not None else forge_rewritten
        self.forge_calls: list[dict] = []  # records every forge_section call

    async def analyze_jd(self, jd_text: str) -> JDAnalysis:
        return JDAnalysis(
            job_title="Software Engineer",
            seniority="mid",
            keywords=["Python", "Docker"],
            required_skills=["Python", "Docker"],
            nice_to_have=["Kubernetes"],
        )

    async def forge_section(self, *, strategy: ForgeStrategy, section_name: str, **kwargs) -> ForgeResult:
        call_no = len(self.forge_calls)
        self.forge_calls.append({"strategy": strategy, "section_name": section_name, **kwargs})
        rewritten = self.forge_rewritten if call_no < _N_FORGEABLE else self.forge_rewritten_retry
        return ForgeResult(rewritten=rewritten)

    async def format_cv_json(self, cv_markdown: str) -> dict:
        return {"name": "Test", "title": "", "contact": {}, "sections": []}

    async def parse_entries_section(self, section_name: str, section_content: str) -> list[dict]:
        return []


# Number of forgeable sections in _SAMPLE_CV (About Me, Skills — "Work Experience" not in FORGEABLE)
_N_FORGEABLE = 2


_SAMPLE_CV = """\
# Jane Doe
Software Developer
jane@example.com

## About Me
A developer.

## Skills
- **Languages:** JavaScript

## Work Experience
### Acme Corp
Dev | 2022-2024
- Built APIs.

## Education
- **MIT:** CS | 2018-2022
"""


# ── Tests ─────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_anchored_strategy_selects_anchored_prompt():
    provider = FakeProvider()
    await forge_cv(
        cv_markdown=_SAMPLE_CV,
        skills_markdown=None,
        jd_text="We need Python and Docker",
        provider=provider,
        github_url=None,
        portfolio_url=None,
        strategy=ForgeStrategy.ANCHORED,
    )
    assert all(call["strategy"] is ForgeStrategy.ANCHORED for call in provider.forge_calls)


@pytest.mark.asyncio
async def test_aggressive_strategy_selects_aggressive_prompt():
    # High-score content → no retry, exactly _N_FORGEABLE calls
    provider = FakeProvider(forge_rewritten=_HIGH_SCORE_CONTENT)
    await forge_cv(
        cv_markdown=_SAMPLE_CV,
        skills_markdown=None,
        jd_text="We need Python and Docker",
        provider=provider,
        github_url=None,
        portfolio_url=None,
        strategy=ForgeStrategy.AGGRESSIVE,
    )
    assert all(call["strategy"] is ForgeStrategy.AGGRESSIVE for call in provider.forge_calls)


@pytest.mark.asyncio
async def test_empty_rewritten_lands_in_failed_sections_and_keeps_original():
    provider = FakeProvider(forge_rewritten="")
    output = await forge_cv(
        cv_markdown=_SAMPLE_CV,
        skills_markdown=None,
        jd_text="We need Python and Docker",
        provider=provider,
        github_url=None,
        portfolio_url=None,
        strategy=ForgeStrategy.ANCHORED,
    )
    assert len(output.failed_sections) > 0
    assert "Built APIs" in output.tailored_md


@pytest.mark.asyncio
async def test_retry_fires_only_for_aggressive_below_target_with_missing_criticals():
    # Low-score content → score stays below TARGET → retry fires → 2×_N_FORGEABLE calls
    provider = FakeProvider(forge_rewritten=_LOW_SCORE_CONTENT)
    await forge_cv(
        cv_markdown=_SAMPLE_CV,
        skills_markdown=None,
        jd_text="We need Python and Docker",
        provider=provider,
        github_url=None,
        portfolio_url=None,
        strategy=ForgeStrategy.AGGRESSIVE,
    )
    assert len(provider.forge_calls) > _N_FORGEABLE


@pytest.mark.asyncio
async def test_retry_does_not_fire_when_anchored():
    provider = FakeProvider(forge_rewritten=_LOW_SCORE_CONTENT)
    await forge_cv(
        cv_markdown=_SAMPLE_CV,
        skills_markdown=None,
        jd_text="We need Python and Docker",
        provider=provider,
        github_url=None,
        portfolio_url=None,
        strategy=ForgeStrategy.ANCHORED,
    )
    # ANCHORED never retries — exactly the first-pass call count
    assert len(provider.forge_calls) == _N_FORGEABLE


@pytest.mark.asyncio
async def test_retry_does_not_fire_when_score_above_target():
    # High-score content → after-forge score >= TARGET → retry does NOT fire
    provider = FakeProvider(forge_rewritten=_HIGH_SCORE_CONTENT)
    await forge_cv(
        cv_markdown=_SAMPLE_CV,
        skills_markdown=None,
        jd_text="We need Python and Docker",
        provider=provider,
        github_url=None,
        portfolio_url=None,
        strategy=ForgeStrategy.AGGRESSIVE,
    )
    assert len(provider.forge_calls) == _N_FORGEABLE  # no retry pass


@pytest.mark.asyncio
async def test_retry_does_not_fire_when_no_missing_criticals():
    # High-score content → all required keywords covered → no missing_critical → no retry
    provider = FakeProvider(forge_rewritten=_HIGH_SCORE_CONTENT)
    await forge_cv(
        cv_markdown=_SAMPLE_CV,
        skills_markdown=None,
        jd_text="We need Python and Docker",
        provider=provider,
        github_url=None,
        portfolio_url=None,
        strategy=ForgeStrategy.AGGRESSIVE,
    )
    assert len(provider.forge_calls) == _N_FORGEABLE


@pytest.mark.asyncio
async def test_retry_fires_at_most_once():
    """Even if the retry score is still below target, no further retries."""
    # Low-score content on both passes → two passes of _N_FORGEABLE, then stop
    provider = FakeProvider(
        forge_rewritten=_LOW_SCORE_CONTENT,
        forge_rewritten_retry=_LOW_SCORE_CONTENT,
    )
    await forge_cv(
        cv_markdown=_SAMPLE_CV,
        skills_markdown=None,
        jd_text="We need Python and Docker",
        provider=provider,
        github_url=None,
        portfolio_url=None,
        strategy=ForgeStrategy.AGGRESSIVE,
    )
    # First pass (_N_FORGEABLE calls) + one retry pass (_N_FORGEABLE calls) = 2×_N_FORGEABLE
    assert len(provider.forge_calls) == 2 * _N_FORGEABLE
