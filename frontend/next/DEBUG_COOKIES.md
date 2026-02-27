# 🐛 Debug Cookies - Checklist para Troubleshooting

Se os cookies ainda não estão funcionando, siga este checklist:

## 1. 🔍 Verificar no DevTools do Browser

### Storage Tab
- Abrir DevTools → Application → Storage → Cookies
- Verificar se existem cookies após login:
  - `access_token` - ❌ **Não deve aparecer aqui** (HttpOnly!)
  - `refresh_token` - ❌ **Não deve aparecer aqui** (HttpOnly!)
  - `role` - ✅ Deve aparecer (non-HttpOnly)
  - `user_id` - ✅ Deve aparecer (non-HttpOnly)

**Se não aparecer nada:**
- ❌ Login não funcionou
- ❌ Backend não está definindo cookies

### Network Tab
- Ir para login
- Procurar por `POST /api/auth/login`
- Ver Response Headers → procurar por `Set-Cookie`

**Exemplo (deve parecer assim):**
```
Set-Cookie: access_token=eyJhbG...; Path=/; HttpOnly; Secure; SameSite=Lax
Set-Cookie: refresh_token=eyJhbG...; Path=/; HttpOnly; Secure; SameSite=Lax
```

- Procurar por `PUT /api/user/update`
- Ver Request Headers → procurar por `Cookie:`
```
Cookie: access_token=eyJhbG...; refresh_token=eyJhbG...
```

---

## 2. 📊 Verificar Backend Logs

```bash
# Terminal Backend
cd backend
python -m uvicorn app.main:app --reload

# Procurar por logs de [UPDATE-PROFILE] ou [AUTH]
```

**Logs esperados:**
```
[UPDATE-PROFILE] Iniciando atualização para usuário ID=1
[UPDATE-PROFILE] Atualizando full_name: ...
[UPDATE-PROFILE] Perfil atualizado com sucesso!
```

**Se vir erro:**
```
[UPDATE-PROFILE] ❌ 401 Unauthorized
```
→ Significa que o cookie não foi repassado do Next.js para o backend!

---

## 3. 🔧 Verificar configuração do `.env`

```bash
# backend/.env
ENVIRONMENT=development
CORS_ORIGINS=http://127.0.0.1:3000,http://localhost:3000
```

```bash
# frontend/next/.env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
API_BASE_URL=http://localhost:8000
BACKEND_URL=http://localhost:8000
```

---

## 4. 🧪 Teste Manual com cURL

### Passo 1: Login
```bash
curl -i -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=seu-email@email.com&password=senha" \
  -c cookies.txt
```

Deve salvar cookies em `cookies.txt`

### Passo 2: Usar cookies no próximo request
```bash
curl -X PUT http://localhost:8000/api/v1/auth/update-profile \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"full_name":"Novo Nome"}'
```

Se retornar 200 com dados atualizados → backend está certo ✅

---

## 5. ❓ Se a rota Next.js está reppassando cookies

Adicionar console.log em `/app/api/user/update/route.ts`:

```typescript
export async function PUT(req: NextRequest) {
  const cookieHeader = req.headers.get("cookie");
  console.log("[/api/user/update] Cookie received:", !!cookieHeader);
  console.log("[/api/user/update] Cookie value:", cookieHeader); // REMOVER DEPOIS!
  
  // ... rest of code
}
```

Depois quer nos logs do Next:
```
[/api/user/update] Cookie received: true
[/api/user/update] Cookie value: access_token=eyJhbG...; refresh_token=eyJ...
```

Se mostrar `false` ou `undefined` → cookies não estão chegando do browser!

---

## 6. ✅ Checklist Final

- [ ] Backend logs mostram `[UPDATE-PROFILE] Usuário ID=1...`
- [ ] Next.js logs mostram `Cookie received: true`
- [ ] Network tab mostra `Set-Cookie` headers no login
- [ ] Network tab mostra `Cookie:` headers nas requisições
- [ ] DevTools Storage mostra cookies não-HttpOnly
- [ ] `.env` tem URLs corretas
- [ ] `credentials: 'include'` em todas as rotas fetch
- [ ] Cookie header sendo repassado (check em route handler)

---

## 🚨 Erros Comuns

### Erro 1: "401 Unauthorized"
**Causa:** Cookies não chegaram no backend
**Solução:** 
1. Verificar `/api/user/update/route.ts` tem `cookieHeader` extraction
2. Verificar tem `credentials: 'include'` no fetch

### Erro 2: "Email ou senha incorretos" no login
**Causa:** Usuário ou senha errados
**Solução:** Testar credenciais na API direto via cURL

### Erro 3: Cookies aparecem-se no browser devTools
**Causa:** Backend não está enviando Set-Cookie
**Solução:** Verificar se a resposta do login tem `Set-Cookie` headers

### Erro 4: Cookies desaparecem após refresh da página
**Causa:** SameSite=Strict ou Secure sem HTTPS
**Solução:** 
- Mudar SameSite para "lax" ✅ (já feito)
- Verificar se está em localhost (não precisa HTTPS)

---

## 💾 Como Resetar Tudo

Se nada funcionar, fazer reset completo:

```bash
# 1. Limpar browser cookies
# DevTools → Application → Storage → Cookies → Clear All

# 2. Verificar banco de dados
# backend/app/database/database.py: deletar database.db

# 3. Recriar banco
# cd backend
# python (enter)
# >>> from app.database.database import Base, engine
# >>> Base.metadata.create_all(bind=engine)

# 4. Fazer login novamente
```

---

## 📚 Referências

- [MDN: Set-Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie)
- [MDN: HttpOnly](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie#httponly)
- [FastAPI: Security with OAuth2](https://fastapi.tiangolo.com/tutorial/security/simple-oauth2/)
- [OWASP: XSS Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
