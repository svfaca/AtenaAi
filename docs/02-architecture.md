# Arquitetura do sistema

## Arquitetura geral

A aplicação segue uma separação clara entre:
- frontend: renderização, estado de UI e integração com a API
- backend: autenticação, regras de negócio e persistência
- storage: arquivos de avatar em pasta local do backend

## Frontend

### Padrões principais
- uso do App Router do Next.js
- componentes em TypeScript
- módulos por feature em [frontend/features](../frontend/features)
- contextos e providers em [frontend/lib/contexts](../frontend/lib/contexts) e [frontend/components/context](../frontend/components/context)

### Pontos importantes
- componentes reutilizáveis ficam em [frontend/components](../frontend/components)
- lógica de domínio deve preferencialmente ficar em features específicas
- o diretório [frontend/_legacy](../frontend/_legacy) contém código antigo e deve ser evitado para mudanças novas, salvo necessidade explícita

## Backend

### Padrões principais
- rotas em [backend/app/routes](../backend/app/routes)
- modelos em [backend/app/models](../backend/app/models)
- schemas em [backend/app/schemas](../backend/app/schemas)
- serviços em [backend/app/services](../backend/app/services)

### Fluxo de avatar
- upload de avatar é tratado em rotas de usuários
- arquivos são salvos em [backend/storage/avatars](../backend/storage/avatars)
- o frontend consome a URL retornada pelo backend, normalmente como caminho relativo à API

## Integração frontend/backend

O frontend normalmente usa:
- variáveis de ambiente como `NEXT_PUBLIC_API_URL`
- endpoints internos via Next.js route handlers em [frontend/app/api](../frontend/app/api)
- client HTTP direto em libs e services

## Boas práticas de arquitetura

- manter lógica de negócio no backend
- evitar acoplamento entre features diferentes
- preferir componentes pequenos e reutilizáveis
- documentar mudanças que alterem o fluxo de autenticação, avatar ou chat
