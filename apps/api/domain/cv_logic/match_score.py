from __future__ import annotations
import re
from rapidfuzz import fuzz

# Common tech synonyms — bidirectional, lower-cased
SYNONYMS: dict[str, list[str]] = {
    "kubernetes": ["k8s"],
    "k8s": ["kubernetes"],
    "ci/cd": ["continuous integration", "continuous delivery", "continuous deployment", "cicd"],
    "continuous integration": ["ci/cd"],
    "javascript": ["js"],
    "js": ["javascript"],
    "typescript": ["ts"],
    "ts": ["typescript"],
    "machine learning": ["ml"],
    "ml": ["machine learning"],
    "natural language processing": ["nlp"],
    "nlp": ["natural language processing"],
    "amazon web services": ["aws"],
    "aws": ["amazon web services"],
    "google cloud platform": ["gcp"],
    "gcp": ["google cloud platform"],
    "microsoft azure": ["azure"],
    "azure": ["microsoft azure"],
    "react": ["reactjs", "react.js"],
    "reactjs": ["react"],
    "node.js": ["nodejs", "node"],
    "nodejs": ["node.js"],
    "postgresql": ["postgres"],
    "postgres": ["postgresql"],
    "rest api": ["restful api", "restful"],
    "restful api": ["rest api"],
    "git": ["github", "gitlab"],
}

_FUZZY_THRESHOLD = 88  # percent — high enough to avoid false positives


def _normalize(text: str) -> str:
    return re.sub(r"[^a-z0-9 ./]", " ", text.lower()).strip()


def _keyword_present(keyword: str, cv_text: str) -> bool:
    kw = _normalize(keyword)
    cv = _normalize(cv_text)  # idempotent — safe whether already normalized or not
    if not kw:
        return True

    if kw in cv:
        return True

    # Fuzzy on single-word keywords
    if " " not in kw and "/" not in kw:
        for word in cv.split():
            if len(word) >= 3 and fuzz.ratio(kw, word) >= _FUZZY_THRESHOLD:
                return True

    for synonym in SYNONYMS.get(kw, []):
        if _normalize(synonym) in cv:
            return True

    return False


def calculate_match_score(
    cv_text: str,
    required_keywords: list[str],
    nice_to_have_keywords: list[str],
) -> tuple[float, list[str], list[str]]:
    """Pure deterministic scoring. Returns (score, missing_critical, missing_nice_to_have)."""
    missing_critical = [kw for kw in required_keywords if not _keyword_present(kw, cv_text)]
    missing_nice = [kw for kw in nice_to_have_keywords if not _keyword_present(kw, cv_text)]

    score = 100.0
    score -= min(len(missing_critical) * 8.0, 80.0)
    score -= len(missing_nice) * 2.0
    score = max(0.0, min(100.0, score))

    return score, missing_critical, missing_nice
