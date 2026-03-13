# Stores - State Management

Global state management using Zustand with domain separation.

---

## 🎯 Architecture Principle

**1 Domain = 1 Store**

We maintain focused, single-responsibility stores to prevent "mega store" anti-pattern.

---

## 📦 Current Stores

### useUIStore
**Location:** `lib/hooks/useAppUI.ts`  
**Domain:** Pure UI state  
**Size:** ~60 lines ✅

**Manages:**
- Sidebar collapsed/open
- Mobile sidebar visibility
- Settings panel open/closed

**Example:**
```typescript
import { useUIStore } from '@/lib/stores';

const { isSidebarCollapsed, toggleSidebar } = useUIStore();
```

---

### useChatStore
**Location:** `lib/stores/useChatStore.ts`  
**Domain:** Chat  
**Size:** ~45 lines ✅

**Manages:**
- Selected conversation
- Draft message (unsent text)

**Example:**
```typescript
import { useChatStore } from '@/lib/stores';

const { selectedConversation, selectConversation } = useChatStore();
```

---

## 🚀 Future Stores

Create these when needed (see [STORE_GROWTH_RULES.md](../../STORE_GROWTH_RULES.md)):

### useRoomStore (Not created yet)
**When to create:** When room features grow > 100 lines or need global state

**Would manage:**
- Selected room
- Room members
- Room settings

### useNotificationStore (Not created yet)
**When to create:** When implementing notifications feature

**Would manage:**
- Notifications list
- Unread count
- Notification preferences

---

## 📏 Size Limits

| Lines | Status | Action |
|-------|--------|--------|
| < 100 | ✅ Healthy | Continue |
| 100-150 | ⚠️ Watch | Consider split |
| 150-200 | 🚨 Warning | Plan split now |
| > 200 | 🔥 Critical | **SPLIT IMMEDIATELY** |

**Current status:** All stores < 100 lines ✅

---

## 🎓 Usage Guidelines

### ✅ DO
```typescript
// Import from barrel export
import { useUIStore, useChatStore } from '@/lib/stores';

// Use selectors to prevent re-renders
const isSidebarOpen = useUIStore(state => state.isSidebarCollapsed);

// Access in component
function MyComponent() {
  const { selectConversation } = useChatStore();
}
```

### ❌ DON'T
```typescript
// Don't pass store as prop
<ChatWindow store={useChatStore} />

// Don't grab entire store if you only need one value
const store = useUIStore(); // Re-renders on ANY change
const isOpen = store.isSidebarOpen;
```

---

## 🔄 Sync Patterns

### UI State (No API)
```typescript
// Just update store, UI updates automatically
const { toggleSidebar } = useUIStore();
toggleSidebar();
```

### Domain State (With API)
```typescript
// Use actions from conversationActions.ts
import { deleteConversation } from '@/features/conversations/actions/conversationActions';

const { mutate } = useSWRConfig();
await deleteConversation(id, mutate);
// ↑ Handles: API + SWR + Zustand + UI sync
```

See [conversationActions.ts](../../../features/conversations/actions/conversationActions.ts) for full patterns.

---

## 📊 Health Monitoring

Check monthly:

```bash
# Count lines in stores
wc -l lib/stores/*.ts lib/hooks/useAppUI.ts

# Search for domain mixing
grep -n "TODO\|FIXME\|WRONG" lib/stores/*.ts
```

---

## 📚 Documentation

- **Full rules:** [STORE_GROWTH_RULES.md](../../STORE_GROWTH_RULES.md)
- **Sync patterns:** [conversationActions.ts](../../../features/conversations/actions/conversationActions.ts)
- **Examples:** [SidebarWithActions.example.tsx](../../../features/conversations/examples/SidebarWithActions.example.tsx)
- **Quick start:** [QUICK_START_HANDLERS.md](../../QUICK_START_HANDLERS.md)

---

## 🚦 Decision Tree: When to Use What?

```
Need shared state?
├─ One component only?
│   └─ Use useState
├─ Parent-child communication?
│   └─ Use props
├─ Same feature tree?
│   └─ Use Context
└─ Cross-feature global state?
    ├─ UI state?
    │   └─ Use useUIStore
    ├─ Chat domain?
    │   └─ Use useChatStore
    ├─ Room domain?
    │   └─ Create useRoomStore (if doesn't exist)
    └─ Other domain?
        └─ Create new focused store
```

---

**Last updated:** March 8, 2026  
**Review:** Monthly or when adding 5th store
