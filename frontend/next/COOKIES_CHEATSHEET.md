# ⚡ COOKIES CHEAT SHEET - Referência Rápida

## 🟢 CORRETO ✅

```typescript
// ✅ Cliente (fetch com cookies)
fetch("/api/user/update", {
  credentials: "include",  // Inclui HttpOnly cookies
  body: formData,
});

// ✅ API Route (repassar cookies)
const cookieHeader = req.headers.get("cookie");
const response = await fetch(backend, {
  headers: {
    ...(cookieHeader && { "cookie": cookieHeader }),
  },
  credentials: "include",
  body: data,
});

// ✅ Backend (definir cookies)
response.set_cookie(
  key="access_token",
  value=token,
  httponly=True,      // 🔒 Não acessível via JS
  secure=True,        // 🔒 HTTPS only em produção
  samesite="lax",     // 🔒 CSRF protection
);

// ✅ Backend (usar cookies)
@router.put("/update-profile")
def update_profile(
  current_user: User = Depends(get_current_user),  # Extrai do cookie
  db: Session = Depends(get_db)
):
  ...
```

---

## 🔴 ERRADO ❌

```typescript
// ❌ Cliente sem credentials
fetch("/api/user/update", {
  body: formData,  // Cookies NÃO serão inclusos!
});

// ❌ API Route não repassando cookies
const response = await fetch(backend, {
  headers: {
    Authorization: req.headers.get("Authorization"),  // ❌ Cookies ignorados!
  },
  body: data,
});

// ❌ Backend sem httponly
response.set_cookie(
  key="access_token",
  value=token,
  httponly=False,  // ❌ Vulnerável ao XSS!
  secure=False,    // ❌ Pode ser roubado em rede insegura!
);

// ❌ Backend esperando Authorization header
@router.put("/update-profile")
def update_profile(
  token_str: str = Header(...),  # ❌ Sem este header = falha!
):
  ...
```

---

## 📋 Checklist: Antes de Deployar

### Cliente
- [ ] Todos os `fetch()` têm `credentials: "include"`?
- [ ] Não há `Authorization` header manual no cliente?
- [ ] SettingsModal faz fetch para `/api/user/update` (Next.js route)?

### API Routes (Next.js)
- [ ] Extrai cookie com `req.headers.get("cookie")`?
- [ ] Repassa com `headers: { "cookie": cookieHeader }`?
- [ ] Usa `credentials: "include"` no fetch para backend?

### Backend (FastAPI)
- [ ] CORS tem `allow_credentials=True`?
- [ ] Cookies têm `httponly=True`?
- [ ] `secure=COOKIE_SECURE` (True em prod)?
- [ ] `samesite="lax"` para CSRF?
- [ ] `@Depends(get_current_user)` extrai do cookie?

### .env
```python
# backend/.env
ENVIRONMENT=production
CORS_ORIGINS=https://seu-dominio.com

# frontend/next/.env.local
NEXT_PUBLIC_API_BASE_URL=https://seu-backend.com
```

---

## 🔍 Debug Rápido: 3 Comandos

```bash
# 1. Verificar cookies no backend
curl -i http://localhost:8000/api/v1/auth/me

# 2. Login e salvar cookies
curl -c cookies.txt -X POST http://localhost:8000/api/v1/auth/login \
  -d "username=test@email.com&password=senha"

# 3. Usar cookies no próximo request
curl -b cookies.txt http://localhost:8000/api/v1/auth/me
```

---

## 📊 Fluxo: Update Perfil

```
SettingsModal
  ↓
  fetch("/api/user/update", {credentials: "include"})
  ↓
  Browser adiciona automaticamente: [Cookie: access_token=..., refresh_token=...]
  ↓
  /app/api/user/update (Next.js)
  ↓
  Extrai: cookieHeader = "access_token=..., refresh_token=..."
  ↓
  Fetch backend com: headers: {cookie: cookieHeader}
  ↓
  Backend recebe cookie
  ↓
  get_current_user() extrai token do cookie
  ↓
  JWT validation OK ✅
  ↓
  Update no DB
  ↓
  Retorna user + [Set-Cookie: access_token=..., refresh_token=...]
  ↓
  API Route copia Set-Cookie headers
  ↓
  Browser recebe novos cookies
  ↓
  SettingsModal mostra ✅ "Perfil atualizado"
```

---

## 🔐 Segurança Garantida?

- ✅ Tokens com `httponly=True` → não pode ser roubado por XSS
- ✅ `secure=True` em HTTPS → não pode ser roubado em rede insegura
- ✅ `samesite="lax"` → protegido contra CSRF attacks
- ✅ Cookies enviados via `credentials: "include"` → cross-site OK
- ✅ Backend valida JWT → token expirado = 401

---

## ⚠️ Casos Especiais

### 1. Cross-Origin (diferente domínio)
```typescript
// ✅ Funciona com CORS allow_credentials=True
fetch("https://api.outro-dominio.com/api/v1/...", {
  credentials: "include",  // Inclui cookies do outro domínio
});
```

### 2. Subdominios
```python
# backend/.env
CORS_ORIGINS=https://app.seu-dominio.com
COOKIE_DOMAIN=.seu-dominio.com  # Ponto no início = subdominios
```

### 3. Refresh Token Rotation
```bash
# A cada refresh, backend gera NOVO refresh_token
POST /api/v1/auth/refresh
# Set-Cookie: refresh_token=NOVO_TOKEN  (rotação)
# Set-Cookie: access_token=NOVO_TOKEN
```

---

## 📞 Quick Fixes

| Problema | Solução |
|----------|---------|
| 401 Unauthorized | Verificar `credentials: "include"` em fetch |
| Cookies desaparecem | Verificar `secure=False` em dev, `secure=True` em prod |
| "Not authenticated" | Verificar se backend extrai cookie (Depends(get_current_user)) |
| CORS error | Verificar `allow_credentials=True` no backend |
| Cookies em localStorage | Usar `httponly=True` para forçar behavior correto |

---

**Arquivos modificados:**
- ✅ `/app/api/user/update/route.ts` - Adiciona cookie passthrough
- ✅ `/app/api/user/delete/route.ts` - Adiciona cookie passthrough

**Para reverter (git):**
```bash
git diff frontend/next/app/api/user/
git checkout frontend/next/app/api/user/update/route.ts
```
