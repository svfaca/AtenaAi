"""Interest normalization helpers.

Canonical persistence format is a JSON array of stable interest IDs, e.g.
['math', 'programming'].
"""

import json
from typing import List, Optional


# ============================================================
# INTEREST LABELS - Portuguese labels for canonical IDs
# ============================================================
INTEREST_LABELS_PT = {
    "math": "Matemática",
    "statistics": "Estatística",
    "physics": "Física",
    "chemistry": "Química",
    "programming": "Programação",
    "engineering": "Engenharia",
    "biology": "Biologia",
    "health": "Saúde",
    "anatomy": "Anatomia",
    "physical-education": "Ed. Física",
    "history": "História",
    "geography": "Geografia",
    "philosophy": "Filosofia",
    "sociology": "Sociologia",
    "psychology": "Psicologia",
    "literature": "Literatura",
    "languages": "Idiomas",
    "writing": "Redação",
    "arts": "Artes",
    "law": "Direito",
    "economics": "Economia",
    "research": "Pesquisa",
    "study": "Estudos",
}

INTEREST_LABELS_EN = {
    "math": "Mathematics",
    "statistics": "Statistics",
    "physics": "Physics",
    "chemistry": "Chemistry",
    "programming": "Programming",
    "engineering": "Engineering",
    "biology": "Biology",
    "health": "Health",
    "anatomy": "Anatomy",
    "physical-education": "Physical Education",
    "history": "History",
    "geography": "Geography",
    "philosophy": "Philosophy",
    "sociology": "Sociology",
    "psychology": "Psychology",
    "literature": "Literature",
    "languages": "Languages",
    "writing": "Writing",
    "arts": "Arts",
    "law": "Law",
    "economics": "Economics",
    "research": "Research",
    "study": "Study",
}

INTEREST_ID_ALIASES = {
    # Canonical IDs
    "math": "math",
    "statistics": "statistics",
    "physics": "physics",
    "chemistry": "chemistry",
    "programming": "programming",
    "engineering": "engineering",
    "biology": "biology",
    "health": "health",
    "anatomy": "anatomy",
    "physical-education": "physical-education",
    "history": "history",
    "geography": "geography",
    "philosophy": "philosophy",
    "sociology": "sociology",
    "psychology": "psychology",
    "literature": "literature",
    "languages": "languages",
    "writing": "writing",
    "arts": "arts",
    "law": "law",
    "economics": "economics",
    "research": "research",
    "study": "study",
    # Legacy English aliases
    "mathematics": "math",
    "program": "programming",
    "engineer": "engineering",
    "physical education": "physical-education",
    "education": "physical-education",
    "language": "languages",
    "art": "arts",
    "economy": "economics",
    "studies": "study",
    # Legacy Portuguese labels
    "matemática": "math",
    "estatística": "statistics",
    "física": "physics",
    "química": "chemistry",
    "programação": "programming",
    "engenharia": "engineering",
    "biologia": "biology",
    "saúde": "health",
    "anatomia": "anatomy",
    "ed. física": "physical-education",
    "história": "history",
    "geografia": "geography",
    "filosofia": "philosophy",
    "sociologia": "sociology",
    "psicologia": "psychology",
    "literatura": "literature",
    "idiomas": "languages",
    "redação": "writing",
    "artes": "arts",
    "direito": "law",
    "economia": "economics",
    "pesquisa": "research",
    "estudos": "study",
    "ed. fisica": "physical-education",
}


def _parse_raw_interests(interests_data) -> List[str]:
    if interests_data is None:
        return []

    if isinstance(interests_data, list):
        return [item for item in interests_data if isinstance(item, str)]

    if isinstance(interests_data, str):
        value = interests_data.strip()
        if not value:
            return []

        try:
            parsed = json.loads(value)
            if isinstance(parsed, list):
                return [item for item in parsed if isinstance(item, str)]
        except (json.JSONDecodeError, TypeError, ValueError):
            pass

        return [item.strip() for item in value.split(",") if item.strip()]

    return []


def parse_interests(interests_data) -> List[str]:
    """Parse and normalize interests to canonical ID list."""
    parsed_source = _parse_raw_interests(interests_data)

    normalized_values = []
    for interest in parsed_source:
        interest_clean = interest.strip()
        if not interest_clean:
            continue

        canonical = INTEREST_ID_ALIASES.get(interest_clean.lower())
        if canonical:
            normalized_values.append(canonical)

    return sorted(list(set(normalized_values)))


def normalize_interests(interests_data) -> Optional[str]:
    """Normalize any interests payload into canonical JSON array string."""
    normalized = parse_interests(interests_data)
    if not normalized:
        return None
    return json.dumps(normalized)


def get_interest_label(interest_id: str, language: str = "pt") -> str:
    """
    Get human-readable label for an interest ID.
    
    Args:
        interest_id: Canonical interest ID (e.g., "math", "physics")
        language: Language code ("pt" or "en")
        
    Returns:
        Human-readable label (e.g., "Matemática", "Mathematics")
    """
    labels = INTEREST_LABELS_PT if language == "pt" else INTEREST_LABELS_EN
    return labels.get(interest_id, interest_id)


def get_interest_labels(interest_ids: List[str], language: str = "pt") -> List[str]:
    """
    Convert list of interest IDs to human-readable labels.
    
    Args:
        interest_ids: List of canonical interest IDs
        language: Language code ("pt" or "en")
        
    Returns:
        List of human-readable labels
        
    Example:
        >>> get_interest_labels(["math", "physics"], "pt")
        ["Matemática", "Física"]
    """
    return [get_interest_label(interest_id, language) for interest_id in interest_ids]


def format_interests_for_prompt(
    interests_data,
    language: str = "pt",
    separator: str = ", "
) -> Optional[str]:
    """
    Format interests for inclusion in AI prompts with human-readable labels.
    
    Args:
        interests_data: Any format (list, string, JSON)
        language: Language for labels ("pt" or "en")
        separator: Separator between items (default: ", ")
        
    Returns:
        Formatted string like "Matemática, Física, Programação"
        
    Example:
        >>> format_interests_for_prompt(["math", "physics"])
        "Matemática, Física"
        
        >>> format_interests_for_prompt('["programming", "biology"]', "en")
        "Programming, Biology"
    """
    parsed = parse_interests(interests_data)
    if not parsed:
        return None
    
    labels = get_interest_labels(parsed, language)
    return separator.join(labels)
