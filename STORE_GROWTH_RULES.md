# 🚨 STORE GROWTH RULES - AtenaAI

## ⚠️ CRITICAL: 1 Domain = 1 Store

This is the **#1 rule** to prevent architecture decay.

---

## ❌ NEVER DO THIS

```typescript
// ❌ BAD: Mega store mixing multiple domains
useChatStore {
  // Chat domain
  selectedConversation
  draftMessage
  
  // ❌ Room domain (should be useRoomStore)
  selectedRoom
  roomMembers
  
  // ❌ Notification domain (should be useNotificationStore)
  notifications
  unreadCount
  
  // ❌ UI domain (should be useUIStore)
  sidebar
  settings
  theme
}
```

**Problems:**
- ❌ Hard to understand which domain you're in
- ❌ Changes in one domain affect unrelated code
- ❌ Testing becomes nightmare
- ❌ 500+ lines of code in one file
- ❌ Multiple developers conflict on same file

---

## ✅ ALWAYS DO THIS

```typescript
// ✅ GOOD: Focused stores per domain

// lib/stores/useUIStore.ts
useUIStore {
  isSidebarCollapsed
  isMobileSidebarOpen
  isSettingsOpen
}

// lib/stores/useChatStore.ts
useChatStore {
  selectedConversation
  draftMessage
}

// lib/stores/useRoomStore.ts (when needed)
useRoomStore {
  selectedRoom
  roomMembers
  roomSettings
}

// lib/stores/useNotificationStore.ts (when needed)
useNotificationStore {
  notifications
  unreadCount
}
```

**Benefits:**
- ✅ Clear domain boundaries
- ✅ Easy to find code
- ✅ Easy to test
- ✅ < 200 lines per store
- ✅ No git conflicts

---

## 📏 SIZE LIMITS

| Lines | Status | Action Required |
|-------|--------|-----------------|
| < 100 | ✅ Healthy | Continue |
| 100-150 | ⚠️ Watch | Review if can split |
| 150-200 | 🚨 Warning | Plan split now |
| > 200 | 🔥 Critical | **SPLIT IMMEDIATELY** |

---

## 🎯 WHEN TO CREATE A NEW STORE

### ✅ Create when:
1. **New domain** emerges (rooms, notifications, materials)
2. **Store hits 150+ lines**
3. **3+ components** need same domain state
4. **Multiple unrelated actions** in same store

### ❌ Don't create when:
1. Only 1 component needs the state → `useState`
2. Parent-child communication → props
3. Shared state in small tree → Context
4. Temporary/transient state → `useState`

---

## 🔍 HOW TO DETECT YOU NEED A SPLIT

### Red Flags 🚩

```typescript
// 🚩 Red Flag 1: Multiple domains in comments
useChatStore {
  // Chat state
  selectedConversation
  
  // Room state  ← DIFFERENT DOMAIN!
  selectedRoom
  
  // Settings   ← DIFFERENT DOMAIN!
  userPreferences
}
```

```typescript
// 🚩 Red Flag 2: Unrelated actions
useChatStore {
  selectConversation()
  sendMessage()
  
  // Room actions ← WRONG STORE!
  joinRoom()
  leaveRoom()
  
  // Settings actions ← WRONG STORE!
  updateTheme()
  changeLanguage()
}
```

```typescript
// 🚩 Red Flag 3: File too large
// useAppStore.ts - 347 lines ← SPLIT NOW!
```

---

## 📦 SPLITTING STRATEGY

### Before (Bad)
```
lib/stores/
  useChatStore.ts  (347 lines) ← TOO BIG!
```

### After (Good)
```
lib/stores/
  useChatStore.ts       (89 lines)  ← Chat only
  useRoomStore.ts       (67 lines)  ← Rooms only
  useNotificationStore.ts (45 lines) ← Notifications only
```

### Migration Steps

1. **Identify domains**
   ```bash
   # Review current store
   # Group by domain (chat, room, notification, etc)
   ```

2. **Create new store**
   ```bash
   cp lib/stores/useChatStore.ts lib/stores/useRoomStore.ts
   ```

3. **Move domain state**
   ```typescript
   // Move room-related state from useChatStore → useRoomStore
   ```

4. **Update imports**
   ```typescript
   // Change: import { useChatStore } from '@/lib/stores'
   // To:     import { useRoomStore } from '@/lib/stores'
   ```

5. **Test thoroughly**
   ```bash
   npm run build
   npm test
   ```

---

## 🎓 DOMAIN BOUNDARIES

### Current Domains

```
useUIStore → Pure UI state
├─ Sidebar visibility
├─ Modal states
└─ Panel states

useChatStore → Chat domain
├─ Selected conversation
└─ Draft message

# Future domains (create when needed):

useRoomStore → Room domain
├─ Selected room
├─ Room members
└─ Room settings

useNotificationStore → Notification domain
├─ Notifications list
└─ Unread count

useTeacherStore → Teacher-specific domain
├─ Selected student
└─ Assignment state

useAdminStore → Admin-specific domain
├─ User management
└─ System settings
```

---

## 🧪 TESTING DOMAIN SEPARATION

### Good Test: Each store is independent

```typescript
// ✅ Can test chat without touching rooms
describe('useChatStore', () => {
  it('selects conversation', () => {
    const { selectConversation } = useChatStore.getState();
    selectConversation(mockConversation);
    expect(useChatStore.getState().selectedConversation).toBe(mockConversation);
  });
});

// ✅ Can test rooms without touching chat
describe('useRoomStore', () => {
  it('joins room', () => {
    const { joinRoom } = useRoomStore.getState();
    joinRoom(mockRoom);
    expect(useRoomStore.getState().selectedRoom).toBe(mockRoom);
  });
});
```

### Bad Test: Stores are coupled

```typescript
// ❌ BAD: Testing chat requires room setup
describe('useChatStore', () => {
  it('selects conversation', () => {
    // ❌ Why do I need to setup room for chat test?
    useChatStore.getState().selectRoom(mockRoom);
    
    const { selectConversation } = useChatStore.getState();
    selectConversation(mockConversation);
  });
});
```

---

## 📊 CURRENT STORE HEALTH

Check monthly:

```bash
# Count lines in each store
wc -l lib/stores/*.ts lib/hooks/useAppUI.ts

# Current status (March 8, 2026):
# useUIStore.ts:    ~60 lines  ✅ Healthy
# useChatStore.ts:  ~45 lines  ✅ Healthy
```

---

## 🚦 DECISION TREE

```
Need shared state?
├─ YES
│   └─ One component?
│       ├─ YES → useState
│       └─ NO → Continue
│           └─ Parent-child?
│               ├─ YES → props
│               └─ NO → Continue
│                   └─ Same feature?
│                       ├─ YES → Context
│                       └─ NO → Continue
│                           └─ Multiple domains?
│                               ├─ YES → Multiple stores
│                               └─ NO → Single store
└─ NO → Don't create store
```

---

## 📝 CHECKLIST BEFORE ADDING TO STORE

Before adding state to a store, ask:

- [ ] Is this the correct domain for this state?
- [ ] Would this push the store over 150 lines?
- [ ] Is this truly global state?
- [ ] Can this be in a more specific store?
- [ ] Is this UI state or domain state?

If ANY answer is wrong, reconsider!

---

## 🔗 RELATED DOCS

- [VIGILANCIA_ARQUITETURA.md](../VIGILANCIA_ARQUITETURA.md) - Full vigilance guide
- [ARCHITECTURE_REFACTOR.md](../ARCHITECTURE_REFACTOR.md) - Refactor documentation
- [conversationActions.ts](../../features/conversations/actions/conversationActions.ts) - Sync patterns

---

## ⚡️ QUICK REFERENCE

```typescript
// ✅ DO: Focused stores
useUIStore      → UI state
useChatStore    → Chat domain
useRoomStore    → Room domain

// ❌ DON'T: Mega stores
useAppStore     → Everything (BAD!)
```

**Golden Rule:**
> If your store has more than one comment separating sections by domain, you need multiple stores.

---

**Last Updated:** March 8, 2026  
**Review:** Monthly or when adding 5th store
