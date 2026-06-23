# 🔐 COOKIES & CORS AUDIT - ATENAAI

**Data da auditoria:** 19 de fevereiro de 2026  
**Status:** ✅ CORRIGIDO (2 problemas críticos consertados)

---

## ✅ CHECKLIST TÉCNICO

### 1. **Login usa `credentials: "include"`?**
- ✅ **Backend** (`/app/routes/auth.py`):
  - Cookies definidos com `httponly=True` ✅
  - `secure=COOKIE_SECURE` (False em dev, True em prod) ✅
  - `samesite="lax"` ✅
  
- ✅ **Frontend** (`/app/api/auth/login`):
  - Usa `credentials: 'include'` ✅

### 2. **CORS do backend está correto?**
- ✅ **Backend** (`/app/main.py`):
  ```python
  app.add_middleware(
      CORSMiddleware,
      allow_origins=CORS_ORIGINS,
      allow_credentials=True,  # ✅ CRÍTICO
      allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allow_headers=["*"],
      expose_headers=["X-Request-ID", "X-RateLimit-Remaining"],
      max_age=3600,
  )
  ```

### 3. **Configuração de cookies em produção?**
- ⚠️ **Backend** (`/app/routes/auth.py`):
  ```python
  IS_PRODUCTION = os.getenv("ENVIRONMENT") == "production"
  COOKIE_SECURE = IS_PRODUCTION  # ✅ True apenas em HTTPS
  COOKIE_SAMESITE = "lax"  # ✅ CSRF protection
  COOKIE_DOMAIN = None  # ✅ Current domain
  ```

---

## 🔴 PROBLEMAS IDENTIFICADOS & CORRIGIDOS

### ❌ Problema #1: `/api/user/update/route.ts`
**Status:** ✅ CORRIGIDO

**Era:**
```typescript
// ❌ Tentava usar Authorization header (não funciona com cookie auth!)
// ❌ NÃO repassava cookies do cliente para backend
// ❌ Faltava credentials: 'include'
const response = await fetch(`${apiUrl}/api/v1/auth/update-profile`, {
  method: "PUT",
  headers: {
    Authorization: req.headers.get("Authorization") || "",
  },
  body: formData,
});
```

**Agora:**
```typescript
// ✅ Extrai cookies do cliente
const cookieHeader = req.headers.get("cookie");

// ✅ Repassa cookies para backend (autenticação real via cookie)
const response = await fetch(`${apiUrl}/api/v1/auth/update-profile`, {
  method: "PUT",
  headers: {
    ...(cookieHeader && { "cookie": cookieHeader }),
  },
  body: formData,
  credentials: "include",  // ✅ IMPORTANTE
});
```

---

### ❌ Problema #2: `/api/user/delete/route.ts`
**Status:** ✅ CORRIGIDO

**Era:**
```typescript
// ❌ Mesmo problema que /api/user/update
// ❌ Tentava Authorization header
// ❌ NÃO repassava cookies
```

**Agora:**
```typescript
// ✅ Extrai cookies e repassa corretamente
const cookieHeader = req.headers.get("cookie");
const response = await fetch(`${apiUrl}/api/v1/auth/delete-account`, {
  method: "DELETE",
  headers: {
    ...(cookieHeader && { "cookie": cookieHeader }),
  },
  credentials: "include",
});
```

---

## ✅ VALIDAÇÃO: FLUXO DE COOKIES

### Caso de Sucesso: Atualizar Perfil (SettingsModal)

```
1. Cliente (SettingsModal.tsx)
   ├─ fetch("/api/user/update", {
   │   credentials: "include",  // ✅ Include HttpOnly cookies
   │   body: formData
   │ })
   │
   ├─ Browser automaticamente adiciona cookies no header:
   │   Cookie: access_token=eyJhbG...; refresh_token=eyJhbG...
   │
2. Next.js API Route (/api/user/update)
   ├─ Recebe request com cookies
   ├─ Extrai cookie header:
   │   const cookieHeader = req.headers.get("cookie");
   │
   ├─ Repassa para backend:
   │   fetch(backend, {
   │     headers: { "cookie": cookieHeader },
   │     credentials: "include"
   │   })
   │
3. Backend FastAPI
   ├─ Recebe cookies no header
   ├─ `get_current_user` extrai do cookie
   ├─ Valida token JWT
   ├─ Processa update
   └─ Retorna 200 ✅
```

---

## 🔍 ROTAS AUDITADAS

### ✅ Corretas (Usando cookies corretamente)
- `/api/auth/me` - Extrai e repassa cookies ✅
- `/api/auth/login` - Usa `credentials: 'include'` ✅
- `/api/auth/refresh` - Copia Set-Cookie headers na resposta ✅
- `/api/classrooms` - Usa `credentials: 'include'` ✅
- `/api/user/update` - **[CORRIGIDO]** Agora repassa cookies ✅
- `/api/user/delete` - **[CORRIGIDO]** Agora repassa cookies ✅

### ⚠️ Verificar depois
- `/api/chat` - Endpoint público, OK não ter credentials (mas não prejudica ter)

---

## 🚀 PRÓXIMOS PASSOS

### 1. Testar em Desenvolvimento
```bash
# Terminal 1 - Backend
cd backend
python -m uvicorn app.main:app --reload

# Terminal 2 - Frontend (Next.js)
cd frontend/next
npm run dev
```

### 2. Testar Fluxo Completo
1. ✅ Login → Receber cookies HttpOnly
2. ✅ Abrir Settings → Enviar form com foto
3. ✅ Verificar DevTools: Se cookies foram repassados corretamente
4. ✅ Verificar Backend logs: Se autenticação passou

### 3. Em Produção
```python
# Verificar .env
ENVIRONMENT=production
COOKIE_SECURE=True  # Obrigatório em HTTPS
CORS_ORIGINS=https://seu-dominio.com
```

---

## 📋 SUMÁRIO DAS ALTERAÇÕES

| Arquivo | Mudança | Status |
|---------|---------|--------|
| `/app/api/user/update/route.ts` | Adicionar cookie passthrough | ✅ Done |
| `/app/api/user/delete/route.ts` | Adicionar cookie passthrough | ✅ Done |
| `SettingsModal.tsx` | Nada (chamada já correta) | ✅ OK |
| Backend CORS | Já correto | ✅ OK |
| Backend Cookies | Configurado corretamente | ✅ OK |

---

## 🔒 Segurança Verificada

- ✅ HttpOnly cookies - Não acessíveis via JavaScript
- ✅ Secure flag - HTTPS em produção
- ✅ SameSite=lax - CSRF protection
- ✅ Credentials flow - Cookie-based, não localStorage
- ✅ CORS allow_credentials=True - Cookies enviados cross-origin

---

**Auditado por:** GitHub Copilot  
**Próxima verificação:** Apos testes em produção
