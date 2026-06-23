# 🔧 MINIMAL CODE PATCHES - AtenaAI

## ⚡ Quick Fix Summary

**Critical Bug:** ChatWindow.tsx is missing the useChatStore hook call  
**Impact:** Authenticated chat completely broken  
**Time to Fix:** 5 minutes  
**Risk Level:** LOW (fixing broken code)

---

## 🎯 PATCH 1: Fix ChatWindow.tsx (CRITICAL)

### File: `frontend/features/chat/components/ChatWindow.tsx`

#### Change 1: Fix Import Statement (Line 7)

**BEFORE:**
```typescript
import { useChatStore } from '@/lib/stores/useChatStore
```

**AFTER:**
```typescript
import { useChatStore } from '@/lib/stores/useChatStore'
```

**Reason:** Missing closing quote causes import to work (module resolution) but looks incomplete.

---

#### Change 2: Add Hook Call (After Line 41)

**BEFORE:**
```typescript
export default function ChatWindow() {
  // Fetch messages for selected conversation
  const { messages, conversation: conversationData, mutate } = useConversationMessages(
    selectedConversationId  // ❌ UNDEFINED - never declared!
  )
```

**AFTER:**
```typescript
export default function ChatWindow() {
  // Get selected conversation ID from Zustand store
  const { selectedConversationId, selectConversation } = useChatStore()
  
  // Fetch messages for selected conversation
  const { messages, conversation: conversationData, mutate } = useConversationMessages(
    selectedConversationId
  )
```

**Reason:** 
- `selectedConversationId` is used but never declared
- `selectConversation` is called on line 93 but never declared
- Must destructure from `useChatStore()` hook

---

### Complete Patch for ChatWindow.tsx

```diff
--- a/frontend/features/chat/components/ChatWindow.tsx
+++ b/frontend/features/chat/components/ChatWindow.tsx
@@ -4,7 +4,7 @@ import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
 import { toast } from 'sonner'
 import { useSWRConfig } from 'swr'
 import { api } from '@/lib/api'
-import { useChatStore } from '@/lib/stores/useChatStore
+import { useChatStore } from '@/lib/stores/useChatStore'
 import { useConversationMessages } from '../hooks/useConversationMessages'
 import type { Message, Conversation } from '@/lib/types'
 import TypingIndicator from './TypingIndicator'
@@ -38,6 +38,9 @@ function toConversationId(value: unknown): number | null {
  * - ALWAYS render input (even when no conversation selected)
  */
 export default function ChatWindow() {
+  // Get selected conversation ID from Zustand store
+  const { selectedConversationId, selectConversation } = useChatStore()
+  
   // Fetch messages for selected conversation
   const { messages, conversation: conversationData, mutate } = useConversationMessages(
     selectedConversationId
```

---

## 🧪 TESTING THE FIX

### Step 1: Apply the Patch

```bash
cd frontend/features/chat/components
# Edit ChatWindow.tsx with the changes above
```

### Step 2: Verify TypeScript Compilation

```bash
cd frontend
npm run build
```

**Expected:** No TypeScript errors

### Step 3: Manual Testing

**Test Case 1: Create New Conversation**

1. Login as a student
2. Navigate to `/scholar` or `/` (if logged)
3. Component should render without errors
4. Type message: "Olá, meu nome é João"
5. Click "Enviar"
6. **Expected Results:**
   - New conversation is created automatically
   - Message is sent successfully
   - AI responds (wait a few seconds)
   - Your message and AI response appear in chat
   - Conversation appears in sidebar (if visible)

**Test Case 2: AI Personalization**

1. Send message: "Qual é o meu nome?"
2. **Expected Result:** AI responds with YOUR actual name from profile (not "Visitante")

**Test Case 3: Conversation Persistence**

1. Refresh the page
2. Navigate back to chat
3. **Expected Result:** Conversation and messages are still there (fetched from backend)

**Test Case 4: Multiple Messages**

1. Send several messages in a row
2. **Expected Results:**
   - All messages appear
   - AI responds to each
   - Conversation history builds up
   - No errors in console

---

## 🔍 VERIFICATION CHECKLIST

After applying the patch, confirm:

- [ ] **TypeScript compiles** without errors
- [ ] **No console errors** when loading page
- [ ] **Can send first message** (creates conversation)
- [ ] **AI responds with personalized greeting** (uses user's name)
- [ ] **Can send follow-up messages**
- [ ] **Conversation persists** after refresh
- [ ] **Can create new conversation** (if feature exists)
- [ ] **No rate limit errors** for authenticated users

---

## 🐛 WHAT IF IT STILL DOESN'T WORK?

### Issue: AI still calls me "Visitante"

**Possible Causes:**
1. User profile incomplete (no name set)
2. Backend not receiving user context
3. Cookie not being sent with request

**Debug Steps:**
```typescript
// Add to ChatWindow.tsx temporarily:
import { useAuth } from '@/features/auth'

export default function ChatWindow() {
  const { user } = useAuth()
  console.log('Current user:', user)  // Check if user data exists
  
  // ... rest of code
```

**Check Backend Logs:**
```bash
cd backend
# Look for the user_name being passed to generate_ai_response
# Should see: user_name="João" not user_name="Visitante"
```

---

### Issue: "Cannot read properties of undefined" error

**Possible Cause:** useChatStore() returning undefined

**Debug Steps:**
```typescript
// Check if store is working:
const store = useChatStore()
console.log('Store:', store)  // Should show { selectedConversationId, selectConversation }

if (!store) {
  console.error('useChatStore not initialized!')
}
```

**Fix:** Check `frontend/lib/stores/useChatStore.ts` exists and exports correctly

---

### Issue: Conversation not created on first message

**Possible Cause:** API route or backend issue

**Debug Steps:**
```typescript
// In handleSubmit, add logging:
const createResponse = await api<ConversationCreateResponse>('/api/conversations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ title: 'Nova conversa' }),
})

console.log('Create response:', createResponse)  // Check the response structure

const createdConversationId = toConversationId(createResponse)
console.log('Parsed conversation ID:', createdConversationId)  // Should be a number
```

**Check Network Tab:**
- Look for POST request to `/api/conversations`
- Check response status (should be 200 or 201)
- Check response body has `id` field

---

## 🎓 WHY THIS BUG HAPPENED

### Root Cause Analysis

1. **Missing Code:** The hook call was never written (incomplete implementation)
2. **TypeScript Didn't Catch It:** Because variables were used but never declared, TS should have errored but didn't (possibly due to `any` types somewhere)
3. **No Tests:** Component likely has no tests that would have caught this
4. **No Code Review:** Change merged without review

### How to Prevent

1. **Add ESLint Rule:**
```json
// .eslintrc.json
{
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

2. **Add Component Test:**
```typescript
// ChatWindow.test.tsx
import { render } from '@testing-library/react'
import ChatWindow from './ChatWindow'

jest.mock('@/lib/stores/useChatStore')

test('should call useChatStore hook', () => {
  const mockStore = {
    selectedConversationId: null,
    selectConversation: jest.fn()
  }
  
  require('@/lib/stores/useChatStore').useChatStore.mockReturnValue(mockStore)
  
  render(<ChatWindow />)
  
  expect(require('@/lib/stores/useChatStore').useChatStore).toHaveBeenCalled()
})
```

3. **Add Pre-Commit Hook:**
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run type-check && npm run lint"
    }
  }
}
```

---

## 📊 EXPECTED OUTCOME

### Before Patch
```
User → ChatWindow → selectedConversationId is undefined
                 → useConversationMessages(undefined)
                 → SWR doesn't fetch (null key)
                 → messages = []
                 → User sees empty chat
                 → Tries to send message
                 → selectConversation() is undefined
                 → Error thrown
                 → Message not sent
```

### After Patch
```
User → ChatWindow → useChatStore() called
                 → { selectedConversationId: null, selectConversation: fn }
                 → useConversationMessages(null)
                 → SWR doesn't fetch (null key) ✅
                 → messages = []
                 → User sees "Start new conversation" ✅
                 → User sends message
                 → Conversation created ✅
                 → selectConversation({ id: 123 }) ✅
                 → selectedConversationId = 123 ✅
                 → Message sent ✅
                 → AI responds ✅
                 → UI updates ✅
```

---

## 🚀 DEPLOYMENT

### Step 1: Test Locally

```bash
cd frontend
npm run dev

# Open browser to http://localhost:3000
# Test the fix manually
```

### Step 2: Commit Changes

```bash
git add frontend/features/chat/components/ChatWindow.tsx
git commit -m "fix(chat): add missing useChatStore hook call in ChatWindow

- Fix incomplete import statement (add closing quote)
- Add useChatStore() hook call to get selectedConversationId
- Fixes authenticated chat functionality
- Fixes conversation creation
- Fixes AI personalization

Closes #BUG-123"
```

### Step 3: Deploy

```bash
# If using Vercel:
vercel deploy --prod

# If using custom deployment:
npm run build
# Deploy dist/ folder to your hosting
```

### Step 4: Verify in Production

1. Login to production site
2. Navigate to chat
3. Send a test message
4. Verify AI personalization works
5. Check production logs for errors

---

## ✅ SUCCESS CRITERIA

The patch is successful when:

1. ✅ TypeScript compiles without errors
2. ✅ Component renders without console errors
3. ✅ User can send messages
4. ✅ Conversations are created automatically
5. ✅ AI uses user's actual name (not "Visitante")
6. ✅ Message history persists
7. ✅ No rate limit errors for authenticated users
8. ✅ Production metrics show:
   - Message send success rate > 95%
   - Conversation creation rate > 50%
   - Error rate < 1%

---

**Estimated Implementation Time:** 5-10 minutes  
**Estimated Testing Time:** 15-20 minutes  
**Total Time:** 30 minutes maximum  
**Risk Level:** LOW  
**Impact:** HIGH (unblocks authenticated chat)

---

**Document Version:** 1.0  
**Date:** 2026-03-08  
**Status:** Ready to Apply  
**Priority:** CRITICAL - Apply Immediately
