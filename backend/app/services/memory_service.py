"""
Conversation Memory Service

Sistema de memória para otimização de contexto em conversas longas.
Reduz uso de tokens através de resumos automáticos.

Fluxo:
    messages → resumo automático → summary armazenado → últimas mensagens

Prompt final:
    system prompt + user profile + conversation summary + recent messages + user message

Benefícios:
  - Reduz tokens em 5-10x
  - Mantém contexto histórico relevante
  - Performance otimizada em chats longos
"""

from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from openai import OpenAI
import os

from app.models.conversation import Conversation
from app.models.message import Message
from app.core.logger import logger


# ============================================================
# CONFIGURAÇÕES DE MEMÓRIA
# ============================================================

# Número de mensagens recentes a manter sem resumir
RECENT_MESSAGES_WINDOW = 10

# Número mínimo de mensagens para acionar resumo
MIN_MESSAGES_FOR_SUMMARY = 20

# Limite máximo de mensagens antigas para resumir (evita contextos gigantes)
# Se passado esse valor, vai pegar as últimas 40 mensagens
MAX_MESSAGES_TO_SUMMARIZE = 40

# Modelo usado para gerar resumos (mais barato que o modelo principal)
SUMMARY_MODEL = "gpt-3.5-turbo"


# ============================================================
# MEMORY SERVICE
# ============================================================

class ConversationMemoryService:
    """Gerencia memória e contexto de conversas."""

    def __init__(self, db: Session):
        self.db = db
        self._client = None

    @property
    def client(self) -> OpenAI:
        """Lazy loading do cliente OpenAI."""
        if self._client is None:
            api_key = os.getenv("OPENAI_API_KEY")
            if not api_key:
                raise ValueError("OPENAI_API_KEY não configurada")
            self._client = OpenAI(api_key=api_key)
        return self._client

    def should_summarize(self, conversation_id: int) -> bool:
        """
        Verifica se a conversa precisa de um novo resumo.
        
        Args:
            conversation_id: ID da conversa
            
        Returns:
            True se deve resumir, False caso contrário
        """
        message_count = (
            self.db.query(Message)
            .filter(Message.conversation_id == conversation_id)
            .count()
        )
        
        return message_count >= MIN_MESSAGES_FOR_SUMMARY

    def summarize_conversation(
        self,
        conversation_id: int,
        force: bool = False
    ) -> Optional[str]:
        """
        Gera resumo das mensagens antigas da conversa.
        
        Args:
            conversation_id: ID da conversa
            force: Força resumo mesmo se não necessário
            
        Returns:
            Resumo gerado ou None se não foi necessário
        """
        conversation = (
            self.db.query(Conversation)
            .filter(Conversation.id == conversation_id)
            .first()
        )
        
        if not conversation:
            logger.error(f"Conversa {conversation_id} não encontrada")
            return None

        # Verifica se precisa resumir
        if not force and not self.should_summarize(conversation_id):
            summary_value = conversation.summary  # type: ignore
            return str(summary_value) if summary_value is not None else None

        # Pega todas as mensagens exceto as mais recentes
        all_messages = (
            self.db.query(Message)
            .filter(Message.conversation_id == conversation_id)
            .order_by(Message.created_at)
            .all()
        )

        if len(all_messages) < MIN_MESSAGES_FOR_SUMMARY:
            summary_value = conversation.summary  # type: ignore
            return str(summary_value) if summary_value is not None else None

        # Mensagens para resumir (exclui as últimas RECENT_MESSAGES_WINDOW)
        messages_to_summarize = all_messages[:-RECENT_MESSAGES_WINDOW]

        # 🔧 MELHORIA: Limita o tamanho do resumo
        # Se houver muitas mensagens, pega apenas as últimas MAX_MESSAGES_TO_SUMMARIZE
        if len(messages_to_summarize) > MAX_MESSAGES_TO_SUMMARIZE:
            messages_to_summarize = messages_to_summarize[-MAX_MESSAGES_TO_SUMMARIZE:]

        if not messages_to_summarize:
            summary_value = conversation.summary  # type: ignore
            return str(summary_value) if summary_value is not None else None

        # Formata mensagens para o prompt
        messages_text = "\n\n".join([
            f"{msg.role.upper()}: {msg.content}"
            for msg in messages_to_summarize
        ])

        # Gera resumo usando IA
        try:
            summary_prompt = f"""Resuma a seguinte conversa de forma concisa, mantendo:
- Principais tópicos discutidos
- Decisões ou conclusões importantes
- Contexto relevante para continuar a conversa

Conversa:
{messages_text}

Resumo:"""

            response = self.client.chat.completions.create(
                model=SUMMARY_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": "Você é um assistente especializado em resumir conversas de forma concisa e informativa."
                    },
                    {
                        "role": "user",
                        "content": summary_prompt
                    }
                ],
                max_tokens=500,
                temperature=0.3
            )

            summary = response.choices[0].message.content

            # Atualiza summary no banco
            conversation.summary = summary  # type: ignore
            self.db.commit()

            logger.info(f"Resumo gerado para conversa {conversation_id}: {len(summary) if summary else 0} chars")
            return summary

        except Exception as e:
            logger.error(f"Erro ao gerar resumo: {str(e)}", exc_info=True)
            summary_value = conversation.summary  # type: ignore
            return str(summary_value) if summary_value is not None else None

    def get_optimized_context(
        self,
        conversation_id: int,
        auto_summarize: bool = True
    ) -> Dict[str, Any]:
        """
        Retorna contexto otimizado da conversa (summary + recent messages).
        
        Args:
            conversation_id: ID da conversa
            auto_summarize: Se True, gera resumo automaticamente quando necessário
            
        Returns:
            Dict com:
                - summary: Resumo da conversa (ou None)
                - recent_messages: Lista das mensagens recentes
                - total_messages: Total de mensagens na conversa
        """
        conversation = (
            self.db.query(Conversation)
            .filter(Conversation.id == conversation_id)
            .first()
        )
        
        if not conversation:
            return {
                "summary": None,
                "recent_messages": [],
                "total_messages": 0
            }

        # Auto-resumo se necessário
        if auto_summarize and self.should_summarize(conversation_id):
            self.summarize_conversation(conversation_id)
            # Recarrega para pegar o summary atualizado
            self.db.refresh(conversation)

        # Pega mensagens recentes
        recent_messages = (
            self.db.query(Message)
            .filter(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.desc())
            .limit(RECENT_MESSAGES_WINDOW)
            .all()
        )
        
        # Inverte para ordem cronológica
        recent_messages = list(reversed(recent_messages))

        total_messages = (
            self.db.query(Message)
            .filter(Message.conversation_id == conversation_id)
            .count()
        )

        return {
            "summary": conversation.summary,
            "recent_messages": recent_messages,
            "total_messages": total_messages
        }

    def format_context_for_ai(
        self,
        conversation_id: int,
        auto_summarize: bool = True
    ) -> List[Dict[str, str]]:
        """
        Formata contexto otimizado para envio à IA.
        
        Args:
            conversation_id: ID da conversa
            auto_summarize: Se True, gera resumo automaticamente quando necessário
            
        Returns:
            Lista de mensagens formatadas para a IA, incluindo summary se existir
        """
        context = self.get_optimized_context(conversation_id, auto_summarize)
        
        messages = []

        # Adiciona resumo como contexto se existir
        if context["summary"]:
            messages.append({
                "role": "system",
                "content": f"📝 RESUMO DA CONVERSA ANTERIOR:\n{str(context['summary'])}"
            })

        # Adiciona mensagens recentes
        for msg in context["recent_messages"]:
            messages.append({
                "role": msg.role,
                "content": msg.content
            })

        return messages


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def get_memory_service(db: Session) -> ConversationMemoryService:
    """Factory function para criar instância do serviço."""
    return ConversationMemoryService(db)
