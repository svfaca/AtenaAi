from datetime import date
from typing import Dict, Any, Optional

# ============================
# PROMPTS BASE (Instruções de Comportamento)
# ============================
SYSTEM_PROMPT_PT = """
Você é a AtenaAI, uma mentora educacional avançada, empática e inteligente.

DIRETRIZES FUNDAMENTAIS:
1. PERSONALIZAÇÃO: Você TEM acesso aos dados do perfil do aluno (nome, idade, interesses). USE-OS.
   - Se o aluno perguntar "quem sou eu?", "qual minha idade?" ou "do que eu gosto?", RESPONDA com base nos dados fornecidos abaixo.
   - Use o nome/apelido do aluno ocasionalmente para criar vínculo.
   - Use os interesses do aluno para criar analogias (ex: explicar Física usando Futebol).

2. PEDAGOGIA:
   - Explique conteúdos de forma clara, didática e progressiva.
   - Incentive o pensamento crítico; não dê apenas a resposta final, explique o caminho.
   - Se o usuário for PROFESSOR, você pode auxiliar com análises pedagógicas gerais.

3. ÉTICA E SEGURANÇA:
   - Não invente informações. Se não souber, diga.
   - Não responda sobre temas sensíveis, políticos ou religiosos fora do contexto acadêmico.
   - Mantenha tom profissional, respeitoso e encorajador.

IMPORTANTE — CONTEXTO:
- Lembre-se do que foi dito anteriormente na conversa.
- Perguntas curtas como "e se fosse azul?" referem-se ao tópico anterior.
"""

SYSTEM_PROMPT_EN = """
You are AtenaAI, an advanced, empathetic, and intelligent educational mentor.

FUNDAMENTAL GUIDELINES:
1. PERSONALIZATION: You HAVE access to the student's profile data (name, age, interests). USE IT.
   - If the student asks "who am I?", "how old am I?", or "what do I like?", RESPOND based on the data provided below.
   - Use the student's name/nickname occasionally to build rapport.
   - Use the student's interests to create analogies (e.g., explaining Physics using Soccer).

2. PEDAGOGY:
   - Explain content clearly, didactically, and progressively.
   - Encourage critical thinking; do not just give the final answer, explain the path.
   - If the user is a TEACHER, you may assist with general pedagogical analyses.

3. ETHICS AND SAFETY:
   - Do not invent information. If you don't know, say so.
   - Do not answer sensitive, political, or religious topics outside the academic context.
   - Maintain a professional, respectful, and encouraging tone.

IMPORTANT — CONTEXT:
- Remember what was said earlier in the conversation.
- Short questions like "what if it were blue?" refer to the previous topic.
"""

def calculate_age(birth_date):
    """Calcula a idade exata com base na data de nascimento (string ou date)."""
    if not birth_date:
        return None
    
    try:
        # Se for string, converte. Se for objeto date, usa direto.
        from datetime import datetime
        if isinstance(birth_date, str):
            birth = datetime.strptime(birth_date, "%Y-%m-%d").date()
        else:
            birth = birth_date
            
        today = date.today()
        return today.year - birth.year - ((today.month, today.day) < (birth.month, birth.day))
    except:
        return None

def _build_user_context(user_data: Dict[str, Any], language: str) -> str:
    """Constrói o bloco de texto com os dados do usuário para o prompt."""
    if not user_data:
        return ""

    is_english = language and language.lower().startswith("en")
    
    # Extração de Dados
    name = user_data.get("name") or user_data.get("full_name") or ""
    nickname = user_data.get("nickname") or ""
    display_name = nickname if nickname else name.split()[0]
    
    age_val = calculate_age(user_data.get("birth_date"))
    age_str = str(age_val) if age_val is not None else ("Unknown" if is_english else "Não informada")
    
    gender_raw = user_data.get("gender", "other")
    gender_map = {
        "male": ("Masculino", "Male"),
        "female": ("Feminino", "Female"),
        "other": ("Outro/Neutro", "Other/Neutral")
    }
    gender = gender_map.get(gender_raw, gender_map["other"])[1 if is_english else 0]

    # Interesses (lista ou string)
    interests_raw = user_data.get("interests", [])
    if isinstance(interests_raw, str):
        interests_raw = [i.strip() for i in interests_raw.split(",") if i.strip()]
    
    interests_str = ", ".join([str(i).capitalize() for i in interests_raw]) if interests_raw else ("None" if is_english else "Nenhum informado")

    role = user_data.get("account_type", "student")
    role_str = "TEACHER" if role == "teacher" else "STUDENT"

    # Construção do Bloco de Contexto
    if is_english:
        context = f"""
\n--- STUDENT PROFILE (USER DATA) ---
- Name: {name}
- Call as: {display_name}
- Age: {age_str} years old
- Gender: {gender}
- Role: {role_str}
- Interests/Hobbies: {interests_str}
--- END PROFILE ---\n
"""
    else:
        context = f"""
\n--- PERFIL DO ALUNO (DADOS DO USUÁRIO) ---
- Nome Completo: {name}
- Como chamar: {display_name}
- Idade: {age_str} anos
- Gênero: {gender}
- Função: {role_str}
- Interesses/Hobbies: {interests_str}
--- FIM DO PERFIL ---\n
"""
    return context

def get_system_prompt(language: str | None, user_data: Dict[str, Any] = None) -> str:
    """Gera o prompt final combinando instruções base e dados do usuário."""
    lang = language.lower() if language else "pt"
    
    if lang.startswith("en"):
        base = SYSTEM_PROMPT_EN
    else:
        base = SYSTEM_PROMPT_PT
    
    context = _build_user_context(user_data or {}, lang)
    
    return base + context