# 📡 Streaming Routes - Documentação

## Status Atual

### ✅ Rotas Implementadas
- `/api/chat/stream` - Chat com streaming para usuários **autenticados**
- `/api/chat/public/stream` - Chat com streaming para usuários **não autenticados**

### ⚠️ Status de Uso
Atualmente, as rotas de streaming **não estão sendo utilizadas** na UI.

**Rotas ativas na UI:**
- `/api/chat/public` - Chat público (sem streaming)
- `/api/chat` - Chat autenticado (sem streaming)

## 🔮 Uso Futuro

As rotas de streaming estão prontas para serem habilitadas quando necessário. Para usar:

### No Frontend

```typescript
// Exemplo de chamada com streaming
const response = await fetch('/api/chat/public/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Olá!',
    history: messages,
  }),
});

const reader = response.body?.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      // Processar token recebido
      console.log(data);
    }
  }
}
```

## 🎯 Quando Habilitar Streaming

Benefícios:
- ✅ Resposta mais rápida percebida pelo usuário
- ✅ Melhor UX em conversas longas
- ✅ Feedback visual token por token

Considerar:
- ⚠️ Maior complexidade no código frontend
- ⚠️ Necessário gerenciar estado de streaming
- ⚠️ Necessário componente de "digitando" animado

## 📋 Decisão Atual

**Mantemos as rotas no código, mas sem uso ativo.**

Motivo: Simplicidade na implementação inicial. A infraestrutura está pronta para quando quisermos adicionar streaming como feature.
