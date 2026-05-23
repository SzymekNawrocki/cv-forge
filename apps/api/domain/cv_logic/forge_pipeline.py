from __future__ import annotations
import dataclasses
import logging

from ai.prompts import ForgeStrategy
from domain.cv_logic.parser import FORGEABLE, split_sections, merge_sections
from domain.cv_logic.cv_json_builder import build_cv_json

logger = logging.getLogger(__name__)

TARGET_SCORE = 90.0


@dataclasses.dataclass
class ForgeOutput:
    tailored_md: str
    content_json: dict
    initial_score: float
    match_score: float
    keywords: list[str]
    failed_sections: list[str]


async def forge_cv(
    cv_markdown: str,
    skills_markdown: str | None,
    jd_text: str,
    provider: object,
    github_url: str | None,
    portfolio_url: str | None,
    strategy: ForgeStrategy = ForgeStrategy.ANCHORED,
) -> ForgeOutput:
    """Pure, DB-free forge pipeline. Inject a fake provider to test without a database."""

    analysis = await provider.analyze_jd(jd_text)  # type: ignore[attr-defined]
    required_kw: list[str] = analysis.required_skills
    nice_kw: list[str] = analysis.nice_to_have
    keywords: list[str] = analysis.keywords + required_kw
    job_title: str = analysis.job_title

    before_result = await provider.calculate_match_score(  # type: ignore[attr-defined]
        cv_markdown, jd_text,
        required_keywords=required_kw,
        nice_to_have_keywords=nice_kw,
    )
    initial_score: float = before_result.score

    missing_critical: list[str] = before_result.missing_critical
    missing_nice_to_have: list[str] = before_result.missing_nice_to_have
    missing_set = set(missing_critical + missing_nice_to_have)
    existing_keywords = [k for k in keywords if k not in missing_set]

    sections = split_sections(cv_markdown)

    # Inject full DB skills only when the CV has no existing skills content (Option B).
    if skills_markdown:
        skills_key = next((k for k in sections if k.lower() == "skills"), None)
        has_skills = bool(skills_key and sections.get(skills_key, "").strip())
        if not has_skills:
            sections[skills_key or "Skills"] = skills_markdown

    forged: dict[str, str] = {}
    failed_sections: list[str] = []
    for sec_title, content in sections.items():
        if sec_title.lower() in FORGEABLE:
            forge_result = await provider.forge_section(  # type: ignore[attr-defined]
                section_name=sec_title,
                section_content=content,
                keywords=keywords,
                job_title=job_title,
                full_cv=cv_markdown,
                missing_critical=missing_critical,
                missing_nice_to_have=missing_nice_to_have,
                existing_keywords=existing_keywords,
                strategy=strategy,
            )
            if forge_result.rewritten:
                forged[sec_title] = forge_result.rewritten
            else:
                forged[sec_title] = content
                failed_sections.append(sec_title)
        else:
            forged[sec_title] = content

    tailored_md = merge_sections(forged)
    after_result = await provider.calculate_match_score(  # type: ignore[attr-defined]
        tailored_md, jd_text,
        required_keywords=required_kw,
        nice_to_have_keywords=nice_kw,
    )
    match_score: float = after_result.score

    if match_score < initial_score:
        logger.warning("Score regression: before=%.1f after=%.1f", initial_score, match_score)

    # Bounded one-pass retry for aggressive mode when score is below target
    if (strategy is ForgeStrategy.AGGRESSIVE
            and match_score < TARGET_SCORE
            and after_result.missing_critical):
        for sec_title, content in list(forged.items()):
            if sec_title.lower() in FORGEABLE:
                retry = await provider.forge_section(  # type: ignore[attr-defined]
                    section_name=sec_title,
                    section_content=content,
                    keywords=keywords,
                    job_title=job_title,
                    full_cv=tailored_md,
                    missing_critical=after_result.missing_critical,
                    missing_nice_to_have=[],
                    existing_keywords=existing_keywords,
                    strategy=ForgeStrategy.AGGRESSIVE,
                )
                if retry.rewritten:
                    forged[sec_title] = retry.rewritten
        tailored_md = merge_sections(forged)
        after_result = await provider.calculate_match_score(  # type: ignore[attr-defined]
            tailored_md, jd_text,
            required_keywords=required_kw,
            nice_to_have_keywords=nice_kw,
        )
        match_score = after_result.score

    content_json = await build_cv_json(
        tailored_md, provider,
        github_url=github_url,
        portfolio_url=portfolio_url,
    )

    return ForgeOutput(
        tailored_md=tailored_md,
        content_json=content_json,
        initial_score=initial_score,
        match_score=match_score,
        keywords=keywords,
        failed_sections=failed_sections,
    )
