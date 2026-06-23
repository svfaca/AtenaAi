# ✅ Arquitetura de Classrooms com AI Implementada

## 🎯 O que foi feito

Transformei seu sistema de chat 1-1 em uma arquitetura **Discord + ChatGPT** com:
- **Classrooms colaborativas** (múltiplos usuários + IA mencionável)
- **Roles granulares** (admin, moderator, teacher, student)
- **AI mention detection** (@atenaai case-insensitive)
- **WebSocket com broadcast** (todos recebem respostas da IA)
- **Suporte OpenAI integrado** (reutiliza sua config existente)

---

## 📊 Schema Database (NOVO)

### Tabelas criadas/atualizadas:

#### 1️⃣ `classrooms` (ATUALIZADA)
```sql
- id (INT, PK)
- name (VARCHAR)
- code (VARCHAR, UNIQUE) -- código único
- teacher_id (FK users)
- created_at (DATETIME) -- NEW
- updated_at (DATETIME) -- NEW
```

#### 2️⃣ `classroom_members` (NOVA)
```sql
- id (INT, PK)
- classroom_id (FK classrooms)
- user_id (FK users)
- role (ENUM: admin, moderator, teacher, student) -- NOVO!
- joined_at (DATETIME)
- updated_at (DATETIME)
```

#### 3️⃣ `group_messages` (EXISTENTE)
```sql
- id (INT, PK)
- classroom_id (FK classrooms)
- user_id (FK users) -- pode ser 0 para IA
- content (TEXT)
- created_at (DATETIME)
```

---

## 🚀 Como usar

### 1. Migração do banco
```bash
cd backend
alembic upgrade head
```

### 2. Iniciar backend
```bash
cd backend
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### 3. WebSocket - Conectar à sala
```javascript
// Frontend (exemplo TypeScript)
const token = localStorage.getItem("token");
const ws = new WebSocket(
  `ws://localhost:8000/group-chat/ws/1?token=${token}`
);

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log(message); // {type: "message", user_name, content, timestamp, ...}
};

// Enviar mensagem normal
ws.send(JSON.stringify({
  content: "Olá pessoal!"
}));

// CHAMAR A IA
ws.send(JSON.stringify({
  content: "@atenaai explica MRUV"
}));
```

### 4. Fluxo de message com IA

```
USUÁRIO envia:
  "@atenaai explica MRU"
        ↓
SERVIDOR detecta @atenaai
        ↓
AI SERVICE gera resposta
  (usa OpenAI/sua IA)
        ↓
SALVA em group_messages
  com user_id = 0
        ↓
BROADCAST para sala:
{
  "type": "message",
  "user_name": "AtenaAI",
  "content": "MRU significa...",
  "is_ai": true
}
```

---

## 📁 Arquivos Modificados/Criados

### Models (Backend)
- ✅ `app/models/classroom_member.py` - **NOVO**: ClassroomMember com roles
- ✅ `app/models/classroom.py` - Adicionado: members relationship + timestamps
- ✅ `app/models/user.py` - Adicionado: classroom_memberships relationship
- ✅ `app/models/__init__.py` - Import do novo ClassroomMember

### Services
- ✅ `app/services/ai_service.py` - APRIMORADO:
  - `AIMentionDetector` - Detecta @atenaai (case-insensitive)
  - `detect_ai_mention()` - Função principal
  - `generate_classroom_ai_response()` - Gera resposta para room
  - `get_ai_user_representation()` - Como IA aparece nas msgs

### Routes
- ✅ `app/routes/group_chat.py` - APRIMORADO:
  - Import AI functions
  - Detecta mentions no message loop
  - `_handle_ai_response()` - Background task assíncrono
  - Broadcast de respostas para todos

### Schemas
- ✅ `app/schemas/teacher.py` - Adicionados:
  - `ClassroomMemberCreate`
  - `ClassroomMemberResponse`
  - `ClassroomMemberUpdate`
  - `ClassroomWithMembersResponse`

### Migrations
- ✅ `alembic/versions/a8d5f7e3c1f9_add_classroom_members_and_ai_support.py` - NOVA

---

## 🔑 Características principais

### 1. Detecção de @mention (case-insensitive)
```python
# Funciona com:
@atenaai
@AtenaAI
@ATENAAI
@atenaaI
```

### 2. Non-blocking AI responses
```python
# AI response roda em background (não trava WebSocket)
asyncio.create_task(_handle_ai_response(...))
```

### 3. Integração OpenAI
```python
# Usa mesma config que conversations (1-1)
# Variáveis de ambiente:
OPENAI_API_KEY=sk-...
AI_MODEL=gpt-4o-mini  # ou seu modelo
```

### 4. Roles granulares
```python
enum ClassroomMemberRole:
  admin       # Controle total
  moderator   # Gerencia msgs
  teacher     # Dono da sala
  student     # Padrão
```

---

## ⚠️ Importante: AI User ID = 0

Quando a IA responde, a mensagem é salva com:
```python
user_id = 0  # Special ID para IA
user_name = "AtenaAI"
is_ai = True
```

No frontend, você deve tratar assim:
```javascript
if (message.is_ai || message.user_id === 0) {
  // Render como mensagem da IA
  renderAIMessage(message);
} else {
  // Render como usuário normal
  renderUserMessage(message);
}
```

---

## 🔄 Próximos passos recomendados

### 1. Criar endpoints REST para gerenciamento de membros
```
POST   /classrooms/{id}/members                    # Adicionar membro
DELETE /classrooms/{id}/members/{member_id}       # Remover
PUT    /classrooms/{id}/members/{member_id}/role  # Mudar role
GET    /classrooms/{id}/members                   # Listar com roles
```

### 2. Integrar migrations no startup
```python
# app/main.py
@app.on_event("startup")
def run_migrations():
    os.system("alembic upgrade head")
```

### 3. Frontend: Tratamento de AI messages
```tsx
// components/ChatMessage.tsx
export const ChatMessage = ({ message }) => {
  if (message.is_ai) {
    return <AIMessage content={message.content} />;
  }
  return <UserMessage name={message.user_name} content={message.content} />;
};
```

### 4. Melhorar detecção de mention
```python
# Adicionar aliases de IA
class AIMentionDetector:
    AI_ALIASES = {'@atenaai', '@atena', '@ia', '@atena-ia'}
    # E adaptar logic
```

### 5. Adicionar contexto de conversa antes de gerar resposta
```python
# Em ai_service.py
async def generate_classroom_ai_response(...):
    # Buscar últimas N mensagens da sala
    # Adicionar no prompt para melhor contexto
```

---

## 🧪 Testes rápidos

### 1. Verificar migration
```bash
cd backend
alembic current
alembic history
```

### 2. Testar import dos nuevos modelos
```python
from app.models.classroom_member import ClassroomMember, ClassroomMemberRole
print(ClassroomMemberRole.admin)  # admin
```

### 3. Testar AI mention detector
```python
from app.services.ai_service import detect_ai_mention

has_mention, prompt = detect_ai_mention("@atenaai explica Python")
print(has_mention)  # True
print(prompt)       # "explica Python"
```

---

## 📚 Estrutura final de pastas

```
backend/
  app/
    models/
      ├── user.py                     ✅ ATUALIZADO
      ├── classroom.py                ✅ ATUALIZADO
      ├── classroom_member.py         ✅ NOVO
      ├── group_message.py            (existente)
      └── __init__.py                 ✅ ATUALIZADO
    
    services/
      ├── ai_service.py               ✅ ATUALIZADO (AI detection + IA responses)
      ├── websocket_manager.py        (existente)
      └── ...
    
    routes/
      ├── group_chat.py               ✅ ATUALIZADO (WebSocket + AI)
      ├── classrooms.py               (existente - pode melhorar)
      └── ...
    
    schemas/
      ├── teacher.py                  ✅ ATUALIZADO (member schemas)
      └── ...
  
  alembic/
    versions/
      └── a8d5f7e3c1f9_*.py           ✅ NOVO (migration)

frontend/
  components/
    ├── ChatMessage.tsx               (adaptar para AI)
    └── ...
```

---

## 🎓 Conceitos-chave

### Classroom vs Conversation
| Aspecto | Classroom | Conversation |
|---------|-----------|--------------|
| Tipo | Grupo (N usuários) | 1-1 (User + IA) |
| Mentions | ✅ @atenaai | ❌ Não suporta |
| WebSocket | ✅ Broadcast | ❌ Não usa WS |
| Mensagens | group_messages | messages |
| Histórico | compartilhado | privativo |

### Message Flow
1. Usuário → WebSocket (envia msg com/sem @mention)
2. Servidor recebe → salva em BD
3. Broadcast para todos na sala
4. Se tem @atenaai → AI response em background
5. IA response salva com user_id=0
6. Broadcast apenas para pedir confirmação

---

## 🚨 Erro comum: Not Found

Se receber erro `user_id not found`, é porque:
- User ID 0 não existe no BD
- A IA message será salva mas pode falhar em relacionamento
- Solução: Criar user "virtual" ou aceitar user_id=0 como especial

---

## 📞 Suporte

Comande de debug:
```bash
# Ver todas transações da session
sqlalchemy.echo = True

# Ver logs WebSocket
logging.basicConfig(level=logging.DEBUG)

# Ver OpenAI calls
export OPENAI_LOG="debug"
```

---

Generated: 2026-03-08
Model architecture: Discord + ChatGPT hybrid
Backend: FastAPI + SQLAlchemy + WebSocket
Frontend: React/Next.js (example)
