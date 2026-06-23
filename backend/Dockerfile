# ====================================
# Stage 1: Base Python Image
# ====================================
FROM python:3.11-slim as base

# Definir variáveis de ambiente
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Instalar dependências do sistema necessárias
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Criar diretório de trabalho
WORKDIR /app

# ====================================
# Stage 2: Dependencies
# ====================================
FROM base as dependencies

# Copiar apenas requirements.txt primeiro (cache de layer)
COPY requirements.txt .

# Instalar dependências Python
RUN pip install --no-cache-dir -r requirements.txt

# ====================================
# Stage 3: Development
# ====================================
FROM dependencies as development

# Copiar código da aplicação
COPY . .

# Criar diretório de uploads
RUN mkdir -p uploads

# Expor porta do backend
EXPOSE 8000

# Comando para desenvolvimento (com hot-reload)
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --reload"]

# ====================================
# Stage 4: Production
# ====================================
FROM dependencies as production

# Copiar código da aplicação
COPY . .

# Criar diretório de uploads
RUN mkdir -p uploads

# Criar usuário não-root para segurança
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app

USER appuser

# Expor porta do backend
EXPOSE 8000

# Comando para produção (otimizado)
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers ${UVICORN_WORKERS:-4}"]
