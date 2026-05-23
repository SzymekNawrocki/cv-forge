"""Pure (no-IO) tests for forge_pipeline.forge_cv."""
import pytest
import pytest_asyncio
from ai.prompts import ForgeStrategy
from ai.schemas import ForgeResult, JDAnalysis, MatchScore
from domain.cv_logic.forge_pipeline import forge_cv, TARGET_SCORE


# ── Fake provider ─────────────────────────────────────────────────────────────

class FakeProvider:
    """Minimal fake that records calls and returns configurable results."""

    def __init__(
        self,
        *,
        after_score: float = 95.0,
        retry_score: float = 95.0,
        missing_critical_after: list[str] | None = None,
        forge_rewritten: str = "rewritten content",
        forge_rewritten_retry: str | None = None,
    ):
        self.after_score = after_score
        self.retry_score = retry_score
        self.missing_critical_after = missing_critical_after or []
        self.forge_rewritten = forge_rewritten
        self.forge_rewritten_retry = forge_rewritten_retry if forge_rewritten_retry is not None else forge_rewritten

        self.forge_calls: list[dict] = []  # records every forge_section call
        self._score_call_count = 0

    async def analyze_jd(self, jd_text: str) -> JDAnalysis:
        return JDAnalysis(
            job_title="Software Engineer",
            seniority="mid",
            keywords=["Python", "Docker"],
            required_skills=["Python", "Docker"],
            nice_to_have=["Kubernetes"],
        )

    async def calculate_match_score(self, cv_text: str, jd_text: str, **kwargs) -> MatchScore:
        self._score_call_count += 1
        if self._score_call_count == 1:
            # before-forge score
            return MatchScore(score=50.0, missing_critical=["Python", "Docker"], missing_nice_to_have=["Kubernetes"])
        if self._score_call_count == 2:
            # after-forge score
            return MatchScore(
                score=self.after_score,
                missing_critical=self.missing_critical_after,
                missing_nice_to_have=[],
            )
        # retry score (3rd call)
        return MatchScore(score=self.retry_score, missing_critical=[], missing_nice_to_have=[])

    async def forge_section(self, *, strategy: ForgeStrategy, section_name: str, **kwargs) -> ForgeResult:
        call_no = len(self.forge_calls)
        self.forge_calls.append({"strategy": strategy, "section_name": section_name, **kwargs})
        # First pass: use forge_rewritten; retry passes (call_no >= N_FORGEABLE): use forge_rewritten_retry
        rewritten = self.forge_rewritten if not self._is_retry_call(call_no) else self.forge_rewritten_retry
        return ForgeResult(rewritten=rewritten)

    def _is_retry_call(self, call_no: int) -> bool:
        # We have 3 forgeable sections in the test CV; calls 0-2 are first pass, 3+ are retry
        return call_no >= 3

    async def format_cv_json(self, cv_markdown: str) -> dict:
        return {"name": "Test", "title": "", "contact": {}, "sections": []}

    async def parse_entries_section(self, section_name: str, section_content: str) -> list[dict]:
        return []


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
    provider = FakeProvider()
    await forge_cv(
        cv_markdown=_SAMPLE_CV,
        skills_markdown=None,
        jd_text="We need Python and Docker",
        provider=provider,
        github_url=None,
        portfolio_url=None,
        strategy=ForgeStrategy.AGGRESSIVE,
    )
    # At least the first pass uses aggressive
    assert all(call["strategy"] is ForgeStrategy.AGGRESSIVE for call in provider.forge_calls)


@pytest.mark.asyncio
async def test_empty_rewritten_lands_in_failed_sections_and_keeps_original():
    provider = FakeProvider(forge_rewritten="", after_score=95.0)
    output = await forge_cv(
        cv_markdown=_SAMPLE_CV,
        skills_markdown=None,
        jd_text="We need Python and Docker",
        provider=provider,
        github_url=None,
        portfolio_url=None,
        strategy=ForgeStrategy.ANCHORED,
    )
    # All forgeable sections should fail
    assert len(output.failed_sections) > 0
    # Original content preserved: CV still contains original bullets
    assert "Built APIs" in output.tailored_md


@pytest.mark.asyncio
async def test_retry_fires_only_for_aggressive_below_target_with_missing_criticals():
    first_pass_calls_before_retry = 3  # 3 forgeable sections

    provider = FakeProvider(
        after_score=TARGET_SCORE - 1,          # below threshold → triggers retry
        missing_critical_after=["Docker"],     # has missing criticals → retry fires
        retry_score=92.0,
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
    # First pass + retry pass = more than first_pass_calls_before_retry
    assert len(provider.forge_calls) > first_pass_calls_before_retry


@pytest.mark.asyncio
async def test_retry_does_not_fire_when_anchored():
    provider = FakeProvider(
        after_score=TARGET_SCORE - 1,
        missing_critical_after=["Docker"],
    )
    await forge_cv(
        cv_markdown=_SAMPLE_CV,
        skills_markdown=None,
        jd_text="We need Python and Docker",
        provider=provider,
        github_url=None,
        portfolio_url=None,
        strategy=ForgeStrategy.ANCHORED,
    )
    # No retry for anchored mode — only the first pass calls
    first_pass_count = sum(1 for c in provider.forge_calls if c["strategy"] is ForgeStrategy.ANCHORED)
    assert len(provider.forge_calls) == first_pass_count  # no extra calls


@pytest.mark.asyncio
async def test_retry_does_not_fire_when_score_above_target():
    provider = FakeProvider(
        after_score=TARGET_SCORE + 1,  # already above target
        missing_critical_after=["Docker"],
    )
    first_pass_calls = []
    original_forge = provider.forge_section

    await forge_cv(
        cv_markdown=_SAMPLE_CV,
        skills_markdown=None,
        jd_text="We need Python and Docker",
        provider=provider,
        github_url=None,
        portfolio_url=None,
        strategy=ForgeStrategy.AGGRESSIVE,
    )
    # Score above target — no retry
    assert provider._score_call_count == 2  # before + after, no 3rd retry score call


@pytest.mark.asyncio
async def test_retry_does_not_fire_when_no_missing_criticals():
    provider = FakeProvider(
        after_score=TARGET_SCORE - 1,
        missing_critical_after=[],  # no missing criticals → no retry
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
    assert provider._score_call_count == 2  # no 3rd score call = no retry


@pytest.mark.asyncio
async def test_retry_fires_at_most_once():
    """Even if the retry score is still below target, no further retries."""
    provider = FakeProvider(
        after_score=TARGET_SCORE - 10,
        missing_critical_after=["Docker", "K8s"],
        retry_score=TARGET_SCORE - 5,  # still below target after retry
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
    # Exactly 3 score calls: before, after first pass, after retry (no further retries)
    assert provider._score_call_count == 3
