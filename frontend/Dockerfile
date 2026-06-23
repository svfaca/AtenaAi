# ====================================
# Stage 1: Dependencies
# ====================================
FROM node:20-alpine AS dependencies

WORKDIR /app

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production && \
    npm cache clean --force

# ====================================
# Stage 2: Builder
# ====================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar package.json
COPY package*.json ./

# Instalar todas as dependências (incluindo devDependencies)
RUN npm ci

# Copiar código fonte
COPY . .

# Build da aplicação Next.js
RUN npm run build

# ====================================
# Stage 3: Development
# ====================================
FROM node:20-alpine AS development

WORKDIR /app

# Copiar package.json
COPY package*.json ./

# Instalar dependências
RUN npm ci

# Copiar código fonte
COPY . .

# Expor porta
EXPOSE 3000

# Comando para desenvolvimento
CMD ["npm", "run", "dev"]

# ====================================
# Stage 4: Production
# ====================================
FROM node:20-alpine AS production

WORKDIR /app

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copiar dependências de produção
COPY --from=dependencies --chown=nextjs:nodejs /app/node_modules ./node_modules

# Copiar build da aplicação
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/package*.json ./
COPY --from=builder --chown=nextjs:nodejs /app/next.config.js ./

# Mudar para usuário não-root
USER nextjs

# Expor porta
EXPOSE 3000

# Variáveis de ambiente para produção
ENV NODE_ENV=production \
    PORT=3000

# Comando para produção
CMD ["npm", "start"]
