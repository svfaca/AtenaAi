"""
User Context Builder Service

Serviço centralizado para construir contexto rico do usuário
para prompts da IA, garantindo consistência e manutenibilidade.

Benefícios:
  - Contexto padronizado em toda aplicação
  - Fácil adicionar novos campos ao contexto
  - Separação de responsabilidades
  - Performance otimizada
"""

from typing import Optional, Dict, Any, List
from datetime import date, datetime

from app.models.user import User, UserRole
from app.utilities.interests import parse_interests


# ============================================================
# LABEL MAPS - Tradução de valores do banco para labels legíveis
# ============================================================

INTEREST_LABELS = {
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

GENDER_LABELS = {
    "M": "Masculino",
    "F": "Feminino",
    "O": "Outro",
    "NB": "Não-binário",
}

ROLE_LABELS = {
    UserRole.student: "Estudante",
    UserRole.teacher: "Professor",
    UserRole.admin: "Administrador",
}


# ============================================================
# CONTEXT BUILDER
# ============================================================

class UserContextBuilder:
    """Construtor de contexto de usuário para prompts de IA."""

    def __init__(self, user: User):
        self.user = user
        self._interests_parsed: Optional[List[str]] = None

    @property
    def interests(self) -> List[str]:
        """Parse interests apenas uma vez (lazy)"""
        if self._interests_parsed is None:
            self._interests_parsed = parse_interests(self.user.interests)
        return self._interests_parsed

    def get_age(self) -> Optional[int]:
        """Calcula idade a partir da data de nascimento"""
        if not self.user.birth_date:
            return None

        today = date.today()
        age = today.year - self.user.birth_date.year

        # Ajusta se ainda não fez aniversário este ano
        if today.month < self.user.birth_date.month or (
            today.month == self.user.birth_date.month
            and today.day < self.user.birth_date.day
        ):
            age -= 1

        return age

    def get_interest_labels(self) -> List[str]:
        """Converte IDs de interesses para labels legíveis"""
        return [
            INTEREST_LABELS.get(interest_id, interest_id)
            for interest_id in self.interests
        ]

    def build_basic_context(self) -> Dict[str, Any]:
        """
        Contexto básico estruturado (para JSON/APIs).
        
        Retorna dict com campos preenchidos.
        """
        context = {
            "id": self.user.id,
            "name": self.user.full_name,
            "role": self.user.role.value,
        }

        if self.user.nickname:
            context["nickname"] = self.user.nickname

        if self.user.email:
            context["email"] = self.user.email

        if self.user.gender:
            context["gender"] = self.user.gender

        age = self.get_age()
        if age is not None:
            context["age"] = age

        if self.interests:
            context["interests"] = self.interests
            context["interest_labels"] = self.get_interest_labels()

        return context

    def build_prompt_context(
        self,
        include_email: bool = False,
        include_age: bool = True,
        language: str = "pt"
    ) -> str:
        """
        Contexto formatado para prompts de IA (texto).
        
        Args:
            include_email: Incluir email no contexto
            include_age: Incluir idade no contexto
            language: Idioma do contexto (pt/en)
            
        Returns:
            String formatada para inclusão em system prompt
        """
        parts = []

        # Header
        if language == "en":
            parts.append("=== USER INFORMATION ===")
        else:
            parts.append("=== INFORMAÇÕES DO USUÁRIO ===")

        # Nome
        name_to_use = self.user.nickname or self.user.full_name
        if language == "en":
            parts.append(f"Name: {name_to_use}")
        else:
            parts.append(f"Nome: {name_to_use}")

        # Tipo de conta
        role_label = ROLE_LABELS.get(self.user.role, self.user.role.value)
        if language == "en":
            role_en = {
                "Estudante": "Student",
                "Professor": "Teacher",
                "Administrador": "Administrator",
            }.get(role_label, role_label)
            parts.append(f"Account Type: {role_en}")
        else:
            parts.append(f"Tipo de Conta: {role_label}")

        # Email (opcional)
        if include_email and self.user.email:
            parts.append(f"Email: {self.user.email}")

        # Idade (opcional)
        if include_age:
            age = self.get_age()
            if age is not None:
                if language == "en":
                    parts.append(f"Age: {age} years")
                else:
                    parts.append(f"Idade: {age} anos")

        # Gênero
        if self.user.gender:
            gender_label = GENDER_LABELS.get(self.user.gender, self.user.gender)
            if language == "en":
                gender_en = {
                    "Masculino": "Male",
                    "Feminino": "Female",
                    "Outro": "Other",
                    "Não-binário": "Non-binary",
                }.get(gender_label, gender_label)
                parts.append(f"Gender: {gender_en}")
            else:
                parts.append(f"Gênero: {gender_label}")

        # Interesses
        if self.interests:
            interest_labels = self.get_interest_labels()
            if language == "en":
                # Traduzir labels para inglês (básico)
                parts.append(f"Areas of Interest: {', '.join(self.interests)}")
            else:
                parts.append(f"Áreas de Interesse: {', '.join(interest_labels)}")

        return "\n".join(parts)

    def build_compact_context(self) -> str:
        """
        Contexto ultra-compacto para tokens limitados.
        
        Exemplo: "Maria (15 anos, Matemática, Física)"
        """
        name = self.user.nickname or self.user.full_name
        details = []

        age = self.get_age()
        if age:
            details.append(f"{age} anos")

        if self.interests:
            interest_labels = self.get_interest_labels()
            details.append(", ".join(interest_labels[:3]))  # Max 3 interesses

        if details:
            return f"{name} ({', '.join(details)})"
        return name


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def build_user_context(
    user: User,
    format: str = "prompt",
    **kwargs
) -> str | Dict[str, Any]:
    """
    Função helper para construir contexto de usuário.
    
    Args:
        user: Objeto User do banco
        format: Formato de saída ("prompt", "basic", "compact")
        **kwargs: Argumentos adicionais para os builders
        
    Returns:
        String formatada ou dict dependendo do formato
    """
    builder = UserContextBuilder(user)

    if format == "basic":
        return builder.build_basic_context()
    elif format == "compact":
        return builder.build_compact_context()
    elif format == "prompt":
        return builder.build_prompt_context(**kwargs)
    else:
        raise ValueError(f"Unknown format: {format}")


def get_user_interest_labels(user: User) -> List[str]:
    """
    Helper rápido para pegar labels de interesses.
    
    Usage:
        labels = get_user_interest_labels(user)
        # ["Matemática", "Física", "Programação"]
    """
    builder = UserContextBuilder(user)
    return builder.get_interest_labels()


# ============================================================
# EXEMPLO DE USO
# ============================================================

if __name__ == "__main__":
    from datetime import date

    class MockUser:
        def __init__(self):
            self.id = 1
            self.full_name = "Maria Silva"
            self.nickname = "Maria"
            self.email = "maria@example.com"
            self.role = UserRole.student
            self.gender = "F"
            self.birth_date = date(2008, 5, 15)
            self.interests = '["math", "physics", "programming"]'

    user = MockUser()
    builder = UserContextBuilder(user)

    print("=== BASIC CONTEXT ===")
    print(builder.build_basic_context())
    print()

    print("=== PROMPT CONTEXT (PT) ===")
    print(builder.build_prompt_context())
    print()

    print("=== PROMPT CONTEXT (EN) ===")
    print(builder.build_prompt_context(language="en"))
    print()

    print("=== COMPACT CONTEXT ===")
    print(builder.build_compact_context())
