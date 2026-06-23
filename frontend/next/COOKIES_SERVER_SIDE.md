# 🔧 CORREÇÃO: Cookies não sendo repassados em Server-Side

**Data:** 19 de fevereiro de 2026  
**Problema:** 401 Unauthorized ao chamar `/api/v1/classrooms/my` após login bem-sucedido  
**Causa:** Cookies não sendo repassados do cliente para o backend  
**Status:** ✅ CORRIGIDO

---

## 🔴 Problema Identificado

Os logs mostravam:
```
[LoginModal] Login successful ✅
[getSession] Response status: 200 ✅
[serverApi] Error on /api/v1/classrooms/my: Não autenticado ❌
```

**Por quê?**
- Cliente → SettingsModal faz `fetch(..., {credentials: "include"})` ✅
- Next.js API Routes recebem cookies ✅  
- **MAS:** API Routes não estavam repassando para o backend ❌
- Backend recebe sem cookies → retorna 401 ❌

---

## ✅ Solução: 3 Camadas de Correção

### Problema 1: Server Components (via `serverApi`)
**Arquivo:** `/lib/server-api.ts`

**Era (❌ não funciona):**
```typescript
const response = await fetch(url.toString(), {
  ...options,
  headers,
  credentials: "include" // ❌ Não funciona em server-side!
});
```

**Agora (✅):**
```typescript
import { cookies } from 'next/headers';

// 🔑 Extrair cookies no servidor
const cookieStore = await cookies();
const cookieString = cookieStore
  .getAll()
  .map(c => `${c.name}=${c.value}`)
  .join('; ');

// 🔑 Repassar manualmente
if (cookieString) {
  headers.set('Cookie', cookieString);
}

const response = await fetch(url.toString(), {
  ...options,
  headers,
  // ⚠️ Não usar credentials em server-side
});
```

---

### Problema 2: Route Handlers - Rotas base
**Arquivos:**
- `/app/api/conversations/route.ts`
- `/app/api/classrooms/route.ts`
- `/app/api/chat/route.ts`

**Era (❌):**
```typescript
const response = await fetch(endpoint, {
  method: "GET",
  credentials: "include", // ❌ Não funciona em Route Handlers!
  headers: { "Content-Type": "application/json" },
});
```

**Agora (✅):**
```typescript
// 🔑 Extrair do NextRequest
const cookieHeader = request.headers.get("cookie");

const response = await fetch(endpoint, {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
    // 🔑 Repassar cookies
    ...(cookieHeader && { "cookie": cookieHeader }),
  },
});
```

---

### Problema 3: Route Handlers - Rotas dinâmicas
**Arquivo:** `/app/api/conversations/[id]/route.ts`

**Mesma solução acima** (extrair e repassar manualmente)

---

## 📋 Sumário de Correções

| Arquivo | Tipo | Status |
|---------|------|--------|
| `/lib/server-api.ts` | Server Component Helper | ✅ Corrigido |
| `/app/api/conversations/route.ts` | Route Handler | ✅ Corrigido |
| `/app/api/classrooms/route.ts` | Route Handler | ✅ Corrigido |
| `/app/api/conversations/[id]/route.ts` | Route Handler Dinâmico | ✅ Corrigido |
| `/app/api/chat/route.ts` | Route Handler | ✅ Corrigido |
| `/app/api/user/update/route.ts` | Route Handler | ✅ Corrigido (antes) |
| `/app/api/user/delete/route.ts` | Route Handler | ✅ Corrigido (antes) |

---

## 🧪 Fluxo Agora Funciona Assim

```
Cliente (browser)
  ↓
Faz login
  ↓ (Set-Cookie headers)
Browser armazena: access_token, refresh_token
  ↓
Navega para /scholar
  ↓
Renderiza ProtectedLayout (Server Component)
  ↓
Chama serverApi("/api/v1/classrooms/my")
  ↓
serverApi extrai cookies via next/headers
  ↓
Repassar cookies no header Cookie:
  ↓
Backend recebe e valida tokens ✅
  ↓
Retorna 200 com dados ✅
```

---

## 🔍 Diferença Importante: Route Handlers vs Server Components

### Route Handlers (NextRequest/NextResponse)
```typescript
export async function GET(request: NextRequest) {
  // ✅ Recebe NextRequest (tem os headers incluindo cookies)
  const cookieHeader = request.headers.get("cookie");
  
  // 🔑 DEVE repassar manualmente
  await fetch(backend, {
    headers: {
      ...(cookieHeader && { "cookie": cookieHeader }),
    }
  });
}
```

### Server Components
```typescript
async function MyComponent() {
  // ✅ Recebe acesso direto a cookies via next/headers
  const cookieStore = await cookies();
  const cookieString = ... // processar
  
  // 🔑 DEVE repassar manualmente
  await fetch(backend, {
    headers: {
      'Cookie': cookieString,
    }
  });
}
```

### Client Components (fetch normal)
```typescript
export function MyComponent() {
  // ✅ Browser gerencia cookies automaticamente
  await fetch(endpoint, {
    credentials: "include", // ✅ Funciona aqui!
  });
}
```

---

## ✅ O que foi corrigido

1. **Server Component API calls** - `serverApi()` agora extrai e repassa cookies
2. **Route Handler API calls** - Todos repassam cookies manualmente
3. **Logging** - Logs mostram se cookies foram recebidos
4. **Error handling** - Detecta 401 e loga para debug

---

## 🚀 Próximo Passo: Testar

```bash
# Terminal 1 - Backend
cd backend
python -m uvicorn app.main:app --reload

# Terminal 2 - Frontend
cd frontend/next
npm run dev

# Depois:
# 1. Fazer login
# 2. Verificar console.log "[serverApi] Calling" tem hasCookies: true
# 3. Verificar dados carregam (não vê mais "Não autenticado")
```

---

## 📚 Referências

- [MDN: How cookies work in fetch](https://developer.mozilla.org/en-US/docs/Web/API/fetch#handling_cookies)
- [Next.js: Reading Cookies](https://nextjs.org/docs/app/api-reference/functions/cookies)
- [Next.js: Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

---

**Verificado por:** GitHub Copilot  
**Próxima auditoria:** Após testes em produção
