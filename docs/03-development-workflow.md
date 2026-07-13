# Fluxo de desenvolvimento

## Setup inicial

### Frontend
- entrar na pasta [frontend](../frontend)
- instalar dependências com `npm install`
- rodar em desenvolvimento com `npm run dev`
- validar build com `npm run build`

### Backend
- entrar na pasta [backend](../backend)
- usar ambiente virtual Python ou Docker
- rodar a aplicação conforme documentação local ou o fluxo Docker do projeto

## Docker

O projeto possui comandos prontos no [Makefile](../Makefile):
- `make help`
- `make up`
- `make down`
- `make logs`
- `make build`
- `make health`

## Validação recomendada antes de finalizar

Antes de encerrar uma tarefa, verificar:
1. build do frontend sem erros
2. impacto em rotas e componentes afetados
3. compatibilidade com `NEXT_PUBLIC_API_URL`
4. comportamento de upload/avatar e autenticação
5. regressões em telas relacionadas

## Fluxo de trabalho sugerido para agentes

1. entender o problema
2. localizar os arquivos relevantes
3. reproduzir ou validar o comportamento
4. implementar a menor correção possível
5. validar com build ou teste relevante
6. documentar a mudança se ela alterar fluxo importante
