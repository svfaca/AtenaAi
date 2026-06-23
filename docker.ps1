# ====================================
# Docker Helper Script para Windows
# ====================================
# Uso: .\docker.ps1 [comando]

param(
    [Parameter(Position=0)]
    [string]$Command = "help"
)

$COMPOSE = "docker-compose"
$COMPOSE_PROD = "$COMPOSE -f docker-compose.yml -f docker-compose.prod.yml"

function Show-Help {
    Write-Host "AtenaAI - Comandos Docker disponíveis:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Desenvolvimento:" -ForegroundColor Yellow
    Write-Host "  dev           Inicia em modo desenvolvimento"
    Write-Host "  dev-build     Build e inicia em desenvolvimento"
    Write-Host "  dev-bg        Inicia em background (desenvolvimento)"
    Write-Host ""
    Write-Host "Produção:" -ForegroundColor Yellow
    Write-Host "  prod          Inicia em modo produção"
    Write-Host "  prod-build    Build e inicia em produção"
    Write-Host ""
    Write-Host "Gerenciamento:" -ForegroundColor Yellow
    Write-Host "  up            Sobe os containers"
    Write-Host "  down          Para os containers"
    Write-Host "  restart       Reinicia os containers"
    Write-Host "  stop          Para os containers (sem remover)"
    Write-Host "  ps            Lista containers"
    Write-Host ""
    Write-Host "Build:" -ForegroundColor Yellow
    Write-Host "  build         Build das imagens"
    Write-Host "  build-nc      Build sem cache"
    Write-Host ""
    Write-Host "Logs:" -ForegroundColor Yellow
    Write-Host "  logs          Ver logs (todos)"
    Write-Host "  logs-backend  Ver logs do backend"
    Write-Host "  logs-frontend Ver logs do frontend"
    Write-Host "  logs-db       Ver logs do banco"
    Write-Host ""
    Write-Host "Limpeza:" -ForegroundColor Yellow
    Write-Host "  clean         Para e remove containers/volumes"
    Write-Host "  clean-all     Remove tudo (incluindo imagens)"
    Write-Host "  prune         Remove recursos não utilizados"
    Write-Host ""
    Write-Host "Acesso:" -ForegroundColor Yellow
    Write-Host "  shell-backend Acessa shell do backend"
    Write-Host "  shell-frontend Acessa shell do frontend"
    Write-Host "  shell-db      Acessa PostgreSQL"
    Write-Host ""
    Write-Host "Utilidades:" -ForegroundColor Yellow
    Write-Host "  health        Verifica health dos serviços"
    Write-Host "  backup-db     Faz backup do banco"
    Write-Host "  migrate       Executa migrações"
    Write-Host "  setup         Setup inicial"
}

switch ($Command) {
    # Desenvolvimento
    "dev" { Invoke-Expression "$COMPOSE up" }
    "dev-build" { Invoke-Expression "$COMPOSE up --build" }
    "dev-bg" { Invoke-Expression "$COMPOSE up -d" }

    # Produção
    "prod" { Invoke-Expression "$COMPOSE_PROD up -d" }
    "prod-build" { Invoke-Expression "$COMPOSE_PROD up --build -d" }

    # Gerenciamento
    "up" { Invoke-Expression "$COMPOSE up -d" }
    "down" { Invoke-Expression "$COMPOSE down" }
    "restart" { Invoke-Expression "$COMPOSE restart" }
    "stop" { Invoke-Expression "$COMPOSE stop" }
    "ps" { Invoke-Expression "$COMPOSE ps" }

    # Build
    "build" { Invoke-Expression "$COMPOSE build" }
    "build-nc" { Invoke-Expression "$COMPOSE build --no-cache" }

    # Logs
    "logs" { Invoke-Expression "$COMPOSE logs -f" }
    "logs-backend" { Invoke-Expression "$COMPOSE logs -f backend" }
    "logs-frontend" { Invoke-Expression "$COMPOSE logs -f frontend" }
    "logs-db" { Invoke-Expression "$COMPOSE logs -f db" }

    # Limpeza
    "clean" { Invoke-Expression "$COMPOSE down -v" }
    "clean-all" { Invoke-Expression "$COMPOSE down -v --rmi all" }
    "prune" { docker system prune -af --volumes }

    # Acesso
    "shell-backend" { Invoke-Expression "$COMPOSE exec backend sh" }
    "shell-frontend" { Invoke-Expression "$COMPOSE exec frontend sh" }
    "shell-db" { Invoke-Expression "$COMPOSE exec db psql -U atenaai -d atenaai" }

    # Health
    "health" {
        Write-Host "=== Backend Health ===" -ForegroundColor Cyan
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing -TimeoutSec 5
            Write-Host "Backend: OK ($($response.StatusCode))" -ForegroundColor Green
        } catch {
            Write-Host "Backend: OFFLINE" -ForegroundColor Red
        }

        Write-Host "`n=== Frontend Health ===" -ForegroundColor Cyan
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5
            Write-Host "Frontend: OK ($($response.StatusCode))" -ForegroundColor Green
        } catch {
            Write-Host "Frontend: OFFLINE" -ForegroundColor Red
        }

        Write-Host "`n=== Database Health ===" -ForegroundColor Cyan
        Invoke-Expression "$COMPOSE exec db pg_isready -U atenaai"
    }

    # Backup
    "backup-db" {
        if (!(Test-Path "backups")) { New-Item -ItemType Directory -Path "backups" }
        $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
        $filename = "backups/atenaai_$timestamp.sql"
        Invoke-Expression "$COMPOSE exec -T db pg_dump -U atenaai atenaai" | Out-File -FilePath $filename
        Write-Host "Backup criado: $filename" -ForegroundColor Green
    }

    # Migrate
    "migrate" {
        Invoke-Expression "$COMPOSE exec backend python scripts/run_data_migrations.py"
    }

    # Setup
    "setup" {
        if (!(Test-Path ".env")) {
            Copy-Item ".env.docker" ".env"
            Write-Host ".env criado! Edite com sua OPENAI_API_KEY" -ForegroundColor Yellow
        }
        Invoke-Expression "$COMPOSE up -d"
        Write-Host "`nAtenaAI iniciado! Acesse:" -ForegroundColor Green
        Write-Host "  Frontend: http://localhost:3000"
        Write-Host "  Backend:  http://localhost:8000/docs"
    }

    # Help
    default { Show-Help }
}
