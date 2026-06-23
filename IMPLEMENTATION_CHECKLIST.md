# 🚀 IMPLEMENTATION CHECKLIST

## ✅ CONCLUÍDO

### Backend - Models
- [x] Criar `ClassroomMember` model com roles (admin, moderator, teacher, student)
- [x] Atualizar `Classroom` model com relacionamento members
- [x] Atualizar `User` model com classroom_memberships relationship
- [x] Registrar modelos em `__init__.py`

### Backend - Services
- [x] Adicionar `AIMentionDetector` a `ai_service.py`
- [x] Criar `detect_ai_mention()` função (case-insensitive @atenaai)
- [x] Criar `generate_classroom_ai_response()` para broadcast
- [x] Criar `get_ai_user_representation()` para AI messages

### Backend - Routes  
- [x] Atualizar WebSocket em `group_chat.py`
- [x] Detectar @mentions no message loop
- [x] Adicionar `_handle_ai_response()` background task
- [x] Broadcast AI responses para a room

### Backend - New Endpoints
- [x] `GET /classrooms/{id}/members` - Listar membros com roles
- [x] `POST /classrooms/{id}/members` - Adicionar membro com role
- [x] `PUT /classrooms/{id}/members/{mid}/role` - Mudar role
- [x] `DELETE /classrooms/{id}/members/{mid}` - Remover membro

### Backend - Schemas
- [x] Criar `ClassroomMemberCreate` schema
- [x] Criar `ClassroomMemberResponse` schema
- [x] Criar `ClassroomMemberUpdate` schema
- [x] Criar `ClassroomWithMembersResponse` schema

### Backend - Database
- [x] Criar migration Alembic (a8d5f7e3c1f9)
- [x] Adicionar `classroom_members` table
- [x] Adicionar timestamps a `classrooms`

---

## 📋 PRÓXIMAS AÇÕES

### 1️⃣ TESTAR TUDO

```bash
# Terminal 1: Backend
cd backend
alembic upgrade head           # Rodar migrations
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

# Terminal 2: Frontend (se tiver live server)
cd frontend
py -m http.server 5500

# Terminal 3: Testar com curl/Postman
```

### 2️⃣ TESTES UNITÁRIOS

```python
# test_ai_mention.py
from app.services.ai_service import detect_ai_mention

def test_detect_ai_mention():
    assert detect_ai_mention("@atenaai explica MRU") == (True, "explica MRU")
    assert detect_ai_mention("@AtenaAI") == (True, "@AtenaAI")
    assert detect_ai_mention("olá pessoal") == (False, None)
    
test_detect_ai_mention()
```

### 3️⃣ VERIFICAR INTEGRAÇÕES

- [ ] OpenAI API key está configurada?
  ```bash
  echo $OPENAI_API_KEY
  ```

- [ ] WebSocket está rodando?
  ```bash
  # Testar com wscat
  npm install -g wscat
  wscat -c "ws://localhost:8000/group-chat/ws/1?token=YOUR_TOKEN"
  ```

- [ ] Migrations rodaram?
  ```bash
  cd backend
  alembic current  # Debe mostrar: a8d5f7e3c1f9
  ```

### 4️⃣ FRONTEND - Adaptar para AI Messages

```typescript
// components/ChatMessage.tsx
import { Message } from '@/lib/types/entities';

export const ChatMessage: React.FC<{ message: Message }> = ({ message }) => {
  // ✅ NOVO: Checar se é mensagem da IA
  if (message.is_ai || message.user_id === 0) {
    return (
      <div className="ai-message bg-blue-100 rounded p-3">
        <strong>AtenaAI:</strong> {message.content}
      </div>
    );
  }

  return (
    <div className="user-message bg-gray-100 rounded p-3">
      <strong>{message.user_name}:</strong> {message.content}
    </div>
  );
};
```

### 5️⃣ DOCUMENTAÇÃO DO FRONTEND

Adicionar tipos TypeScript:

```typescript
// lib/types/entities.ts
export interface GroupMessage {
  id: number;
  content: string;
  user_id: number;
  user_name: string;
  user_role: string;
  timestamp: string;
  is_teacher?: boolean;
  is_ai?: boolean;  // ✅ NOVO
}

export interface AIResponse extends GroupMessage {
  is_ai: true;
}
```

---

## 🔧 CONFIGURAÇÃO MÍNIMA

### .env Backend
```
OPENAI_API_KEY=sk-...
AI_MODEL=gpt-4o-mini
DATABASE_URL=sqlite:///database.db
SECRET_KEY=seu-secret-key-muito-seguro
```

### .env Frontend
```
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

---

## 📚 ESTRUTURA DE PASTAS FINAL

```
backend/
├── app/
│   ├── models/
│   │   ├── classroom_member.py          ✅ NOVO
│   │   ├── classroom.py                 ✅ ATUALIZADO
│   │   ├── user.py                      ✅ ATUALIZADO
│   │   └── __init__.py                  ✅ ATUALIZADO
│   ├── services/
│   │   ├── ai_service.py                ✅ ATUALIZADO
│   │   └── websocket_manager.py         ✅ (existente)
│   ├── routes/
│   │   ├── group_chat.py                ✅ ATUALIZADO
│   │   ├── classrooms.py                ✅ ATUALIZADO
│   │   └── ...
│   ├── schemas/
│   │   ├── teacher.py                   ✅ ATUALIZADO
│   │   └── ...
│   └── main.py
├── alembic/
│   └── versions/
│       └── a8d5f7e3c1f9_*.py            ✅ NOVO
└── requirements.txt

frontend/
├── components/
│   └── ChatMessage.tsx                  ⏳ PRECISA ADAPTAR
├── lib/
│   └── types/
│       └── entities.ts                  ⏳ PRECISA ADICIONAR is_ai
└── ...
```

---

## 🎯 FLUXO COMPLETO PASSO A PASSO

### 1. User A entra na sala
```
WebSocket: /group-chat/ws/1?token=TOKEN_A
↓
Servidor detecta conexão
↓
Manager adiciona socket à lista
↓
Broadcast: "User A entered the room"
```

### 2. User A envia mensagem normal
```
{"content": "Olá pessoal!"}
↓
Salva em group_messages (user_id = A)
↓
Broadcast para todos: {type: "message", user_id: A, content: "Olá pessoal!"}
```

### 3. User B menciona AI
```
{"content": "@atenaai explica MRUV"}
↓
Detector: has_mention = True, prompt = "explica MRUV"
↓
Salva user message em group_messages
↓
Background task:
  - Chama OpenAI("explica MRUV", user_context)
  - Recebe resposta
  - Salva em group_messages (user_id = 0, is_ai = True)
  - Broadcast para todos: {type: "message", user_id: 0, user_name: "AtenaAI", content: "MRUV é..."}
```

### 4. Frontend renderiza ambas
```
User B: "@atenaai explica MRUV"
AtenaAI: "MRUV é movimento retilíneo uniforme..."
```

---

## 🐛 TROUBLESHOOTING

| Problema | Solução |
|----------|---------|
| `ModuleNotFoundError: ClassroomMember` | Verifique imports em `__init__.py` |
| `@atenaai não é detectado` | Confirme regex case-insensitive em ai_service.py |
| `WebSocket desconecta` | Verifique token JWT - pode estar expirado |
| `IA não responde` | Verifique OPENAI_API_KEY no .env |
| `Migração falha` | Rode `alembic current` e verifique download_revision_id |
| `user_id=0 causa erro FK` | Isso é normal - IA é um "user virtual" |

---

## ✨ PRÓXIMAS FEATURES (não implementadas)

- [ ] Rate limiting para @mentions (evitar spam)
- [ ] Context window - enviar últimas N msgs para IA
- [ ] Persistência de AI responses em histórico
- [ ] Moderação de responses (admin aprova antes de enviar)
- [ ] Customização de prompt da IA por classroom
- [ ] Analytics: "AI foi mencionado X vezes"
- [ ] Fallback se OpenAI fail (resposta genérica)

---

## 📞 DEBUG RÁPIDO

```python
# Testar mention detector
python
>>> from app.services.ai_service import detect_ai_mention
>>> detect_ai_mention("@atenaai qual é a capital?")
(True, 'qual é a capital?')

# Testar modelo
>>> from app.models.classroom_member import ClassroomMember, ClassroomMemberRole
>>> print(ClassroomMemberRole.moderator.value)
'moderator'

# Ver conexões WebSocket ativas
>>> from app.services.websocket_manager import manager
>>> manager.active_connections
{1: [(websocket, 5, 'João'), (websocket, 7, 'Maria')]}
```

---

Generated: 2026-03-08
Status: READY FOR TESTING ✅
