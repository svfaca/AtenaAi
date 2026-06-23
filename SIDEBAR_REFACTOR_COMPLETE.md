# 📐 Nova Arquitetura da Sidebar - Refatoração Profissional

## 🎯 Objetivo

Reorganizar a sidebar seguindo padrões de apps profissionais (ChatGPT, Slack, Linear) para:
- ✅ Eliminar duplicação de estado
- ✅ Unificar mobile e desktop
- ✅ Organizar lógica por domínio
- ✅ Facilitar manutenção futura

---

## 🏗️ Estrutura de Pastas

```
frontend/components/sidebar/
├── Sidebar.tsx                    # Container principal (único)
├── SidebarContent.tsx             # Conteúdo scrollável
├── SidebarHeader.tsx              # Logo/branding (opcional)
├── SidebarFooter.tsx              # Perfil, logout
├── SidebarSection.tsx             # Seção colapsável (reutilizável)
├── index.ts                       # Exports centralizados
│
├── hooks/
│   └── useSidebar.ts              # Gerencia: collapsed, mobileOpen
│
├── conversations/
│   ├── ConversationsList.tsx       # Lista + fetch de conversas
│   ├── ConversationItem.tsx        # Item individual
│   └── ConversationMenu.tsx        # Menu: renomear, duplicar, excluir
│
└── rooms/
    ├── RoomsList.tsx              # Lista de salas (mock por enquanto)
    ├── RoomItem.tsx               # Item individual
    └── RoomMenu.tsx               # Menu: detalhes, sair
```

---

## 🔄 Fluxo de Dados

```
StudentLayout (layout/layout.tsx)
├─ Gerencia: App Header, App Shell
├─ passa props → StudentSidebar
│
└─ StudentSidebar (features/student/components/)
   └─ Wrapper que chama o novo:
      └─ Sidebar (components/sidebar/)
         ├─ useSidebar hook
         │  ├─ isCollapsed (desktop toggle)
         │  └─ isMobileOpen (mobile slide)
         │
         ├─ SidebarContent
         │  ├─ ConversationsList
         │  │  ├─ useChatStore (conversas)
         │  │  └─ ConversationItem
         │  │     └─ ConversationMenu
         │  │
         │  └─ RoomsList
         │     ├─ useRoomsStore (TODO)
         │     └─ RoomItem
         │        └─ RoomMenu
         │
         └─ SidebarFooter
            └─ Botões: Configurações, Logout, Quem Somos
```

---

## 📊 Comparação: Antes vs Depois

### Antes (Fragmentado)

```tsx
// ❌ Múltiplos locais de estado
StudentLayout:
  - isMobileSidebarOpen → useUIStore

StudentSidebar:
  - isSidebarCollapsed → useUIStore
  - isMobileSidebarOpen → useUIStore (duplicado!)
  - conversations → useConversations hook
  - rooms → useRooms hook
  - selectedConversationId → useChatStore

// ❌ Lógica espalhada
onCloseMobile → callback prop
toggleSidebar → useUIStore
selectConversation → useChatStore
deleteConversation → useChatStore
```

### Depois (Centralizado)

```tsx
// ✅ Uma única fonte de verdade por nível
Sidebar (component):
  └─ useSidebar() → { isCollapsed, isMobileOpen }

ConversationsList (component):
  └─ useChatStore() → { conversations, activeConversationId }

RoomsList (component):
  └─ useRoomsStore() → { rooms } (quando implementado)

// ✅ Lógica mapeada por domínio
closeMobile() → local ao useSidebar hook
toggleCollapsed() → local ao useSidebar hook
selectConversation() → delegado ao useChatStore
deleteConversation() → delegado ao useChatStore
```

---

## 🎛️ Componentes em Detalhe

### 1️⃣ `Sidebar.tsx` (Container - A única sidebar)

**Responsabilidades:**
- Layout responsivo (fixed mobile, relative desktop)
- Overlay mobile
- Animações
- Header com avatar/nome
- Gerencia `isCollapsed` e `isMobileOpen` via `useSidebar`

**Não faz:**
- Data fetching
- Business logic
- Menu de conversas/salas

```tsx
export default function Sidebar({
  userName: string
  userInitial: string
  userAvatar?: string
  userRole?: string
  footer: ReactNode
})
```

---

### 2️⃣ `SidebarContent.tsx` (Layout do conteúdo)

**Responsabilidades:**
- Container scrollável
- Organiza seções (ConversationsList, RoomsList)

```tsx
<div className="flex-1 overflow-y-auto">
  <ConversationsList isCollapsed={isCollapsed} closeMobile={closeMobile} />
  <RoomsList isCollapsed={isCollapsed} closeMobile={closeMobile} />
</div>
```

---

### 3️⃣ `SidebarSection.tsx` (Seção colapsável reutilizável)

**Responsabilidades:**
- Título + ícone
- Toggle expand/collapse
- Layout da seção

**Usado por:**
- ConversationsList ("💬 Conversas")
- RoomsList ("🏫 Salas")
- Qualquer nova seção no futuro

```tsx
<SidebarSection title="Conversas" icon="💬">
  {/* lista de conversas */}
</SidebarSection>
```

---

### 4️⃣ `ConversationsList.tsx` (Fetch + renderização)

**Responsabilidades:**
- `useEffect` → `hydrateConversations()`
- Map conversas → `ConversationItem`
- Passa `closeMobile` para itens

```tsx
useEffect(() => {
  hydrateConversations() // carrega na montagem
}, [hydrateConversations])

conversations.map(conv => (
  <ConversationItem
    key={conv.id}
    conversation={conv}
    isActive={conv.id === activeConversationId}
    closeMobile={closeMobile}
  />
))
```

---

### 5️⃣ `ConversationItem.tsx` (Item individual)

**Responsabilidades:**
- Renderizar um item
- Clique → abre conversa (navega + fecha mobile)
- Exibe menu (⋯)

```tsx
<button onClick={handleClick}>
  {conversation.title}
</button>

<ConversationMenu conversation={conversation} />
```

---

### 6️⃣ `ConversationMenu.tsx` (Menu dropdown)

**Responsabilidades:**
- Botão ⋯
- Dropdown com opções:
  - **Duplicar** ✅
  - **Renomear** (TODO)
  - **Excluir** (com confirmação)
- Fecha ao clicar fora

```tsx
<button onClick={() => setIsOpen(!isOpen)}>⋯</button>

{isOpen && (
  <div className="dropdown">
    <button>Duplicar</button>
    <button>Renomear</button>
    <button>Excluir</button>
  </div>
)}
```

---

### 7️⃣ `RoomsList.tsx` (Para salas/turmas)

**Responsabilidades:**
- Mesmo padrão que ConversationsList
- TODO: Integrar com useRoomsStore

```tsx
<SidebarSection title="Salas" icon="🏫">
  {rooms.map(room => (
    <RoomItem key={room.id} room={room} closeMobile={closeMobile} />
  ))}
</SidebarSection>
```

---

### 8️⃣ `useSidebar()` Hook (Estado = único lugar)

**Responsabilidades:**
- Gerencia `isCollapsed` (desktop toggle)
- Gerencia `isMobileOpen` (mobile slide)
- Callbacks: `toggleCollapsed`, `openMobile`, `closeMobile`, `toggleMobile`

```tsx
const { isCollapsed, isMobileOpen, toggleCollapsed, closeMobile } = useSidebar()

// Usado em Sidebar.tsx e ConversationsList etc
```

**Benefícios:**
- ✅ Sem prop drilling
- ✅ Sem zustand (estado simples)
- ✅ Reutilizável em qualquer componente

---

## 🔗 Integração com StudentLayout

**Antes:**
```tsx
<StudentSidebar
  userName={userName}
  userInitial={userInitial}
  avatarUrl={user?.profile_image}
  onCloseMobile={closeMobileSidebar}
  onOpenSettings={openSettings}
  onLogout={handleLogout}
/>
```

**Depois:**
```tsx
// StudentSidebar agora é um wrapper fino que chama o novo Sidebar
<StudentSidebar
  userName={userName}
  userInitial={userInitial}
  avatarUrl={user?.profile_image}
  onCloseMobile={closeMobileSidebar}  // ← passado pra useSidebar (NÃO NECESSÁRIO MAIS)
  onOpenSettings={openSettings}
  onLogout={handleLogout}
/>
```

**StudentSidebar ainda recebe props de StudentLayout por compatibilidade, mas internamente:**
1. Chama `<Sidebar>`
2. `<Sidebar>` usa `useSidebar()` (sem props!)
3. ConversationsList usa `useChatStore()`
4. RoomsList usa `useRoomsStore()` (quando pronto)

---

## 🎯 Benefícios Imediatos

| Benefício | Antes | Depois |
|-----------|-------|--------|
| **Duplicação de estado** | ❌ 3 locais | ✅ 1 lugar (useSidebar) |
| **Mobile + Desktop** | ❌ 2 sidebars | ✅ 1 sidebar |
| **Dropdowns** | ❌ Bugs com scroll | ✅ Isolados em RoomMenu |
| **Lógica fragmentada** | ❌ Espalhada | ✅ Separada por domínio |
| **Prop drilling** | ❌ 15+ props | ✅ Hooks diretos |
| **Collapse isolado** | ❌ useUIStore | ✅ useSidebar |
| **Conversas isoladas** | ❌ useUIStore + custom | ✅ useChatStore |
| **Testabilidade** | ❌ Difícil | ✅ Fácil (hooks isolados) |

---

## 📝 TODOs

### Curto prazo
- [ ] Testar integração completa com StudentLayout
- [ ] Arrumar imports de tipos
- [ ] Testar mobile no real device

### Médio prazo
- [ ] Implementar `useRoomsStore` para RoomsList
- [ ] Adicionar renaming de conversas (UI pronta, falta backend)
- [ ] Adicionar "Novas conversas" botão

### Longo prazo
- [ ] Adicionar busca/filtro de conversas
- [ ] Adicionar drag-drop de seções
- [ ] Adicionar favoritas

---

## 📚 Como Usar

### Imports
```tsx
import {
  Sidebar,
  SidebarContent,
  SidebarSection,
  ConversationsList,
  RoomsList,
  useSidebar,
} from '@/components/sidebar'
```

### Exemplo completo
```tsx
import Sidebar from '@/components/sidebar'

export default function MyLayout() {
  return (
    <Sidebar
      userName="João"
      userInitial="J"
      userAvatar={avatarUrl}
      userRole="Estudante"
      footer={
        <button>Logout</button>
      }
    />
  )
}
```

O resto (ConversationsList, RoomsList) é renderizado **automaticamente** dentro do Sidebar!

---

## 🧪 Testes

```tsx
// useSidebar é fácil de testar
import { useSidebar } from '@/components/sidebar/hooks/useSidebar'

test('useSidebar toggles correctly', () => {
  const { result } = renderHook(() => useSidebar())
  expect(result.current.isCollapsed).toBe(false)
  act(() => result.current.toggleCollapsed())
  expect(result.current.isCollapsed).toBe(true)
})
```

---

## 🔄 Próximos Passos

1. **Testar tudo** - rodas as páginas student e verifica mobile
2. **Remover SidebarRooms e SidebarConversations** - antigos components
3. **Atualizar documentação** - ARCHITECTURE_INDEX.md
4. **Implementar rooms store** - quando necessário

---

**Criado:** 9 Março 2026  
**Status:** ✅ Implementação completa + refatoração StudentSidebar  
**Próximo:** Testes e remoção de componentes antigos
