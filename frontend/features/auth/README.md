# Módulo de Autenticação

Estrutura completa e organizada para autenticação na AtenaAI.

## 📁 Estrutura

```
features/auth/
├── components/
│   ├── LoginModal.tsx      # Modal de login (controla UI)
│   ├── SignupModal.tsx     # Modal de cadastro (controla UI)
│   ├── LoginForm.tsx       # Formulário de login (reutilizável)
│   └── SignupForm.tsx      # Formulário de cadastro (reutilizável)
├── hooks/
│   └── useAuth.ts          # Hook para acessar contexto de auth
├── services/
│   └── auth.service.ts     # Chamadas API de autenticação
├── types/
│   └── auth.types.ts       # Tipos TypeScript
├── AuthProvider.tsx        # Provider de contexto
└── index.ts                # Exports públicos
```

## 🏗️ Arquitetura

```
LoginModal
   ↓
LoginForm
   ↓
useAuth
   ↓
auth.service
```

### Separação de responsabilidades

- **Modal**: Controla abertura/fechamento e UI do overlay
- **Form**: Lógica de validação e submissão
- **Hook**: Acessa o contexto de autenticação
- **Service**: Faz chamadas à API

## 🚀 Como usar

### 1. Importar os componentes

```tsx
import { LoginModal, SignupModal } from "@/features/auth"
```

### 2. Criar estado na UI

```tsx
const [loginOpen, setLoginOpen] = useState(false)
const [signupOpen, setSignupOpen] = useState(false)
```

### 3. Renderizar os modais

```tsx
<button onClick={() => setLoginOpen(true)}>
  Entrar
</button>

<LoginModal
  open={loginOpen}
  onClose={() => setLoginOpen(false)}
/>
```

### 4. Exemplo completo com alternância entre modais

```tsx
"use client"

import { useState } from "react"
import { LoginModal, SignupModal } from "@/features/auth"

export function MyComponent() {
  const [loginOpen, setLoginOpen] = useState(false)
  const [signupOpen, setSignupOpen] = useState(false)

  const switchToSignup = () => {
    setLoginOpen(false)
    setSignupOpen(true)
  }

  const switchToLogin = () => {
    setSignupOpen(false)
    setLoginOpen(true)
  }

  return (
    <>
      <button onClick={() => setLoginOpen(true)}>
        Entrar
      </button>
      
      <button onClick={() => setSignupOpen(true)}>
        Criar Conta
      </button>

      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSwitchToSignup={switchToSignup}
      />

      <SignupModal
        open={signupOpen}
        onClose={() => setSignupOpen(false)}
        onSwitchToLogin={switchToLogin}
      />
    </>
  )
}
```

## 📦 Componentes

### LoginModal

Controla a UI do modal de login.

**Props:**
- `open: boolean` - Se o modal está aberto
- `onClose: () => void` - Callback para fechar
- `onSwitchToSignup?: () => void` - Callback para trocar para signup

**Recursos:**
- Fecha com ESC
- Fecha clicando fora
- Previne scroll do body
- Animação de entrada

---

### SignupModal

Controla a UI do modal de cadastro.

**Props:**
- `open: boolean` - Se o modal está aberto
- `onClose: () => void` - Callback para fechar
- `onSwitchToLogin?: () => void` - Callback para trocar para login

**Recursos:**
- Fecha com ESC
- Fecha clicando fora
- Previne scroll do body
- Animação de entrada

---

### LoginForm

Formulário de login reutilizável.

**Props:**
- `onSuccess?: () => void` - Callback após login bem-sucedido
- `onSwitchToSignup?: () => void` - Callback para trocar para signup

**Recursos:**
- Validação de campos
- Toggle de visibilidade de senha
- Loading state
- Mensagens de erro

---

### SignupForm

Formulário de cadastro reutilizável.

**Props:**
- `onSuccess?: () => void` - Callback após cadastro bem-sucedido
- `onSwitchToLogin?: () => void` - Callback para trocar para login

**Recursos:**
- Validação de campos (email, senha, confirmação)
- Toggle de visibilidade de senha
- Validação de senha (mínimo 6 caracteres)
- Loading state
- Mensagens de erro

---

## 🎣 Hook useAuth

Acessa o contexto de autenticação.

```tsx
const { user, loading, login, logout } = useAuth()
```

**Retorno:**
- `user: AuthUser | null` - Usuário atual
- `loading: boolean` - Estado de carregamento
- `login: (email, password) => Promise<AuthUser>` - Função de login
- `logout: () => Promise<void>` - Função de logout

---

## 🔧 Service

Funções de API disponíveis em `auth.service.ts`:

```ts
import * as authService from "@/features/auth/services/auth.service"

// Login
await authService.login({ email, password })

// Cadastro
await authService.signup({ name, email, password })

// Logout
await authService.logout()

// Usuário atual
await authService.getCurrentUser()
```

---

## ⚠️ Importante

### ❌ NÃO faça isso

```tsx
// Não coloque estado de modal no AuthProvider
<AuthProvider loginModalOpen={true} /> // ❌
```

### ✅ FAÇA isso

```tsx
// Controle o estado no componente que precisa abrir o modal
const [loginOpen, setLoginOpen] = useState(false) // ✅
```

### Por quê?

- Modais são **UI temporária**
- AuthProvider é para **estado de autenticação**
- Separação de responsabilidades
- Componentes mais reutilizáveis

---

## 🎨 Estilização

Os componentes usam Tailwind CSS com suporte a dark mode:

- `dark:` prefix para modo escuro
- Cores personalizadas do tema
- Animações suaves
- Responsivo

---

## 📝 Tipos

```ts
type AuthUser = {
  id: string
  name: string
  email: string
  role: "student" | "teacher" | "admin"
}

type LoginRequest = {
  email: string
  password: string
}

type SignupRequest = {
  name: string
  email: string
  password: string
}
```

---

## 🔍 Exemplo completo

Veja o exemplo completo em:
`components/layout/PublicHeader.example.tsx`
