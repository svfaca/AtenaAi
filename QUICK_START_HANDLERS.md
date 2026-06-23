# 🎯 Quick Start - Implementando Handlers

Guia rápido para implementar handlers de conversação com sincronização correta.

---

## 📋 Checklist Rápido

Quando implementar qualquer handler que modifica dados:

- [ ] Usar actions de `conversationActions.ts`
- [ ] Obter `mutate` do `useSWRConfig()`
- [ ] Envolver em `try/catch`
- [ ] Mostrar toast de sucesso/erro
- [ ] Confirmar ações destrutivas (delete)

---

## ⚡ Template Básico

```typescript
'use client';

import { useSWRConfig } from 'swr';
import { toast } from 'sonner';
import { useChatStore } from '@/lib/stores';
import { useConversations } from '@/features/conversations/hooks/useConversations';
import { deleteConversation } from '@/features/conversations/actions/conversationActions';

export default function YourComponent() {
  const { mutate } = useSWRConfig(); // ← IMPORTANT!
  const { conversations } = useConversations();
  const { selectedConversation } = useChatStore();

  const handleDelete = async (id: number) => {
    if (!confirm('Deletar?')) return;
    
    try {
      await deleteConversation(id, mutate);
      toast.success('Deletado!');
    } catch (error) {
      toast.error('Erro ao deletar');
    }
  };

  return (
    <div>
      {conversations.map(conv => (
        <button key={conv.id} onClick={() => handleDelete(conv.id)}>
          Delete
        </button>
      ))}
    </div>
  );
}
```

---

## 🔄 Sync Flow (Memorize Isto!)

```
User Action
    ↓
Handler
    ↓
Action (API call)
    ↓
Mutate SWR cache
    ↓
Update Zustand (if needed)
    ↓
UI updates automatically ✨
```

---

## ✅ Actions Disponíveis

```typescript
import {
  createConversation,      // Nova conversa
  deleteConversation,      // Deletar conversa
  renameConversation,      // Renomear conversa
  duplicateConversation,   // Duplicar conversa
} from '@/features/conversations/actions/conversationActions';
```

Todas retornam Promise e lidam com sync automaticamente.

---

## 🚨 Erros Comuns

### ❌ Esquecer useSWRConfig
```typescript
// ❌ WRONG
const handleDelete = async (id) => {
  await api.delete(`/api/conversations/${id}`);
  // Sidebar não atualiza!
};
```

### ✅ Correto
```typescript
// ✅ CORRECT
const { mutate } = useSWRConfig();
const handleDelete = async (id) => {
  await deleteConversation(id, mutate);
  // Sidebar + ChatWindow sincronizados!
};
```

---

## 📚 Recursos

- Implementação completa: [SidebarWithActions.example.tsx](frontend/features/conversations/examples/SidebarWithActions.example.tsx)
- Todas as actions: [conversationActions.ts](frontend/features/conversations/actions/conversationActions.ts)
- Anti-patterns: Ver comentários `❌ WRONG` nos examples

---

**Dica:** Copie o template acima e ajuste para seu caso!
