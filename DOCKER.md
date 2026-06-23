# 🐳 Docker - AtenaAI

## 📋 Pré-requisitos

- [Docker](https://www.docker.com/get-started) instalado
- [Docker Compose](https://docs.docker.com/compose/install/) instalado

## 🚀 Início Rápido

### 1. Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.docker .env

# Editar .env e adicionar sua OPENAI_API_KEY
```

### 2. Iniciar Aplicação

```bash
# Desenvolvimento (com hot-reload)
docker-compose up

# Ou em background
docker-compose up -d

# Ver logs
docker-compose logs -f
```

### 3. Acessar

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **PostgreSQL**: localhost:5432

## 🛠️ Comandos Úteis

### Gerenciamento

```bash
# Parar containers
docker-compose down

# Parar e remover volumes (limpa banco de dados)
docker-compose down -v

# Rebuild das imagens
docker-compose build

# Rebuild forçado (sem cache)
docker-compose build --no-cache

# Ver status dos containers
docker-compose ps
```

### Logs

```bash
# Ver logs de todos os serviços
docker-compose logs -f

# Ver logs de um serviço específico
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
```

### Executar Comandos

```bash
# Entrar no container do backend
docker-compose exec backend sh

# Executar comando no backend
docker-compose exec backend python scripts/run_data_migrations.py

# Entrar no PostgreSQL
docker-compose exec db psql -U atenaai -d atenaai
```

## 🏗️ Modo Produção

### 1. Atualizar .env

```env
BUILD_TARGET=production
ENVIRONMENT=production
NODE_ENV=production
SECRET_KEY=<use: openssl rand -hex 32>
POSTGRES_PASSWORD=<senha-forte-aqui>
```

### 2. Build e Deploy

```bash
# Build para produção
docker-compose build --build-arg BUILD_TARGET=production

# Subir em produção
docker-compose up -d
```

## 📦 Estrutura

```
AtenaAI/
├── backend/
│   ├── Dockerfile          # Multi-stage build (dev + prod)
│   └── .dockerignore
├── frontend/
│   ├── Dockerfile          # Multi-stage build (dev + prod)
│   └── .dockerignore
├── docker-compose.yml      # Orquestração dos serviços
└── .env.docker            # Template de variáveis
```

## 🔧 Configuração Avançada

### Portas Customizadas

Edite no `.env`:

```env
BACKEND_PORT=8001
FRONTEND_PORT=3001
POSTGRES_PORT=5433
```

### Banco de Dados Externo

Se quiser usar um PostgreSQL externo, remova o serviço `db` do `docker-compose.yml` e configure:

```env
DATABASE_URL=postgresql://user:pass@host:5432/dbname
```

### Volumes

Os dados são persistidos em volumes Docker:
- `postgres_data`: Dados do PostgreSQL
- `backend_uploads`: Arquivos enviados ao backend

## 🐛 Troubleshooting

### Container não inicia

```bash
# Ver logs detalhados
docker-compose logs backend

# Rebuild completo
docker-compose down -v
docker-compose build --no-cache
docker-compose up
```

### Erro de permissão (uploads)

```bash
# Entrar no container
docker-compose exec backend sh

# Verificar/criar diretório
mkdir -p /app/uploads
chmod 755 /app/uploads
```

### Banco de dados não conecta

```bash
# Verificar se PostgreSQL está rodando
docker-compose ps db

# Ver logs do PostgreSQL
docker-compose logs db

# Testar conexão manual
docker-compose exec db pg_isready -U atenaai
```

### Hot-reload não funciona (Windows)

No Windows, o hot-reload pode ser lento devido ao WSL2. Considere:
- Usar Docker Desktop com WSL2
- Mover projeto para dentro do WSL2 (`\\wsl$\Ubuntu\home\user\`)

## 📊 Monitoramento

### Health Checks

Os containers têm health checks configurados:

```bash
# Ver status de saúde
docker-compose ps

# Testar manualmente
curl http://localhost:8000/health
curl http://localhost:3000
```

## 🔒 Segurança

### Em Produção:

1. ✅ Usar `SECRET_KEY` forte (min 32 chars)
2. ✅ Senha forte para PostgreSQL
3. ✅ Não expor porta do banco publicamente
4. ✅ Usar HTTPS (reverse proxy como Nginx/Caddy)
5. ✅ Configurar variáveis de ambiente seguras
6. ✅ Executar containers como usuário não-root (já configurado)

## 📚 Recursos

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Best Practices](https://docs.docker.com/develop/dev-best-practices/)
