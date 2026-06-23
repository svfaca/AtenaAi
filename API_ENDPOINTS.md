# API Endpoints Reference

## Architecture Flow

```
Frontend
   ↓ fetch('/api/*')
Next.js API Route
   ↓ proxy()
Backend (/api/v1/*)
```

---

## ✅ Available Endpoints

### Authentication

| Endpoint | Method | File | Backend |
|----------|--------|------|---------|
| `/api/auth/me` | GET | `app/api/auth/me/route.ts` | `/api/v1/auth/me` |
| `/api/auth/login` | POST | `app/api/auth/login/route.ts` | `/api/v1/auth/login` |
| `/api/auth/signup` | POST | `app/api/auth/signup/route.ts` | `/api/v1/auth/register` |
| `/api/auth/logout` | POST | `app/api/auth/logout/route.ts` | *(local cookie clear)* |
| `/api/auth/refresh` | POST | `app/api/auth/refresh/route.ts` | `/api/v1/auth/refresh` |
| `/api/auth/check-email` | POST | `app/api/auth/check-email/route.ts` | `/api/v1/auth/check-email` |

### Conversations

| Endpoint | Method | File | Backend |
|----------|--------|------|---------|
| `/api/conversations` | GET | `app/api/conversations/route.ts` | `/api/v1/conversations/` |
| `/api/conversations` | POST | `app/api/conversations/route.ts` | `/api/v1/conversations/` |
| `/api/conversations/[id]` | GET | `app/api/conversations/[id]/route.ts` | `/api/v1/conversations/[id]` |
| `/api/conversations/[id]` | PATCH | `app/api/conversations/[id]/route.ts` | `/api/v1/conversations/[id]` |
| `/api/conversations/[id]` | DELETE | `app/api/conversations/[id]/route.ts` | `/api/v1/conversations/[id]` |
| `/api/conversations/[id]/messages/stream` | POST | `app/api/conversations/[id]/messages/stream/route.ts` | `/api/v1/conversations/[id]/messages/stream` |

### Chat (Generic)

| Endpoint | Method | File | Backend |
|----------|--------|------|---------|
| `/api/chat` | POST | `app/api/chat/route.ts` | `/api/v1/chat` |
| `/api/chat/stream` | POST | `app/api/chat/stream/route.ts` | `/api/v1/chat/stream` |

### Chat (Public)

| Endpoint | Method | File | Backend |
|----------|--------|------|---------|
| `/api/chat/public` | POST | `app/api/chat/public/route.ts` | `/api/v1/chat/` |
| `/api/chat/public/stream` | POST | `app/api/chat/public/stream/route.ts` | `/api/v1/chat/stream` |

### User

| Endpoint | Method | File | Backend |
|----------|--------|------|---------|
| `/api/user/update` | PUT | `app/api/user/update/route.ts` | `/api/v1/auth/update-profile` |
| `/api/user/update` | POST | `app/api/user/update/route.ts` | `/api/v1/auth/update-profile` |
| `/api/user/delete` | DELETE | `app/api/user/delete/route.ts` | `/api/v1/auth/delete-account` |

### Classrooms

| Endpoint | Method | File | Backend |
|----------|--------|------|---------|
| `/api/classrooms` | GET | `app/api/classrooms/route.ts` | `/api/v1/classrooms` or `/api/v1/classrooms/my` |

---

## 📖 Usage Examples

### Authentication
```typescript
// Login
const res = await fetch('/api/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email, password })
})

// Get current user
const user = await fetch('/api/auth/me')

// Logout
await fetch('/api/auth/logout', { method: 'POST' })
```

### Conversations
```typescript
// List conversations
const convos = await fetch('/api/conversations')

// Create conversation
const newConvo = await fetch('/api/conversations', {
  method: 'POST',
  body: JSON.stringify({ title: 'New Chat' })
})

// Get conversation details
const convo = await fetch(`/api/conversations/${id}`)

// Update conversation
await fetch(`/api/conversations/${id}`, {
  method: 'PATCH',
  body: JSON.stringify({ title: 'Updated' })
})

// Delete conversation
await fetch(`/api/conversations/${id}`, { method: 'DELETE' })
```

### Chat (Public Streaming)
```typescript
// Stream response token by token
const response = await fetch('/api/chat/public/stream', {
  method: 'POST',
  body: JSON.stringify({
    messages: [{ role: 'user', content: 'Hello' }]
  })
})

const reader = response.body.getReader()
// Read SSE chunks...
```

### User Management
```typescript
// Update profile (with file upload)
const formData = new FormData()
formData.append('name', 'New Name')
formData.append('avatar', file)

await fetch('/api/user/update', {
  method: 'PUT',
  body: formData
})

// Delete account
await fetch('/api/user/delete', { method: 'DELETE' })
```

---

## 🔄 Special Features

### Streaming (SSE)
- Endpoints: `/api/chat/stream`, `/api/chat/public/stream`, `/api/conversations/[id]/messages/stream`
- Returns: `text/event-stream`
- Use: `consumeStreamChat()` from `@/lib/api/stream-chat`

### File Upload
- Endpoints: `/api/user/update` (PUT/POST)
- Use: FormData
- Proxy: Preserves multipart/form-data

### Authentication
- Method: Cookie-based (HttpOnly)
- Cookie: Automatically forwarded from client to backend
- Headers: Managed transparently

### Role-Based Routing
- Endpoint: `/api/classrooms`
- Logic: Determines user role from `/api/auth/me`
- Routes: `/api/v1/classrooms` (teacher) or `/api/v1/classrooms/my` (student)

---

## 🛡️ Security Features

✅ All cookies automatically forwarded  
✅ HttpOnly cookies preserved  
✅ Credentials always included  
✅ No sensitive data in URLs  
✅ Uniform error handling  
✅ No CORS issues  

---

## 📚 Related Files

- Proxy utility: `frontend/lib/server/proxy.ts`
- API client: `frontend/lib/api/client.ts`
- Stream consumer: `frontend/lib/api/stream-chat.ts`
- Environment: Use `NEXT_PUBLIC_API_URL` in `.env.local`

---

**Last Updated**: March 8, 2026
