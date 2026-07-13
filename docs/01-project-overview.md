# Visão geral do projeto

## O que é o AtenaAI Suporte

O AtenaAI Suporte é uma aplicação web composta por:
- frontend em Next.js com React e TypeScript
- backend em FastAPI com Python
- autenticação, perfis, salas de aula, chat e upload de avatar

## Stack principal

### Frontend
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- SWR, Zustand, Sonner

### Backend
- FastAPI
- SQLAlchemy
- Pydantic
- PostgreSQL via Docker

## Estrutura de diretórios importantes

- [frontend/app](../frontend/app) — rotas e páginas do App Router
- [frontend/components](../frontend/components) — componentes compartilhados
- [frontend/features](../frontend/features) — módulos por domínio (chat, student, teacher, auth)
- [frontend/lib](../frontend/lib) — contextos, API client e utilidades
- [backend/app](../backend/app) — aplicação FastAPI
- [backend/app/routes](../backend/app/routes) — rotas da API
- [backend/app/services](../backend/app/services) — lógica de negócio e arquivos

## Fluxos centrais

- autenticação e perfil do usuário
- upload/serviço de avatar
- chat e conversas
- gerenciamento de classrooms/salas
- integração com APIs internas e externas

## Observação importante

O projeto possui documentação histórica em arquivos na raiz do repositório. Esta pasta de docs serve como guia operacional e de entrada para agentes.
