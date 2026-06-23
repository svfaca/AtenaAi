# 📊 State Management Evolution - AtenaAI

## Timeline da Arquitetura

### ❌ Fase 1: Props Drilling (Antes)
```typescript
StudentLayout
├─ useState × 8
├─ useConversations()  // Fetch aqui
├─ useRooms()          // Fetch aqui
└─ props drilling → StudentSidebar (15+ props)
    └─ props drilling → SidebarConversations
```

**Problemas:**
- Props drilling 3+ níveis
- Estado espalhado
- Data fetching no lugar errado
- 174 linhas no StudentLayout

---

### ⚠️ Fase 2: Single Store (Intermediário)
```typescript
// useAppUI.ts - ANTES da separação
useAppUI {
  // UI State
  isSidebarCollapsed
  isMobileSidebarOpen
  isSettingsOpen
  
  // ⚠️ PROBLEMA: Domain State misturado
  selectedConversation  // ← Não é UI!
}
```

**Problemas identificados:**
- Mistura UI state com domain state
- Risco de virar mega store
- Dificulta escalabilidade

---

### ✅ Fase 3: Domain-Separated Stores (Atual)

```typescript
// lib/stores/useUIStore.ts
useUIStore {
  // ✅ Apenas UI puro
  isSidebarCollapsed
  isMobileSidebarOpen
  isSettingsOpen
}

// lib/stores/useChatStore.ts
useChatStore {
  // ✅ Apenas Chat domain
  selectedConversation
  draftMessage
}

// features/*/hooks/use*.ts
// ✅ Server data via SWR
useConversations() → SWR
useRooms() → SWR
```

**Arquitetura:**
```
StudentLayout (~90 linhas)
├─ useUIStore()       # UI state
└─ AppShell (slots)
    ├─ Header
    ├─ Sidebar
    │   ├─ useUIStore()        # UI state
    │   ├─ useChatStore()      # Domain state
    │   ├─ useConversations()  # Server data
    │   └─ useRooms()          # Server data
    └─ ChatWindow
        ├─ useChatStore()      # Domain state
        └─ useConversation()   # Server data
```

---

## Comparação: Antes vs Depois

### Estado Global

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Stores | 0 (props) | 2 focados |
| UI State | useState × 8 | useUIStore |
| Domain State | props | useChatStore |
| Server Data | prop drilling | SWR hooks |

### StudentLayout

| Métrica | Antes | Depois | Melhoria |
|---------|-------|--------|----------|
| Linhas | 174 | ~90 | -48% |
| Fetches | 2 | 0 | -100% |
| useState | 8 | 0 | -100% |
| Responsabilidades | 4 | 1 | -75% |

### StudentSidebar

| Métrica | Antes | Depois | Melhoria |
|---------|-------|--------|----------|
| Props recebidas | 15+ | 3 | -80% |
| Fetches | 0 (recebia props) | 2 (own) | Auto-contida |
| Controle de estado | ❌ | ✅ | 100% |

### ChatWindow

| Métrica | Antes | Depois | Melhoria |
|---------|-------|--------|----------|
| Props | 1 (selectedConversation) | 0 | -100% |
| Dependências | Parent | Store | Desacoplado |

---

## Fluxos de Dados

### 1. Selecionar Conversa

**Antes:**
```
User Click
  ↓
StudentLayout.handleSelect()
  ↓
StudentLayout.useState()
  ↓
Pass as prop → StudentSidebar
  ↓
Pass as prop → ChatWindow
```

**Depois:**
```
User Click
  ↓
StudentSidebar (local handler)
  ↓
useChatStore.selectConversation()
  ↓
ChatWindow (auto re-render)
```

### 2. Toggle Sidebar

**Antes:**
```
User Click
  ↓
StudentLayout.setIsSidebarOpen()
  ↓
Pass as prop → StudentSidebar
  ↓
StudentSidebar re-renders
```

**Depois:**
```
User Click
  ↓
useUIStore.toggleSidebar()
  ↓
All consumers (auto re-render)
```

### 3. Fetch Data

**Antes:**
```
StudentLayout mount
  ↓
useConversations() fetch
  ↓
Pass data as prop → StudentSidebar
  ↓
StudentSidebar displays
```

**Depois:**
```
StudentSidebar mount
  ↓
useConversations() fetch (SWR cache)
  ↓
StudentSidebar displays
```

---

## Separação de Responsabilidades

### Antes (Monolítico)

```
StudentLayout (God Component)
├─ Layout structure ✅
├─ Data fetching ❌ (deveria estar nas features)
├─ Business handlers ❌ (deveria estar nas features)
└─ State management ❌ (deveria estar em stores)
```

### Depois (Separado)

```
AppShell
└─ Layout structure ✅

StudentLayout
└─ Composition ✅

StudentSidebar
├─ Feature composition ✅
├─ Data fetching ✅
└─ Business handlers ✅

Stores
├─ useUIStore → UI state ✅
└─ useChatStore → Domain state ✅
```

---

## Escalabilidade

### Adicionar Nova Feature

**Antes:**
```diff
StudentLayout.tsx
+ const [materials, setMaterials] = useState([])
+ const { materials } = useMaterials()  // +1 fetch
+ const handleDownloadMaterial = (id) => {...}  // +15 linhas

<StudentSidebar
  rooms={rooms}
  conversations={conversations}
+ materials={materials}                          // +1 prop
+ onDownloadMaterial={handleDownloadMaterial}    // +1 prop
```

**Depois:**
```diff
features/materials/
+ components/MaterialsSidebarSection.tsx  # Nova feature
  + useMaterials()  # Own data
  + handlers        # Own logic

StudentSidebar.tsx
+ <MaterialsSidebarSection />  # 1 linha apenas
```

---

## Testabilidade

### Antes
```typescript
// Difícil: precisa mockar 15+ props
<StudentSidebar
  rooms={mockRooms}
  conversations={mockConversations}
  onJoinRoom={mockJoinRoom}
  onLeaveRoom={mockLeaveRoom}
  onNewConversation={mockNewConversation}
  // ... 10+ mais
/>
```

### Depois
```typescript
// Fácil: mockar stores
jest.mock('@/lib/stores', () => ({
  useUIStore: () => ({ isSidebarCollapsed: false }),
  useChatStore: () => ({ selectedConversation: null })
}))

<StudentSidebar userName="Test" onLogout={jest.fn()} />
```

---

## Manutenibilidade

### Encontrar onde um estado é usado

**Antes:**
```
grep -r "selectedConversation"
→ 15 arquivos (props, useState, callbacks)
```

**Depois:**
```
grep -r "useChatStore"
→ 3 arquivos (apenas onde realmente usa)
```

### Refatorar um estado

**Antes:**
1. Mudar StudentLayout.useState
2. Mudar todas as props
3. Mudar todos os callbacks
4. Atualizar 5+ componentes

**Depois:**
1. Mudar useChatStore
2. Componentes que usam atualizam automaticamente

---

## Performance

### Re-renders Desnecessários

**Antes (Props):**
```typescript
// StudentLayout re-renderiza → TODOS filhos re-renderizam
StudentLayout.setIsSidebarOpen()
  ↓
<StudentSidebar /> ← re-render
  └─ <SidebarConversations /> ← re-render
      └─ <ConversationItem /> × 50 ← re-render tudo!
```

**Depois (Zustand):**
```typescript
// Apenas componentes que USAM o estado re-renderizam
useUIStore.toggleSidebar()
  ↓
Only components with:
  const { isSidebarCollapsed } = useUIStore()
  ↓
Selective re-renders ✅
```

### Bundle Size

| Before | After | Diferença |
|--------|-------|-----------|
| 0 KB (built-in React) | ~3 KB (Zustand) | +3 KB |
| Props drilling overhead | Clean imports | Melhor DX |

**Trade-off:** 3 KB extra, mas:
- ✅ Melhor DX
- ✅ Menos re-renders
- ✅ Código mais limpo

---

## Checklist de Qualidade: Antes vs Depois

| Critério | Antes | Depois |
|----------|-------|--------|
| God Component evitado | ❌ | ✅ |
| Estado duplicado | ⚠️ | ✅ |
| Fetches duplicados | ⚠️ | ✅ |
| Props drilling | ❌ | ✅ |
| Features auto-contidas | ❌ | ✅ |
| UI/Domain separados | ❌ | ✅ |
| TypeScript completo | ✅ | ✅ |
| Stores focados | N/A | ✅ |
| Escalável | ⚠️ | ✅ |
| Testável | ⚠️ | ✅ |

---

## Lições Aprendidas

### ✅ Acertos

1. **Separar UI de Domain state** desde o início
2. **1 store por domínio** previne mega stores
3. **SWR para server data** evita duplicação
4. **Features auto-contidas** facilitam manutenção
5. **AppShell com slots** maximiza reuso

### ⚠️ Vigilância Contínua

1. **Tamanho dos stores** (< 200 linhas)
2. **Número de fetches** na sidebar (< 5)
3. **Props drilling** ressurgindo (0 níveis)
4. **Estado duplicado** entre stores
5. **Re-renders** desnecessários

### 🚀 Próxima Evolução

Quando precisar:
- **useRoomStore** (quando rooms feature crescer)
- **useNotificationStore** (quando adicionar notificações)
- **Persist middleware** (para preferências de usuário)
- **DevTools** (para debug do Zustand)

---

**Status:** ✅ Arquitetura pronta para produção  
**Data:** March 8, 2026  
**Revisão:** Mensal ou quando adicionar 5+ stores
