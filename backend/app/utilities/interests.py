"""
Utilitários para normalização de interesses do usuário.
Converte valores em inglês para português e mantém consistência.
"""
import json
from typing import Optional, List

# Mapa de normalização: inglês/variações -> português
INTERESTS_NORMALIZATION_MAP = {
    # Inglês para português
    "math": "Matemática",
    "mathematics": "Matemática",
    "statistics": "Estatística",
    "physics": "Física",
    "chemistry": "Química",
    "programming": "Programação",
    "program": "Programação",
    "engineer": "Engenharia",
    "engineering": "Engenharia",
    "biology": "Biologia",
    "health": "Saúde",
    "anatomy": "Anatomia",
    "physical education": "Ed. Física",
    "education": "Ed. Física",
    "ed. fisica": "Ed. Física",
    "history": "História",
    "geography": "Geografia",
    "philosophy": "Filosofia",
    "sociology": "Sociologia",
    "psychology": "Psicologia",
    "literature": "Literatura",
    "languages": "Idiomas",
    "language": "Idiomas",
    "writing": "Redação",
    "law": "Direito",
    "economics": "Economia",
    "economy": "Economia",
    "arts": "Artes",
    "art": "Artes",
    "research": "Pesquisa",
    "studies": "Estudos",
    "study": "Estudos",
}


def normalize_interests(interests_data: Optional[str]) -> Optional[str]:
    """
    Normaliza interesses para usar sempre os nomes em português.
    Converte inglês/lowercase para valores padrão e remove duplicatas.
    
    Args:
        interests_data: String JSON list ou CSV
        
    Returns:
        String JSON com interesses normalizados ou None
    """
    if not interests_data or not interests_data.strip():
        return None
    
    try:
        # Tenta parsear como JSON
        parsed = json.loads(interests_data)
        if not isinstance(parsed, list):
            parsed = [interests_data]
    except (json.JSONDecodeError, TypeError, ValueError):
        # Se não for JSON, trata como CSV
        parsed = [i.strip() for i in interests_data.split(",")]
    
    normalized = set()
    
    for interest in parsed:
        if not interest or not isinstance(interest, str):
            continue
        
        interest_clean = interest.strip()
        interest_lower = interest_clean.lower()
        
        # Tenta encontrar no mapa de normalização (case-insensitive)
        if interest_lower in INTERESTS_NORMALIZATION_MAP:
            normalized.add(INTERESTS_NORMALIZATION_MAP[interest_lower])
        else:
            # Se não estiver no mapa, usa o valor original (pode estar correto em português)
            normalized.add(interest_clean)
    
    # Retorna como JSON array ordenado alphabetically
    if normalized:
        return json.dumps(sorted(list(normalized)), ensure_ascii=False)
    
    return None


def parse_interests(interests_data: Optional[str]) -> List[str]:
    """
    Faz parse de interesses (JSON or CSV) e retorna lista normalizada.
    Usado no validador do Pydantic.
    """
    if interests_data is None:
        return []
    
    if isinstance(interests_data, list):
        return sorted(list(set(interests_data)))
    
    if isinstance(interests_data, str) and interests_data.strip():
        try:
            # Tenta parsear como JSON
            parsed = json.loads(interests_data)
            if isinstance(parsed, list):
                return sorted(list(set(parsed)))
        except (json.JSONDecodeError, ValueError):
            pass
        
        # Se não for JSON, trata como CSV
        result = [i.strip() for i in interests_data.split(",") if i.strip()]
        return sorted(list(set(result)))
    
    return []
