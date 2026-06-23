# ====================================
# Makefile para AtenaAI Docker
# ====================================
# Uso: make [comando]
# Windows: Instalar make via Chocolatey ou usar Git Bash

.PHONY: help build up down restart logs clean dev prod

# Variáveis
COMPOSE=docker-compose
COMPOSE_PROD=$(COMPOSE) -f docker-compose.yml -f docker-compose.prod.yml

# ====================================
# Help
# ====================================
help: ## Mostra esta ajuda
	@echo "AtenaAI - Comandos Docker disponíveis:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

# ====================================
# Desenvolvimento
# ====================================
dev: ## Inicia em modo desenvolvimento
	$(COMPOSE) up

dev-build: ## Build e inicia em desenvolvimento
	$(COMPOSE) up --build

dev-bg: ## Inicia em background (desenvolvimento)
	$(COMPOSE) up -d

# ====================================
# Produção
# ====================================
prod: ## Inicia em modo produção
	$(COMPOSE_PROD) up -d

prod-build: ## Build e inicia em produção
	$(COMPOSE_PROD) up --build -d

# ====================================
# Gerenciamento
# ====================================
up: ## Sobe os containers
	$(COMPOSE) up -d

down: ## Para os containers
	$(COMPOSE) down

restart: ## Reinicia os containers
	$(COMPOSE) restart

stop: ## Para os containers (sem remover)
	$(COMPOSE) stop

# ====================================
# Build
# ====================================
build: ## Build das imagens
	$(COMPOSE) build

build-nc: ## Build sem cache
	$(COMPOSE) build --no-cache

# ====================================
# Logs
# ====================================
logs: ## Ver logs (todos os serviços)
	$(COMPOSE) logs -f

logs-backend: ## Ver logs do backend
	$(COMPOSE) logs -f backend

logs-frontend: ## Ver logs do frontend
	$(COMPOSE) logs -f frontend

logs-db: ## Ver logs do banco
	$(COMPOSE) logs -f db

# ====================================
# Limpeza
# ====================================
clean: ## Para e remove containers, networks e volumes
	$(COMPOSE) down -v

clean-all: ## Remove tudo (containers, volumes, imagens)
	$(COMPOSE) down -v --rmi all

prune: ## Remove recursos Docker não utilizados
	docker system prune -af --volumes

# ====================================
# Acesso aos Containers
# ====================================
shell-backend: ## Acessa shell do backend
	$(COMPOSE) exec backend sh

shell-frontend: ## Acessa shell do frontend
	$(COMPOSE) exec frontend sh

shell-db: ## Acessa PostgreSQL
	$(COMPOSE) exec db psql -U atenaai -d atenaai

# ====================================
# Status
# ====================================
ps: ## Lista containers
	$(COMPOSE) ps

health: ## Verifica health dos serviços
	@echo "=== Backend Health ==="
	@curl -s http://localhost:8000/health || echo "Backend offline"
	@echo "\n=== Frontend Health ==="
	@curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || echo "Frontend offline"
	@echo "\n=== Database Health ==="
	@$(COMPOSE) exec db pg_isready -U atenaai || echo "Database offline"

# ====================================
# Backup
# ====================================
backup-db: ## Faz backup do banco de dados
	@mkdir -p backups
	@$(COMPOSE) exec -T db pg_dump -U atenaai atenaai | gzip > backups/atenaai_$$(date +%Y%m%d_%H%M%S).sql.gz
	@echo "Backup criado em backups/"

restore-db: ## Restaura backup do banco (uso: make restore-db FILE=backup.sql.gz)
	@gunzip < $(FILE) | $(COMPOSE) exec -T db psql -U atenaai atenaai

# ====================================
# Migrações
# ====================================
migrate: ## Executa migrações do banco
	$(COMPOSE) exec backend python scripts/run_data_migrations.py

# ====================================
# Setup Inicial
# ====================================
setup: ## Setup inicial (copia .env e sobe containers)
	@if [ ! -f .env ]; then cp .env.docker .env; echo ".env criado! Edite com sua OPENAI_API_KEY"; fi
	@$(COMPOSE) up -d
	@echo "AtenaAI iniciado! Acesse:"
	@echo "  Frontend: http://localhost:3000"
	@echo "  Backend:  http://localhost:8000/docs"
