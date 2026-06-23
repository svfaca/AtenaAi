# 🎯 Arquitetura Next.js 16 - Padrões SaaS Profissional

## 📋 Índice

1. [Estrutura de Pastas](#estrutura-de-pastas)
2. [Padrões de Autenticação](#padrões-de-autenticação)
3. [Organização de Rotas](#organização-de-rotas)
4. [Componentes Reutilizáveis](#componentes-reutilizáveis)
5. [Tipos TypeScript](#tipos-typescript)
6. [Server vs Client Components](#server-vs-client-components)
7. [Boas Práticas](#boas-práticas)

---

## 📁 Estrutura de Pastas

```
app/
├── layout.tsx                 # Root layout global
├── page.tsx                   # Landing page (pública)
├── (public)/                  # Grupo de rotas públicas
│   ├── layout.tsx            # Layout para públicas
│   ├── login/page.tsx
│   └── signup/page.tsx
├── (protected)/              # Grupo de rotas protegidas
│   ├── layout.tsx            # Valida auth + renderiza sidebar
│   ├── scholar/              # Dashboard estudante
│   │   ├── page.tsx
│   │   ├── classes/[id]/page.tsx
│   │   └── chat/[id]/page.tsx
│   ├── teacher/              # Dashboard professor
│   │   ├── page.tsx
│   │   └── analytics/page.tsx
│   └── admin/                # Dashboard admin
│       └── page.tsx
└── api/
    └── auth/
        ├── login/route.ts
        ├── logout/route.ts
        └── signup/route.ts

lib/
├── auth/
│   └── session.ts           # ✅ Server-only: getSession(), requireAuth()
├── types/
│   ├── auth.ts              # Tipos de autenticação
│   ├── entities.ts          # Modelos de dados
│   └── api.ts               # Tipos de API
├── api/
│   └── client.ts            # Cliente HTTP tipado
└── utils/
    ├── cn.ts                # classNames helper
    └── cookies.ts           # Manipulação de cookies

components/
├── layout/
│   ├── Header.tsx           # Client Component
│   └── Sidebar.tsx          # Client Component
├── ui/
│   ├── Button.tsx           # Component reutilizável
│   ├── Input.tsx
│   └── Card.tsx
└── auth/
    ├── LoginForm.tsx
    └── SignupForm.tsx

middleware.ts               # Validação de rotas por role
```

---

## 🔐 Padrões de Autenticação

### ✅ **getSession() - Server Component Only**

```typescript
// ✅ CORRETO - Em Server Component
export default async function Page() {
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }

  return <div>Bem-vindo, {session.name}</div>;
}

// ❌ ERRADO - useEffect em Client Component
export default function Page() {
  const [session, setSession] = useState(null);
  useEffect(() => {
    fetch('/api/session'); // ❌ EVITAR!
  }, []);
}
```

### ✅ **requireAuth() - Validação Obrigatória**

```typescript
// Força autenticação ou lança erro
export default async function ProtectedPage() {
  const session = await requireAuth();
  // Se não autenticado, erro será tratado por error.tsx
}
```

### ✅ **requireRole() - Validação por Papel**

```typescript
// Permite múltiplos roles
export default async function TeacherPage() {
  const session = await requireRole(['teacher', 'admin']);
  // Só renderiza se for professor ou admin
}
```

---

## 🛣️ Organização de Rotas

### Padrão: Route Groups com Layouts

**Public Routes**
```
(public)/          # Sem autenticação
├── login/page.tsx
├── signup/page.tsx
└── layout.tsx     # Layout público simples
```

**Protected Routes**
```
(protected)/       # Com verificação de auth no layout
├── layout.tsx     # ← Checa session + renderiza Sidebar
├── scholar/page.tsx
└── teacher/page.tsx
```

### 🚨 Middleware: Segurança em Tempo Real

O `middleware.ts` intercepta TODAS as requisições:

1. ✅ Valida cookies de sessão
2. ✅ Verifica expiração
3. ✅ Autoriza por role
4. ✅ Redireciona não autenticados para `/login`

```typescript
// Fluxo de Requisição
GET /teacher/classes
  ↓ middleware.ts verifica
  ↓ token válido + role = 'teacher'? ✅
  ✓ Renderiza página
```

---

## 🎨 Componentes Reutilizáveis

### Button Component

```typescript
import { Button } from '@/components/ui/Button';

export default function Example() {
  return (
    <>
      <Button>Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="danger">Delete</Button>
      <Button isLoading>Loading...</Button>
    </>
  );
}
```

### Input Component

```typescript
import { Input } from '@/components/ui/Input';

export default function Form() {
  return (
    <Input
      label="Email"
      type="email"
      placeholder="seu@email.com"
      error="Email inválido"
    />
  );
}
```

---

## 📝 Tipos TypeScript

### Auth Types

```typescript
import type { Session, AuthUser, Role } from '@/lib/types/auth';

const session: Session = {
  userId: '123',
  email: 'user@example.com',
  name: 'João',
  role: 'scholar' | 'teacher' | 'admin',
  avatar: '...',
  createdAt: Date.now(),
};
```

### Entity Types

```typescript
import type { Classroom, User, Notification } from '@/lib/types/entities';
```

### API Types

```typescript
import type { ApiResponse, PaginatedResponse } from '@/lib/types/api';

const response: ApiResponse<User> = {
  data: { /* user data */ },
  message: 'Sucesso',
  timestamp: new Date().toISOString(),
};
```

---

## ⚙️ Server vs Client Components

### 🟢 Server Components (Padrão)

```typescript
// ✅ Use para:
// - Buscar dados (BD/API)
// - Verificar segurança
// - Renderizar conteúdo estático

export default async function Page() {
  const session = await getSession();
  const data = await fetchFromDB();

  return <div>{data}</div>;
}
```

### 🔵 Client Components ('use client')

```typescript
// ✅ Use para:
// - Interatividade (onclick, onChange, etc)
// - Estado local (useState, useReducer)
// - Context API

'use client';

import { useState } from 'react';

export default function Interactive() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(count + 1)}>
      Clicado: {count}
    </button>
  );
}
```

### ⚡ Hybrid Pattern

```typescript
// Page: Server Component
export default async function Page() {
  const session = await getSession();

  return (
    <>
      <Heading>{session.name}</Heading>
      <InteractiveForm session={session} />
    </>
  );
}

// Form: Client Component
'use client';

export function InteractiveForm({ session }) {
  const [loading, setLoading] = useState(false);

  return <form>...</form>;
}
```

---

## 🎯 Boas Práticas

### 1️⃣ **Redirecionamento Condicional**

```typescript
export default async function HomePage() {
  const session = await getSession();

  if (session) {
    const dashboards = {
      scholar: '/scholar',
      teacher: '/teacher',
      admin: '/admin',
    };
    redirect(dashboards[session.role]);
  }

  return <LandingPage />;
}
```

### 2️⃣ **Metadados Dinâmicos**

```typescript
export const generateMetadata = async (props) => {
  const params = await props.params;
  const classroom = await fetchClassroom(params.id);

  return {
    title: `${classroom.name} | AtenaAI`,
    description: classroom.description,
  };
};
```

### 3️⃣ **Tratamento de Erros**

**`app/error.tsx`**
```typescript
'use client';

export default function Error({ error, reset }) {
  return (
    <div>
      <h1>Algo deu errado</h1>
      <button onClick={reset}>Tentar novamente</button>
    </div>
  );
}
```

### 4️⃣ **Cookies HttpOnly (Segurança)**

```typescript
// ✅ SEGURO - HttpOnly bloqueia acesso via JavaScript
cookieStore.set('session', value, {
  httpOnly: true,
  secure: true,        // HTTPS only
  sameSite: 'lax',     // CSRF protection
  path: '/',
});

// ❌ INSEGURO
document.cookie = 'token=' + value; // Acessível via JS
```

### 5️⃣ **Sem Estado Global Desnecessário**

```typescript
// ❌ EVITAR - Redux global para autenticação
// const [user] = useSelector(state => state.auth);

// ✅ USAR - getSession() em Server Components
const session = await getSession();
```

### 6️⃣ **Validação em Múltiplas Camadas**

```typescript
// Camada 1: Middleware (rota)
middleware.ts
  
// Camada 2: Layout (component)
app/(protected)/layout.tsx → requireAuth()
  
// Camada 3: API Handler (dados)
app/api/user/route.ts → validarToken()
```

---

## 🚀 Checklist de Implementação

- [x] Estrutura de pastas profissional
- [x] Autenticação com cookies HttpOnly
- [x] Middleware por role
- [x] Layouts aninhados corretamente
- [x] Zero useEffect para sessão
- [x] Server Components para autenticação
- [x] Client Components para interatividade
- [x] Tipos TypeScript robustos
- [x] Componentes reutilizáveis
- [x] Metadados dinâmicos
- [ ] Integrações com Backend (implementar)
- [ ] Testes E2E (próximo passo)
- [ ] Logging e monitoring (próximo passo)

---

## 🔗 Integrações Necessárias

### Conectar com Backend FastAPI

**`lib/api/client.ts`** já está pronto. Basta implementar:

```typescript
// Exemplo: Buscar classrooms
const classrooms = await apiClient.get('/api/v1/classrooms');

// Exemplo: Criar classroom
const newClass = await apiClient.post('/api/v1/classrooms', {
  name: 'Turma A',
  description: '...',
});
```

---

## 📚 Próximos Passos

1. **Implementar integrações com backend**
   - Substituir mocks em `/api/auth/*` por chamadas reais
   
2. **Adicionar validação de forms**
   - React Hook Form + Zod
   
3. **Testes E2E**
   - Playwright ou Cypress
   
4. **Monitoring**
   - Sentry para erros
   - Analytics para uso

---

**Documentação baseada em Next.js 16 + App Router + TypeScript**
