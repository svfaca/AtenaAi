from openai import OpenAI
from app.core.prompts import get_system_prompt
from app.core.config import AI_MODEL
from app.core.logger import logger
from app.core.prompt_security import sandwich_with_security, contains_suspicious_patterns
from app.utilities.interests import format_interests_for_prompt
from datetime import date
from typing import Optional, Sequence, Tuple
import os
import re
from threading import Lock


# =========================================================
# CONFIG DE CUSTO / RESILIÊNCIA DA OPENAI
# =========================================================
# 🔒 Limite de tokens de SAÍDA por chamada (controle de custo: uma resposta
# gigante pode custar caro por request, especialmente em modo visitante).
MAX_OUTPUT_TOKENS = int(os.getenv("MAX_OUTPUT_TOKENS", "2048"))
# Timeout em segundos + retries do cliente OpenAI (evita requests pendurados
# segurando workers por minutos).
OPENAI_TIMEOUT_SECONDS = int(os.getenv("OPENAI_TIMEOUT_SECONDS", "60"))
OPENAI_MAX_RETRIES = int(os.getenv("OPENAI_MAX_RETRIES", "2"))


# =========================================================
# HELPER: Build user context efficiently
# =========================================================
def build_user_context(
    user_name: Optional[str] = None,
    user_nickname: Optional[str] = None,
    user_email: Optional[str] = None,
    user_gender: Optional[str] = None,
    user_birth_date: Optional[date] = None,
    user_account_type: Optional[str] = None,
    user_interests: Optional[str | Sequence[str]] = None,
    language: str = "pt"
) -> str:
    """
    Build user profile context from optional profile fields.
    
    Returns a formatted string with user information that gets appended
    to the system prompt for AI personalization.
    
    Args:
        user_name: Full name
        user_nickname: Preferred nickname
        user_email: Email address
        user_gender: Gender (M/F/O)
        user_birth_date: Birth date
        user_account_type: Account type (student/teacher/admin)
        user_interests: Interests (list of IDs or JSON string)
        language: Language for labels ("pt" or "en")
        
    Returns:
        Formatted string with user profile information
    """
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

    # Convert interest IDs to human-readable labels
    interests_formatted = format_interests_for_prompt(user_interests, language)
    if interests_formatted:
        context_parts.append(f"Áreas de Interesse: {interests_formatted}")

    if not context_parts:
        return "\n\n=== INFORMAÇÕES DO USUÁRIO ===\nUsuário visitante."

    return "\n\n=== INFORMAÇÕES DO USUÁRIO ===\n" + "\n".join(context_parts) + "\n\nUse essas informações para personalizar as respostas."


# Cliente global com lock para thread-safety
def _detect_and_log_suspicious(messages: list, user_id: Optional[int]) -> str:
    """
    Varre as mensagens do usuário procurando padrões de jailbreak/prompt
    injection e registra um warning. Retorna o conteúdo concatenado.
    """
    user_message_content = ""
    for msg in messages:
        if isinstance(msg, dict) and msg.get("role") == "user":
            content = msg.get("content", "")
            if isinstance(content, str):
                user_message_content += content + "\n"

    if contains_suspicious_patterns(user_message_content):
        logger.warning(
            f"⚠️ Padrão suspeito detectado do usuário {user_id}: "
            "possível tentativa de jailbreak"
        )

    return user_message_content.strip()


def _prepare_secure_messages(
    messages: list,
    user_context: str,
    language: Optional[str],
) -> Tuple[str, list]:
    """
    Monta o system prompt com o reforço de segurança (sandwich) e a lista de
    mensagens com a ÚLTIMA mensagem do usuário isolada por delimitadores.

    Usado TANTO no stream quanto no não-stream — antes a proteção existia
    apenas no fluxo não-stream, deixando o chat principal (stream) sem ela.

    Retorna (system_prompt_reforçado, mensagens_isoladas).
    """
    system_prompt = get_system_prompt(language)
    if user_context:
        system_prompt += user_context

    # Encontra a última mensagem do usuário (a pergunta atual)
    last_user_msg = None
    for msg in reversed(messages):
        if (
            isinstance(msg, dict)
            and msg.get("role") == "user"
            and isinstance(msg.get("content"), str)
            and msg["content"].strip()
        ):
            last_user_msg = msg
            break

    if last_user_msg is None:
        return system_prompt, list(messages)

    reinforced_system, isolated_user_message = sandwich_with_security(
        system_prompt,
        user_context,
        last_user_msg["content"],
        language or "pt",
    )

    secured_messages = list(messages)
    for i in range(len(secured_messages) - 1, -1, -1):
        if secured_messages[i] is last_user_msg:
            secured_messages[i] = {
                **secured_messages[i],
                "content": isolated_user_message,
            }
            break

    return reinforced_system, secured_messages



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

        _client = OpenAI(
            api_key=api_key,
            # 🔒 Timeout + retries: evita chamadas penduradas segurando workers
            timeout=OPENAI_TIMEOUT_SECONDS,
            max_retries=OPENAI_MAX_RETRIES,
        )
        logger.info("Cliente OpenAI inicializado com sucesso")
        return _client


def generate_ai_response(
    messages: list,
    user_id: Optional[int] = None,
    user_email: Optional[str] = None,
    user_name: Optional[str] = None,
    user_nickname: Optional[str] = None,
    user_account_type: Optional[str] = None,
    user_interests: Optional[str | Sequence[str]] = None,
    user_gender: Optional[str] = None,
    user_birth_date: Optional[date] = None,
    language: Optional[str] = None
):
    """Gera resposta da IA usando OpenAI e contexto do usuário com proteção contra prompt injection"""

    try:
        # 🔒 SEGURANÇA: Detecta tentativas de jailbreak
        _detect_and_log_suspicious(messages, user_id)

        # Adiciona contexto do usuário usando função otimizada
        user_context = build_user_context(
            user_name=user_name,
            user_nickname=user_nickname,
            user_email=user_email,
            user_gender=user_gender,
            user_birth_date=user_birth_date,
            user_account_type=user_account_type,
            user_interests=user_interests,
            language=language or "pt"
        )

        # 🔒 REFORÇO DE SEGURANÇA: system prompt com sandwich + mensagem do
        # usuário isolada por delimitadores (anti prompt-injection)
        reinforced_system, secured_messages = _prepare_secure_messages(
            messages, user_context, language
        )

        client = get_client()

        response = client.chat.completions.create(
            model=AI_MODEL,
            messages=[
                {"role": "system", "content": reinforced_system},
                *secured_messages
            ],
            max_tokens=MAX_OUTPUT_TOKENS,  # 🔒 controle de custo por resposta
        )

        return response.choices[0].message.content

    except Exception as e:
        logger.error(f"Erro ao chamar IA: {str(e)}", exc_info=True)
        return "Desculpe, ocorreu um erro ao processar sua mensagem."


def generate_ai_response_stream(
    messages: list,
    user_id: Optional[int] = None,
    user_email: Optional[str] = None,
    user_name: Optional[str] = None,
    user_nickname: Optional[str] = None,
    user_account_type: Optional[str] = None,
    user_interests: Optional[str | Sequence[str]] = None,
    user_gender: Optional[str] = None,
    user_birth_date: Optional[date] = None,
    language: Optional[str] = None,
    max_retries: int = 2
):
    """Gera resposta da IA com streaming - yield tokens um por um"""

    # 🔒 SEGURANÇA: Detecta tentativas de jailbreak (uma vez, fora do retry)
    _detect_and_log_suspicious(messages, user_id)

    user_context = build_user_context(
        user_name=user_name,
        user_nickname=user_nickname,
        user_email=user_email,
        user_gender=user_gender,
        user_birth_date=user_birth_date,
        user_account_type=user_account_type,
        user_interests=user_interests,
        language=language or "pt"
    )

    for attempt in range(max_retries):
        try:
            # 🔒 SEGURANÇA (mesmo reforço da versão não-stream): sandwich no
            # system prompt + mensagem do usuário isolada por delimitadores
            system_prompt, secured_messages = _prepare_secure_messages(
                messages, user_context, language
            )

            client = get_client()

            # Stream=True para streaming de tokens
            stream = client.chat.completions.create(
                model=AI_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    *secured_messages
                ],
                stream=True,
                max_tokens=MAX_OUTPUT_TOKENS,  # 🔒 controle de custo por resposta
            )

            # Yield cada token conforme chega
            for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    yield chunk.choices[0].delta.content
            
            return  # Sucesso - sair da loop de retry

        except Exception as e:
            logger.error(f"Erro ao chamar IA (tentativa {attempt + 1}/{max_retries}): {str(e)}", exc_info=True)
            
            if attempt == max_retries - 1:
                # Última tentativa falhou - yield mensagem de erro
                yield "Desculpe, ocorreu um erro ao processar sua mensagem."
                return
            
            # Tentar novamente


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


# =========================================================
# 🆕 AI MENTION DETECTION & CLASSROOM BROADCAST
# =========================================================

class AIMentionDetector:
    """Detector de menções à IA com pattern matching case-insensitive"""
    
    # Pattern case-insensitive para @atenaai
    AI_MENTION_PATTERN = re.compile(r'@atenaai', re.IGNORECASE)
    
    @staticmethod
    def detect_ai_mention(content: str) -> Tuple[bool, Optional[str]]:
        """
        Detecta se a mensagem menciona a IA (@atenaai, @Atena, etc)
        
        Args:
            content: Conteúdo da mensagem
            
        Returns:
            Tuple[bool, Optional[str]]: (tem_mention, texto_da_pergunta)
        """
        if not content or not isinstance(content, str):
            return False, None
        
        # Buscar padrão de mention
        match = AIMentionDetector.AI_MENTION_PATTERN.search(content)
        
        if not match:
            return False, None
        
        # Extrair apenas a pergunta (após a mention)
        start_pos = match.end()
        question = content[start_pos:].strip()
        
        if not question:
            # Se não há conteúdo após @mention, usar a mensagem inteira menos a mention
            question = content.replace(match.group(), '').strip()
        
        return True, question if question else content
    
    @staticmethod
    def extract_all_mentions(content: str) -> list:
        """Extrai todas as mentions @username da mensagem"""
        pattern = re.compile(r'@(\w+)', re.IGNORECASE)
        return pattern.findall(content)


def detect_ai_mention(message_content: str) -> Tuple[bool, Optional[str]]:
    """
    Helper function para detectar menção à IA
    
    Returns:
        (tem_mention, pergunta_limpa)
    """
    return AIMentionDetector.detect_ai_mention(message_content)


async def generate_classroom_ai_response(
    prompt: str,
    classroom_id: int,
    user_id: int,
    user_name: str,
    user_interests: Optional[str] = None
) -> Optional[str]:
    """
    Gera resposta da IA para broadcast em classroom
    
    Args:
        prompt: Pergunta/comando do usuário
        classroom_id: ID da sala
        user_id: ID do usuário
        user_name: Nome do usuário
        user_interests: Interesses do usuário
        
    Returns:
        Resposta gerada ou None se erro
    """
    try:
        if not prompt or not prompt.strip():
            return None
        
        # Chamar IA com contexto de sala de aula
        response = generate_ai_response(
            messages=[{"role": "user", "content": prompt}],
            user_id=user_id,
            user_name=user_name,
            user_interests=user_interests,
            user_account_type="student",
            language="pt"
        )
        
        logger.info(f"[AI] Resposta gerada para classroom {classroom_id}, user {user_id}")
        return response
        
    except Exception as e:
        logger.error(f"[AI] Erro ao gerar resposta de classroom: {str(e)}", exc_info=True)
        return None


def get_ai_user_representation() -> dict:
    """Retorna como a IA deve ser representada nas mensagens"""
    return {
        "id": 0,
        "user_id": 0,
        "user_name": "AtenaAI",
        "role": "ai",
        "is_ai": True
    }
