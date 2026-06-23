# 🤖 Página Inicial de Chat Público - AtenaAI

Esta é a página inicial dinâmica criada a partir do HTML estático fornecido, agora totalmente convertida para Next.js com React, TypeScript e Tailwind CSS.

## 📁 Estrutura de Componentes

### Componentes Principais:

1. **PublicHeader** (`/components/layout/PublicHeader.tsx`)
   - Header reutilizável para páginas públicas
   - Tema dark/light com localStorage
   - Menu responsivo (mobile e desktop)
   - Navegação para login, signup e about

2. **ChatContainer** (`/components/ChatContainer.tsx`)
   - Exibe mensagens do chat
   - Auto-scroll para a última mensagem
   - Suporta HTML rendering
   - Animações de fade-in

3. **ChatInput** (`/components/ChatInput.tsx`)
   - Campo de entrada com auto-resize
   - Suporte a Enter para enviar (Shift+Enter para quebra de linha)
   - Indicador de carregamento
   - Validação de mensagens vazias

## 📄 Páginas

### `/chat` (Página Principal de Chat)
- Localizado em `app/(public)/chat/page.tsx`
- Combina todos os componentes
- Estado de mensagens com hook `useState`
- Integração com API backend em `/api/chat/public`

### `/` (Landing Page)
- Mantém a página principal de marketing
- Links para chat, login e signup
- Redirecionamento automático se autenticado

## 🎨 Estilos

- **Dark Mode**: Suportado via Tailwind CSS com classe `dark`
- **Scrollbar Customizado**: Estilos personalizados para o chat container
- **Animações**: Fade-in suave para mensagens
- **Responsivo**: Mobile-first design com breakpoints

## 🔌 API Endpoints

### POST `/api/chat/public`
Endpoint intermediário que:
- Recebe mensagens do frontend
- Encaminha para o backend FastAPI
- Retorna resposta da IA
- Trata erros gracefully

**Request:**
```json
{
  "message": "Olá, tudo bem?",
  "conversationId": "public"
}
```

**Response:**
```json
{
  "response": "Resposta da IA",
  "conversationId": "public"
}
```

## 🌓 Tema Dark/Light

O tema é persistido no localStorage:
```javascript
const theme = localStorage.getItem('theme'); // 'light' | 'dark'
```

Implementado automaticamente no componente `PublicHeader` com:
- Detecção de preferência do sistema
- Sincronização com `document.documentElement`
- Classe `dark` aplicada no HTML

## 📱 Funcionalidades Principais

✅ Chat interativo com IA
✅ Tema dark/light persistente
✅ Totalmente responsivo
✅ Auto-resize de textarea
✅ Animações suaves
✅ Mensagens de erro gracefulls
✅ Scroll automático para novas mensagens
✅ Menu mobile/desktop dinâmico

## 🔧 Variáveis de Ambiente

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 🚀 Como Usar

1. **Iniciar o projeto Next.js:**
```bash
cd frontend/next
npm install
npm run dev
```

2. **Acessar a página de chat:**
```
http://localhost:3000/chat
```

3. **Usar o componente em outra página:**
```tsx
import { PublicHeader } from '@/components/layout/PublicHeader';
import { ChatContainer } from '@/components/ChatContainer';
import { ChatInput } from '@/components/ChatInput';

// Use os componentes na sua página
```

## 📝 Notas

- A página de chat públic não requer autenticação
- Todo o estado é mantido localmente (sem persistência em DB)
- As mensagens são perdidas ao recarregar a página
- O tema é persistido entre sessões

## 🔗 Links Relacionados

- Landing Page: `/`
- Login: `/login`
- Signup: `/signup`
- About: `/about`
- Chat Público: `/chat`
