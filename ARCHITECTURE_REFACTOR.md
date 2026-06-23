# Refatoração da Arquitetura UI - AtenaAI

## 📋 Resumo

Refatoração completa da camada UI do Student Area para evitar problemas comuns de arquitetura em SPAs:
- God Components
- Estado duplicado
- Fetches redundantes
- Props drilling excessivo

## 🎯 Objetivos Alcançados

### 1. Hook Global de UI State (`useAppUI`)

**Problema anterior:**
- Estado de UI espalhado (useState em múltiplos componentes)
- Props drilling de 3+ níveis
- Dificuldade de sincronização entre componentes

**Solução implementada:**
```typescript
// lib/hooks/useAppUI.ts
export const useAppUI = create<AppUIState>((set) => ({
  // UI-only state
  isSidebarCollapsed: boolean
  isMobileSidebarOpen: boolean
  isSettingsOpen: boolean
  selectedConversation: Conversation | null
  
  // Actions
  toggleSidebar()
  openSettings()
  selectConversation()
  // ...
}))
```

**Benefícios:**
- ✅ Estado UI centralizado
- ✅ Sem props drilling
- ✅ Fácil sincronização
- ✅ TypeSafe com Zustand

---

### 2. StudentLayout Simplificado

**Antes:** 174 linhas com:
- Data fetching (useConversations, useRooms)
- State management (8+ estados locais)
- Business handlers (12+ funções)
- Layout e composição

**Depois:** ~90 linhas com:
- ✅ Apenas composição (AppShell + slots)
- ✅ UI state via useAppUI
- ✅ Handlers mínimos (apenas logout)
- ✅ Zero data fetching

```typescript
export default function StudentLayout({ userName, children }) {
  const { openMobileSidebar, openSettings, closeSettings } = useAppUI();
  
  return (
    <AppShell
      header={<Header />}
      sidebar={<StudentSidebar />}
      main={children}
      settingsPanel={<SettingsSidebar />}
    />
  );
}
```

**Impacto:**
- ❌ Risco de God Component eliminado
- ✅ Manutenibilidade alta
- ✅ Testabilidade melhorada

---

### 3. StudentSidebar Auto-Contido

**Antes:**
- Recebia dados como props (rooms, conversations)
- 15+ props passadas do parent
- Sem controle de seu próprio estado

**Depois:**
```typescript
export default function StudentSidebar({ userName, onLogout }) {
  // Busca seus próprios dados
  const { conversations } = useConversations();
  const { rooms } = useRooms();
  
  // Controla seu próprio UI state
  const { isSidebarCollapsed, toggleSidebar, selectConversation } = useAppUI();
  
  // Handlers internos
  const handleSelectConversation = (id) => {
    selectConversation(conversations.find(c => c.id === id));
  };
}
```

**Benefícios:**
- ✅ Self-contained feature component
- ✅ Props reduzidas: 15+ → 3
- ✅ Lógica co-located com UI

---

### 4. ChatWindow Desacoplado

**Antes:**
```typescript
<ChatWindow selectedConversation={selectedConversation} />
```

**Depois:**
```typescript
function ChatWindow() {
  const { selectedConversation } = useAppUI();
  // ...
}
```

**Impacto:**
- ✅ Zero props drilling
- ✅ Sincronização automática com sidebar
- ✅ Único source of truth

---

## 🏗️ Arquitetura Resultante

```
AuthProvider
   ↓
StudentLayout (Composition)
   ↓
AppShell (Layout Slots)
   ├─ Header (slot)
   ├─ Sidebar (slot)
   │   ├─ RoomsSidebarSection
   │   │   └─ useRooms (own data)
   │   └─ ConversationsSidebarSection
   │       └─ useConversations (own data)
   └─ Main (slot)
       └─ ChatWindow
           ├─ useChatStore (domain state)
           ├─ useUIStore (UI state)
           └─ useConversation (own data)
```

### Separação de Responsabilidades

| Camada | Responsabilidade | Estado | Data Fetching |
|--------|------------------|--------|---------------|
| **AppShell** | Layout puro (flex/grid) | ❌ | ❌ |
| **StudentLayout** | Composição + slots | useUIStore | ❌ |
| **StudentSidebar** | Feature composition | useUIStore + useChatStore | ✅ (own) |
| **ChatWindow** | Chat feature | useChatStore | ✅ (own) |

### State Management Architecture

```
stores/
  useUIStore.ts         # Pure UI state (sidebar, modals, theme)
  useChatStore.ts       # Chat domain (selectedConversation, draft)
  
  # Future:
  useRoomStore.ts       # Room domain (selectedRoom, members)
  useNotificationStore.ts  # Notifications
```

**Principle: 1 Store per Domain**
- ✅ UI State → useUIStore
- ✅ Chat Domain → useChatStore
- ✅ Server Data → SWR hooks

---

## 🚨 Problemas Evitados

### 1. ❌ God Component
```typescript
// EVITADO: StudentLayout com 300+ linhas
<StudentArea
  settings={...}
  selectedConversation={...}
  selectedRoom={...}
  handlers={...}
  routing={...}
  uiState={...}
/>
```

### 2. ❌ Estado Duplicado
```typescript
// EVITADO: selectedConversation em 3 lugares
StudentLayout.useState()
ScholarContext.useState()
ChatWindow.props
```

### 3. ❌ Fetches Redundantes
```typescript
// EVITADO: useConversations em 2 lugares
StudentLayout → useConversations() // Passava como prop
ConversationsSidebar → useConversations() // Fetch duplicado
```

---

## 📊 Métricas de Melhoria

| Métrica | Antes | Depois | Melhoria |
|---------|-------|--------|----------|
| Linhas StudentLayout | 174 | ~90 | -48% |
| Props StudentSidebar | 15+ | 3 | -80% |
| Estados locais | 8+ | 0 | -100% |
| Fetches duplicados | 2 | 0 | -100% |
| Níveis props drilling | 3 | 0 | -100% |

---

## 🔄 Fluxo de Estado

### UI State (useAppUI)
```
User Action → useAppUI.action() → Zustand Store → All consumers re-render
```

**Exemplo:**
```typescript
// Sidebar
onClick={() => selectConversation(conv)}

// ChatWindow (auto-sync)
const { selectedConversation } = useAppUI()
```

### Data State (SWR)
```
Component Mount → useConversations() → SWR Cache → Component
```

**Vantagens SWR:**
- Cache automático
- Revalidação inteligente
- Sem requests duplicados

---

## 🎓 Padrões Aplicados

### 1. **Colocation**
Features buscam seus próprios dados onde são usados.

### 2. **Composition over Props**
AppShell com slots ao invés de prop drilling.

### 3. **Single Source of Truth**
useAppUI para UI state global.

### 4. **Feature-First Structure**
```
features/
  conversations/
    hooks/useConversations.ts
    components/ConversationsSidebarSection.tsx
  chat/
    hooks/useConversation.ts
    components/ChatWindow.tsx
```

---

## 🚀 Próximos Passos Recomendados

### 1. Implementar Handlers Reais
```typescript
// StudentSidebar.tsx
const handleNewConversation = async () => {
  const newConv = await api.post('/conversations', {});
  selectConversation(newConv); // useChatStore
  mutate(); // Revalidate SWR
};
```

### 2. Adicionar Optimistic Updates
```typescript
const handleDeleteConversation = async (id) => {
  mutate(
    conversations.filter(c => c.id !== id),
    { revalidate: false }
  );
  await api.delete(`/conversations/${id}`);
  mutate();
};
```

### 3. Criar Novos Stores Quando Necessário
```typescript
// ⚠️ Criar apenas quando:
// - Feature crescer > 100 linhas de state
// - Precisar compartilhar entre 3+ componentes
// - Estado complexo com múltiplas actions

lib/stores/
  useRoomStore.ts       # Quando rooms feature crescer
  useNotificationStore.ts  # Quando adicionar notificações
```

### 4. Monitorar Tamanho dos Stores
```bash
# Adicionar ao CI/CD
wc -l lib/stores/*.ts
# Alerta se qualquer store > 200 linhas
```

---

## 📝 Notas Importantes

### Performance
- Zustand: zero re-renders desnecessários (selector pattern)
- SWR: cache inteligente, deduplicação automática
- AppShell: estrutura puramente presentacional

### Escalabilidade
- Adicionar novo feature: criar hook + componente
- Expandir UI state: adicionar em useAppUI
- Novo layout: criar novo Shell com slots

### Manutenibilidade
- StudentLayout: máximo 100 linhas (atual: ~90)
- Features auto-contidas
- Zero props drilling
- TypeScript em todos os hooks

---

## 🔗 Arquivos Modificados

1. ✅ `lib/hooks/useAppUI.ts` → `lib/stores/useUIStore.ts` (refatorado)
2. ✅ `lib/stores/useChatStore.ts` (novo - domain state)
3. ✅ `lib/stores/index.ts` (novo - barrel export)
4. ✅ `features/student/components/StudentLayout.tsx` (refatorado)
5. ✅ `features/student/components/StudentSidebar.tsx` (refatorado)
6. ✅ `features/chat/components/ChatWindow.tsx` (refatorado)
7. ✅ `components/layout/AppShell.tsx` (já existia com slots)
8. 📦 `package.json` (zustand adicionado)

---

## 🚨 Pontos de Vigilância

Riscos identificados e como evitar (detalhes em [VIGILANCIA_ARQUITETURA.md](VIGILANCIA_ARQUITETURA.md)):

### 1️⃣ Misturar UI State com Domain State
**✅ Resolvido:** Separados em `useUIStore` (UI puro) e `useChatStore` (domain)

**Regra:**
- UI State: sidebar, modals, theme → `useUIStore`
- Domain State: conversations, rooms → domain stores
- Server Data: listas, detalhes → SWR hooks

### 2️⃣ Fetches Simultâneos na Sidebar
**Status atual:** ✅ OK (apenas 2 fetches)

**Vigilância:** 
- Se passar de 3 fetches → implementar lazy loading
- Se passar de 5 fetches → backend aggregation endpoint

### 3️⃣ Zustand Store Virando Mega Store
**✅ Prevenido:** Arquitetura com múltiplos stores focados

**Regra de tamanho:**
- < 100 linhas: ✅ OK
- 100-200 linhas: ⚠️ Watch
- \> 200 linhas: 🚨 Refatorar

**Quando store > 200 linhas:**
1. Identificar domínios misturados
2. Criar novo store focado
3. Migrar state relacionado
4. Atualizar componentes

### 4️⃣ AppShell com Slots
**✅ Implementado:** AppShell já aceita slots

```typescript
<AppShell
  header={<Header />}
  sidebar={<StudentSidebar />}
  main={<ChatWindow />}
  settingsPanel={<SettingsSidebar />}
/>
```

Benefícios:
- Layout 100% reutilizável
- Fácil criar TeacherShell, AdminShell
- Zero prop drilling

---

## ✅ Checklist de Qualidade

- [x] Evitado God Component
- [x] Estado UI centralizado
- [x] Zero fetches duplicados
- [x] Props drilling eliminado
- [x] Features auto-contidas
- [x] TypeScript completo
- [x] Zero erros de compilação
- [x] Padrões de mercado aplicados
- [x] Documentação completa
- [x] Escalável para novas features

---

**Data:** March 8, 2026  
**Status:** ✅ Completo  
**Próxima revisão:** Quando StudentLayout > 100 linhas
