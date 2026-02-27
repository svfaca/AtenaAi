from openai import OpenAI
from app.core.prompts import get_system_prompt
from app.core.config import AI_MODEL
from app.core.logger import logger
from datetime import date
import os
from threading import Lock


# =========================================================
# HELPER: Build user context efficiently
# =========================================================
def build_user_context(
    user_name: str = None,
    user_nickname: str = None,
    user_email: str = None,
    user_gender: str = None,
    user_birth_date = None,
    user_account_type: str = None,
    user_interests: str = None
) -> str:
    """Build user context string efficiently using list join (O(n) vs O(n²))"""
    context_parts = []
    
    if user_name:
        context_parts.append(f"Nome: {user_name}")
    if user_nickname:
        context_parts.append(f"Apelido: {user_nickname}")
    if user_email:
        context_parts.append(f"Email: {user_email}")
    if user_gender:
        context_parts.append(f"Gênero: {user_gender}")
    if user_birth_date:
        context_parts.append(f"Data de Nascimento: {user_birth_date}")
    if user_account_type:
        context_parts.append(f"Tipo de Conta: {user_account_type}")
    if user_interests:
        context_parts.append(f"Áreas de Interesse: {user_interests}")
    
    if not context_parts:
        return ""
    
    return "\n\n=== INFORMAÇÕES DO USUÁRIO ===\n" + "\n".join(context_parts) + "\n\nUse essas informações para personalizar as respostas."


# Cliente global com lock para thread-safety
_client = None
_client_lock = Lock()


def get_client():
    """Obtém ou cria cliente OpenAI com validação de chave (thread-safe)"""
    global _client
    
    if _client is not None:
        return _client

    with _client_lock:
        # Double-check pattern para evitar race condition
        if _client is not None:
            return _client
            
        api_key = os.getenv("OPENAI_API_KEY")
        
        if not api_key:
            logger.error("OPENAI_API_KEY não configurada")
            raise ValueError("OPENAI_API_KEY não configurada")

        _client = OpenAI(api_key=api_key)
        logger.info("Cliente OpenAI inicializado com sucesso")
        return _client


def generate_ai_response(
    messages: list,
    user_id: int = None,
    user_email: str = None,
    user_name: str = None,
    user_nickname: str = None,
    user_account_type: str = None,
    user_interests: str = None,
    user_gender: str = None,
    user_birth_date: date = None,
    language: str | None = None
):
    """Gera resposta da IA usando OpenAI e contexto do usuário"""

    try:
        system_prompt = get_system_prompt(language)

        # Adiciona contexto do usuário usando função otimizada
        user_context = build_user_context(
            user_name=user_name,
            user_nickname=user_nickname,
            user_email=user_email,
            user_gender=user_gender,
            user_birth_date=user_birth_date,
            user_account_type=user_account_type,
            user_interests=user_interests
        )
        
        if user_context:
            system_prompt += user_context

        client = get_client()

        response = client.chat.completions.create(
            model=AI_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                *messages
            ]
        )

        return response.choices[0].message.content

    except Exception as e:
        logger.error(f"Erro ao chamar IA: {str(e)}", exc_info=True)
        return "Desculpe, ocorreu um erro ao processar sua mensagem."


# =========================================================
# SIMPLE PROMPT (relatórios / análises)
# =========================================================
def ask_ai(prompt: str) -> str:
    """
    Wrapper simples para casos onde só precisamos enviar
    um prompt único (relatórios, análises, resumos).
    """
    return generate_ai_response(
        messages=[{"role": "user", "content": prompt}]
    )
