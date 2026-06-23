# 🚨 Pontos de Vigilância - Arquitetura AtenaAI

## ⚠️ Riscos de Evolução e Como Prevenir

Este documento lista os principais riscos arquiteturais identificados e as estratégias implementadas para preveni-los.

---

## 1️⃣ Mistura de UI State com Domain State

### ❌ Problema
Colocar tudo em um único store:
```typescript
// ❌ EVITAR: Mega store misturando conceitos
useAppStore {
  isSidebarOpen          // UI state
  isDarkMode             // UI state
  selectedConversation   // Domain state
  selectedRoom           // Domain state
  messages               // Domain state
  notifications          // Domain state
}
```

### ✅ Solução Implementada
Separação clara por responsabilidade:

```typescript
// ✅ lib/stores/

// UI State puro
useUIStore {
  isSidebarCollapsed
  isMobileSidebarOpen
  isSettingsOpen
}

// Domain State do Chat
useChatStore {
  selectedConversation
  draftMessage
}

// Futuros: 
useRoomStore { selectedRoom, roomMembers }
useNotificationStore { unreadCount, notifications }
```

### 📋 Checklist de Separação

**UI State** - Apenas aparência visual:
- ✅ Sidebar aberta/fechada
- ✅ Modal aberto/fechado
- ✅ Theme dark/light
- ✅ Panel visível/oculto
- ✅ Accordion expandido/colapsado

**Domain State** - Dados de negócio:
- ✅ Conversa selecionada
- ✅ Sala selecionada
- ✅ Mensagens
- ✅ Rascunhos
- ✅ Notificações

### 🚦 Regra de Ouro

> **"Se você remove do Zustand e passa como prop, o app continua funcionando? Se sim, é UI state. Se não, é domain state."**

---

## 2️⃣ Fetches Simultâneos na Sidebar

### ❌ Problema Futuro
Sidebar carregando muitos dados:
```typescript
function StudentSidebar() {
  useConversations()  // Fetch 1
  useRooms()          // Fetch 2
  useMaterials()      // Fetch 3
  useNotifications()  // Fetch 4
  useSchedule()       // Fetch 5
  // 5 requests simultâneos no mount
}
```

### ✅ Status Atual
**OK por enquanto:**
- Apenas 2 fetches (conversations, rooms)
- SWR com cache automático
- Deduplicação de requests

### 🚨 Vigilância
Monitore quando atingir:
- **3+ fetches** na sidebar → considerar lazy loading
- **5+ fetches** → implementar pagination/infinite scroll
- **Loading lento** → implementar skeleton screens

### 🔧 Soluções para o Futuro

**Opção 1: Lazy Load**
```typescript
// Carregar apenas quando seção expande
<ConversationsSection>
  {isExpanded && <ConversationsList />}
</ConversationsSection>
```

**Opção 2: Pagination**
```typescript
useSWRInfinite(`/api/conversations?page=${page}`)
```

**Opção 3: Single Endpoint**
```typescript
// Backend retorna tudo agregado
GET /api/sidebar-data
{
  conversations: [...],
  rooms: [...],
  notifications: {...}
}
```

---

## 3️⃣ Zustand Store Virando Mega Store

### ❌ Problema Comum
Store crescendo descontroladamente:
```typescript
// ❌ EVITAR: Mega store depois de 6 meses
useAppStore {
  // UI
  isSidebarOpen
  isDarkMode
  isSettingsOpen
  
  // Chat
  selectedConversation
  draftMessage
  chatMode
  
  // Room
  selectedRoom
  roomMembers
  
  // Notifications
  notifications
  unreadCount
  
  // Teacher
  students
  assignments
  
  // Admin
  users
  settings
  // ... 50+ propriedades
}
```

### ✅ Arquitetura Atual
```
lib/stores/
  index.ts              # Barrel export
  useUIStore.ts         # UI state separado
  useChatStore.ts       # Chat domain
  
# Futuros:
  useRoomStore.ts
  useNotificationStore.ts
  useTeacherStore.ts
```

### 📏 Regras de Tamanho

| Lines | Status | Ação |
|-------|--------|------|
| < 100 | ✅ OK | Continuar |
| 100-200 | ⚠️ Watch | Considerar split |
| > 200 | 🚨 Danger | **Refatorar agora** |

### 🎯 Regra: 1 Store por Domínio

```typescript
// ✅ BOM: Stores focados
useChatStore    // Apenas chat
useRoomStore    // Apenas salas
useUIStore      // Apenas UI

// ❌ RUIM: Store Deus
useAppStore     // Tudo misturado
```

### 🔄 Quando Dividir um Store

Divida quando tiver:
1. **50+ linhas** de state
2. **10+ actions**
3. **Múltiplos domínios** misturados
4. **Dificuldade** de encontrar código

---

## 4️⃣ Re-renders Desnecessários

### ⚠️ Problema Potencial
```typescript
// ❌ Componente re-renderiza para QUALQUER mudança no store
function Header() {
  const store = useUIStore();  // ❌ Pega tudo
  return <div>{store.isSettingsOpen}</div>;
}
```

### ✅ Solução: Selectors
```typescript
// ✅ Re-renderiza apenas quando isSettingsOpen muda
function Header() {
  const isSettingsOpen = useUIStore(state => state.isSettingsOpen);
  return <div>{isSettingsOpen}</div>;
}
```

### 📊 Performance Check
```typescript
// Adicionar em desenvolvimento
const useUIStore = create<UIState>()(
  devtools((set) => ({
    // ... state
  }), { name: 'UIStore' })
);
```

---

## 5️⃣ Props Drilling de Stores

### ❌ Anti-pattern
```typescript
// ❌ Passar store como prop derrota o propósito
<ChatWindow useUIStore={useUIStore} />
```

### ✅ Pattern Correto
```typescript
// ✅ Importar diretamente onde precisa
function ChatWindow() {
  const { isSettingsOpen } = useUIStore();
}
```

---

## 6️⃣ Sincronização Store ↔ SWR

### ⚠️ Cuidado com Double Source of Truth
```typescript
// ❌ EVITAR: Dados duplicados
useChatStore { conversations: [...] }  // Store Zustand
useConversations() // SWR cache
// Qual é a fonte da verdade?
```

### ✅ Regra Clara
```typescript
// SWR = Source of truth de DADOS
useConversations() → lista de conversas

// Zustand = Source of truth de SELEÇÃO
useChatStore { selectedConversation }

// NÃO duplicar dados entre eles
```

### 🎯 Pattern Recomendado
```typescript
function Sidebar() {
  // Dados vêm do SWR
  const { conversations } = useConversations();
  
  // Seleção vem do Zustand
  const { selectedId, selectConversation } = useChatStore();
  
  // Derived state
  const selected = conversations.find(c => c.id === selectedId);
}
```

---

## 7️⃣ Estado Persistido Desnecessário

### ⚠️ Quando NÃO Persistir
```typescript
// ❌ Não persista estado temporário
persist(
  (set) => ({
    isSidebarOpen: true,        // ❌ Preferência UI
    draftMessage: "...",        // ❌ Temporário
    selectedConversation: {...} // ❌ Sessão
  })
)
```

### ✅ Quando Persistir
```typescript
// ✅ Persista apenas preferências duradouras
persist(
  (set) => ({
    theme: 'dark',           // ✅ Preferência
    language: 'pt-BR',       // ✅ Preferência
    sidebarWidth: 250,       // ✅ Preferência
  }),
  { name: 'user-preferences' }
)
```

---

## 📊 Métricas de Saúde da Arquitetura

### Checklist Mensal

```markdown
- [ ] Nenhum store com mais de 200 linhas
- [ ] UI state separado de domain state
- [ ] Máximo 3 fetches na sidebar
- [ ] Usando selectors em vez de store completo
- [ ] SWR como fonte de verdade de dados
- [ ] Zustand como fonte de verdade de seleção
- [ ] Sem estado duplicado entre stores
- [ ] Documentação atualizada
```

### Red Flags 🚩

Sinais de que a arquitetura está degradando:

1. **Store > 300 linhas** → Refatorar urgente
2. **Props drilling > 3 níveis** → Criar store
3. **useEffect sincronizando stores** → Redesign state
4. **Múltiplos fetches duplicados** → SWR cache incorreto
5. **Arquivos > 500 linhas** → Split components

---

## 🎓 Princípios Arquiteturais

### 1. Separation of Concerns
```
UI State → useUIStore
Domain State → useChatStore/useRoomStore
Server Data → SWR hooks
```

### 2. Colocation
```
Features buscam seus próprios dados.
Stores ficam perto do código que os usa.
```

### 3. Single Source of Truth
```
Nunca duplicar estado.
SWR = dados
Zustand = seleção/UI
```

### 4. Progressive Enhancement
```
Comece simples → useState
Cresce → Context
Complexo → Zustand
Crítico → External state manager
```

---

## 📚 Referências

- [Zustand Best Practices](https://github.com/pmndrs/zustand)
- [SWR Data Fetching](https://swr.vercel.app/)
- [State Colocation](https://kentcdodds.com/blog/state-colocation-will-make-your-react-app-faster)

---

**Última atualização:** March 8, 2026  
**Próxima revisão:** Quando houver 5+ stores
