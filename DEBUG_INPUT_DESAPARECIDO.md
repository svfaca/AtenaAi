# 🐛 Debug Guide - Input Desaparecido

## Problema Reportado
Input do chat sumiu após refatoração de stores.

## ✅ Soluções Implementadas

### 1. **Página /scholar criada**
**Problema:** Redirect para `/scholar` mas página não existia  
**Solução:** Criada [app/scholar/page.tsx](app/scholar/page.tsx)

```typescript
export default async function ScholarPage() {
  // Busca user
  const userData = await getCurrentUser();
  
  // Valida role
  if (!userData || userData.user?.role !== 'student') {
    redirect('/');
  }

  return (
    <StudentLayout userName={user.full_name}>
      <ChatWindow />
    </StudentLayout>
  );
}
```

---

### 2. **Debug logging adicionado**
Adicionado logging no [ChatWindow.tsx](features/chat/components/ChatWindow.tsx):

```typescript
useEffect(() => {
  console.log('[ChatWindow] selectedConversation:', selectedConversation);
  console.log('[ChatWindow] conversationId:', conversationId);
}, [selectedConversation, conversationId]);
```

**Como usar:**
1. Abrir DevTools (F12)
2. Ir para Console
3. Verificar logs:
   - Se `selectedConversation: null` → problema é estado Zustand
   - Se conversa aparece mas input some → problema é layout

---

### 3. **ChatWindow SEMPRE renderiza input**
✅ **Verificado:** Não há early return escondendo input

O componente SEMPRE renderiza:
- Header (lines 105-112)
- Messages area (lines 114-135)
- **Form com input (lines 137-167)** ← SEMPRE VISÍVEL

---

## 🔍 Próximos Passos de Debug

### A. Verificar Estado Zustand

**Abrir no console:**
```javascript
// Ver store UI
window.useUIStore = require('@/lib/stores').useUIStore;
useUIStore.getState()

// Ver store Chat
window.useChatStore = require('@/lib/stores').useChatStore;
useChatStore.getState()
```

**Se selectedConversation é null:**
1. Selecionar conversa na sidebar deve chamar
   `useChatStore.selectConversation(conversation)`
2. Verificar se `handleSelectConversation` está funcionando

---

### B. Verificar Layout/CSS

**Abrir DevTools Elements:**
1. Inspecionar o `<form>` do input
2. Verificar classes aplicadas:
   ```css
   .border-t .border-slate-200 .px-6 .py-4
   ```
3. Verificar se form está `display: none` ou `visibility: hidden`
4. Verificar se `<main>` tem `overflow: hidden` cortando conteúdo

**Classes críticas para funcionar:**
```html
<section class="flex flex-1 flex-col">  <!-- ChatWindow -->
  <header>...</header>
  <div class="flex-1">Messages</div>
  <form class="border-t">Input</form>       <!-- ← Deve estar visível -->
</section>
```

---

### C. Verificar AppShell

**Verificar em [AppShell.tsx](components/layout/AppShell.tsx):**
```html
<main class="flex min-h-0 flex-1 flex-col overflow-hidden">
  {children}  <!-- ← ChatWindow deve estar aqui -->
</main>
```

Se `{children}` não renderiza = input não aparece.

---

### D. Inicializar Store com Conversa

**Teste rápido - forçar conversa inicial:**

Em [useChatStore.ts](lib/stores/useChatStore.ts):
```typescript
// Temporário para debug
export const useChatStore = create<ChatState>((set) => ({
  selectedConversation: {
    id: 1,
    title: 'Test Conversation',
    created_at: new Date().toISOString(),
  },  // ← Forçar conversa inicial
  draftMessage: '',
  // ...
}));
```

Se input aparecer = problema é inicialização.  
Se input continuar sumido = problema é layout.

---

## 📊 Checklist de Debug

Execute na ordem:

- [ ] Abrir `/scholar` no navegador
- [ ] Verificar console por logs `[ChatWindow]`
- [ ] Inspecionar elemento do form no DevTools
- [ ] Verificar se form tem `display:none` ou está fora da viewport
- [ ] Verificar console por erros JavaScript
- [ ] Testar selecionar conversa na sidebar
- [ ] Verificar se `useChatStore.getState().selectedConversation` muda

---

## 🚨 Problemas Comuns e Soluções

### Problema 1: "Cannot read property 'id' of null"
**Causa:** `selectedConversation` é null  
**Solução:** Código já trata isso - usa optional chaining `selectedConversation?.id`

### Problema 2: Input existe mas está fora da tela
**Causa:** Layout sem `flex-1` ou `overflow`  
**Solução:** Verificar classes do ChatWindow section

### Problema 3: Conversa não seleciona
**Causa:** Handler não está conectado ao store  
**Solução:** Verificar [StudentSidebar.tsx](features/student/components/StudentSidebar.tsx) linha ~60:
```typescript
const handleSelectConversation = (conversationId: number) => {
  const conversation = conversations.find((c) => c.id === conversationId);
  if (conversation) {
    selectConversation(conversation);  // ← Deve chamar store
  }
};
```

---

## 🎯 Resposta Esperada

**Se tudo funcionar:**
1. Console mostra: `[ChatWindow] selectedConversation: null`
2. Messages area mostra: "Selecione ou crie uma conversa..."
3. **Input ESTÁ VISÍVEL na parte inferior** ✅
4. Ao clicar em conversa:
   - Console mostra: `[ChatWindow] selectedConversation: { id: X, ... }`
   - Messages carregam (ou ficam vazias)
   - Input continua visível

---

## 📝 Remover Debug

Após encontrar o problema, remover:

```typescript
// REMOVER esses logs
useEffect(() => {
  console.log('[ChatWindow] selectedConversation:', selectedConversation);
  console.log('[ChatWindow] conversationId:', conversationId);
}, [selectedConversation, conversationId]);
```

---

**Status:** ✅ Debug tools instalados  
**Próximo passo:** Testar no navegador e seguir checklist
