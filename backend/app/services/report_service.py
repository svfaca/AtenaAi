from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.models.conversation import Conversation
from app.models.message import Message
from app.models.student_report import StudentReport
from app.services.ai_service import ask_ai


# =========================
# CONFIG
# =========================
MAX_MESSAGES = 120      # últimas mensagens (mais relevantes)
CACHE_HOURS = 24       # validade do relatório


# =========================================================
# PUBLIC API
# =========================================================
def generate_student_report(student_id: int, db: Session):
    """
    Retorna relatório do aluno.
    Usa cache automático para evitar custo desnecessário com IA.
    
    🧠 ETAPA 3 - Inteligente:
    - Reutiliza cache se NÃO há novas mensagens
    - Regenera APENAS com new messages
    """

    # =========================
    # 1️⃣ verificar cache
    # =========================
    cached = (
        db.query(StudentReport)
        .filter(StudentReport.student_id == student_id)
        .order_by(StudentReport.created_at.desc())
        .first()
    )

    # =========================
    # 2️⃣ se tem cache, verificar novas mensagens
    # =========================
    if cached:
        new_messages = (
            db.query(Message)
            .join(Conversation)
            .filter(
                Conversation.user_id == student_id,
                Message.created_at > cached.created_at
            )
            .count()
        )
        
        # ⚡ Cache válido: SEM novas mensagens
        if new_messages == 0:
            return cached.content

        # ⏱️ Cache expirado: tem novas mensagens, regenera


    # =========================
    # 3️⃣ gerar novo relatório
    # =========================
    report_text = _generate_with_ai(student_id, db)


    # =========================
    # 4️⃣ salvar cache
    # =========================
    new_report = StudentReport(
        student_id=student_id,
        content=report_text
    )

    db.add(new_report)
    db.commit()

    return report_text


# =========================================================
# PRIVATE (IA generation)
# =========================================================
def _generate_with_ai(student_id: int, db: Session):

    # -------------------------
    # buscar últimas mensagens
    # -------------------------
    messages = (
        db.query(Message)
        .join(Conversation)
        .filter(Conversation.user_id == student_id)
        .order_by(Message.created_at.desc())
        .limit(MAX_MESSAGES)
        .all()
    )

    messages.reverse()

    total_messages = len(messages)

    # -------------------------
    # formatar contexto
    # -------------------------
    formatted = []

    for m in messages:
        role = "ALUNO" if m.role == "user" else "IA"
        formatted.append(f"{role}: {m.content}")

    user_text = "\n".join(formatted)


    # -------------------------
    # prompt profissional
    # -------------------------
    prompt = f"""
    Você é um professor pedagogo especialista em análise de aprendizagem.

    Analise o comportamento do aluno com base nas interações abaixo.

    DADOS:
    - Mensagens analisadas: {total_messages}

    CONVERSAS:
    {user_text}

    Gere um relatório pedagógico profissional contendo:

    1. Resumo do perfil
    2. Pontos fortes
    3. Principais dificuldades
    4. Padrões de comportamento observados
    5. Recomendações práticas de estudo
    6. Estratégias para o professor aplicar
    7. Nota de engajamento (0-10)

    Seja específico, direto, acionável.
    Máximo 250 palavras.
    """

    return ask_ai(prompt)
