# 🔧 Troubleshooting & FAQ

## ❌ Problema: "Cannot use async/await in Client Component"

**Causa:** Tentando usar `await` em um Client Component

```typescript
// ❌ ERRADO
'use client';

export default function Page() {
  const session = await getSession(); // ❌ Erro!
}

// ✅ CORRETO
export default async function Page() {
  const session = await getSession(); // ✅ Server Component
}
```

---

## ❌ Problema: "useEffect para Carregar Sessão"

**Causa:** Padrão React antigo que não funciona bem em Next.js 16

```typescript
// ❌ ERRADO - Cria delay e pode mostrar UI não autenticada
'use client';
useEffect(() => {
  fetch('/api/session').then(setSession);
}, []);

// ✅ CORRETO - Renderiza seguro no servidor
export default async function Page() {
  const session = await getSession();
}
```

**Benefício:** Sem flash de tela, segurança garantida, sem javascript desnecessário

---

## ❌ Problema: "Cookie não está sendo definido"

**Verificar:**

1. **HttpOnly deve estar `true`**
   ```typescript
   // ✅ CORRETO
   cookieStore.set('session', value, {
     httpOnly: true, // Deve ser true
     secure: true,   // true em produção
   });
   ```

2. **SameSite Policy**
   ```typescript
   // Recomendado para produção
   sameSite: 'lax', // ou 'strict'
   ```

3. **Domínio correto**
   Se está no localhost, não usar domínio específico:
   ```typescript
   // ✅ CORRETO (sem domain no localhost)
   cookieStore.set('session', value, { path: '/' });
   
   // ✅ Em produção
   cookieStore.set('session', value, {
     domain: '.seu-dominio.com',
     path: '/',
   });
   ```

---

## ❌ Problema: "Redirect não funciona"

**Causa:** Usando `redirect()` fora de um Server Component

```typescript
// ❌ ERRADO
'use client';
export default function Page() {
  if (!user) {
    redirect('/login'); // ❌ Não funciona
  }
}

// ✅ CORRETO
export default async function Page() {
  const session = await getSession();
  
  if (!session) {
    redirect('/login'); // ✅ Funciona
  }
}
```

---

## ❌ Problema: "Middleware não intercepta a rota"

**Verificar:**

1. **Caminho correto no `matcher`**
   ```typescript
   // middleware.ts
   export const config = {
     matcher: [
       '/((?!api|_next/static|_next/image|favicon.ico).*)',
     ],
   };
   ```

2. **Middleware no lugar correto**
   - Deve estar em `middleware.ts` na raiz de `app/`
   - Não em subpasta

3. **Restart do servidor**
   ```bash
   npm run dev
   # Reiniciar é necessário para mudanças em middleware.ts
   ```

---

## ❌ Problema: "TypeError: Cannot read property 'getSetCookie' of undefined"

**Causa:** Tentando chamar `response.headers.getSetCookie()` quando não há resposta

```typescript
// ✅ CORRETO - Sempre verificar
if (backendResponse?.ok) {
  const setCookieHeaders = backendResponse.headers.getSetCookie();
  // ...
}
```

---

## ❌ Problema: "Página branca ao fazer login"

**Debug:**

```typescript
// 1. Verificar se a sessão está sendo definida
console.log('Setting session for:', mockUser.id);

// 2. Verificar se o cookie está sendo salvo
const cookieStore = await cookies();
console.log('Cookie contents:', cookieStore.get('atena_session'));

// 3. Verificar redireção
console.log('Redirecting to:', dashboardMap[data.user.role]);
```

---

## ❓ FAQ

### P: Como adicionar 2FA (Two-Factor Authentication)?

**R:** Após login com sucesso, redirecione para `/verify-2fa`:

```typescript
// app/api/auth/login/route.ts
const response = NextResponse.json({ needs2FA: true, tempToken });
return response; // Não definir sessão completa ainda

// Depois que 2FA é validado
await setSessionCookie(user); // Agora sim
```

---

### P: Como lidar com sessão expirada na navegação?

**R:** O middleware verifica automaticamente:

```typescript
// middleware.ts já valida expiração
if (sessionData.expiresAt < Date.now()) {
  cookieStore.delete(SESSION_COOKIE);
  return NextResponse.redirect(new URL('/login', request.url));
}
```

Se quer sair elegantemente no cliente:

```typescript
// components/layout/Header.tsx
if (response.status === 401) {
  toast.error('Sua sessão expirou');
  router.push('/login');
}
```

---

### P: Como fazer requisição ao backend com autenticação?

**R:** Use o `apiClient`:

```typescript
import { apiClient } from '@/lib/api/client';

// Automaticamente inclui cookies
const data = await apiClient.get('/api/v1/user');

// POST com dados
const result = await apiClient.post('/api/v1/classrooms', {
  name: 'Turma A',
});
```

---

### P: Como testar rotas protegidas?

**R:** Use ferramentas:

```bash
# 1. Fazer login para pegar cookie
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}' \
  -c cookies.txt

# 2. Usar cookie em requisição protegida
curl http://localhost:3000/api/user \
  -b cookies.txt
```

---

### P: Como criar um role novo (ex: 'moderator')?

**R:**

1. Adicionar no type
   ```typescript
   // lib/types/auth.ts
   export type Role = 'scholar' | 'teacher' | 'admin' | 'moderator';
   ```

2. Adicionar rotas no middleware
   ```typescript
   // middleware.ts
   const PROTECTED_ROUTES: Record<Role, RegExp[]> = {
     moderator: [/^\/moderator($|\/)/],
     // ...
   };
   ```

3. Criar dashboard
   ```typescript
   // app/(protected)/moderator/page.tsx
   export default async function ModeratorPage() {
     const session = await requireRole('moderator');
   }
   ```

---

### P: Como integrar com Auth.js (NextAuth)?

**R:** Não é necessário com esta arquitetura. Mas se quiser:

```typescript
import NextAuth from "next-auth";

export const { handlers, auth } = NextAuth({
  providers: [/* ... */],
  callbacks: {
    async jwt({ token }) {
      // Salvaria no cookie HttpOnly via middleware
      return token;
    },
  },
});
```

Mas recomenda-se manter simples com cookies HttpOnly + sessão.

---

### P: Como debugar erro no middleware?

**R:** Adicione logs:

```typescript
// middleware.ts
console.log('[MIDDLEWARE]', {
  pathname,
  hasSession: !!sessionCookie?.value,
  role: user?.role,
  accessAllowed: hasAccess,
});
```

Verifique em:
- Terminal do npm run dev
- Network tab do DevTools (se não for erro de req do servidor)

---

### P: Como renovar sessão (refresh token)?

**R:** Implemente em uma rota:

```typescript
// app/api/auth/refresh/route.ts
export async function POST(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Renovar sessão (extend expiração)
  await setSessionCookie(session as AuthUser);

  return NextResponse.json({ success: true });
}

// No client, chamar periodicamente
useEffect(() => {
  const interval = setInterval(() => {
    fetch('/api/auth/refresh', { method: 'POST' });
  }, 1000 * 60 * 10); // A cada 10 min

  return () => clearInterval(interval);
}, []);
```

---

## 📊 Checklist de Debugging

- [ ] Middleware foi reiniciado após mudanças?
- [ ] Cookie está com HttpOnly = true?
- [ ] Session TTL não expirou?
- [ ] Role está correto no banco?
- [ ] `redirect()` é em Server Component?
- [ ] `await cookies()` está em Server Component?
- [ ] Variáveis de env carregadas?
- [ ] Projeto foi buildado com `npm run build`?

---

**Mais dúvidas? Abra issue ou verifique ARCHITECTURE.md**
