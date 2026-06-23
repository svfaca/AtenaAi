#!/bin/bash

# ============================================
# Script de Setup - AtenaAI Frontend Next.js
# ============================================

echo "🚀 Inicializando AtenaAI Frontend..."
echo ""

# 1. Instalar dependências
echo "📦 Instalando dependências..."
npm install
if [ $? -ne 0 ]; then
  echo "❌ Erro ao instalar dependências"
  exit 1
fi

# 2. Validar TypeScript
echo "✅ Verificando tipos TypeScript..."
npx tsc --noEmit
if [ $? -ne 0 ]; then
  echo "⚠️  Erros de tipo encontrados (não crítico)"
fi

# 3. Criar arquivo .env.local
echo "🔐 Configurando variáveis de ambiente..."
if [ ! -f .env.local ]; then
  cp .env.local.example .env.local
  echo "✅ Arquivo .env.local criado"
  echo "   Edite o arquivo antes de iniciar o servidor"
else
  echo "ℹ️  Arquivo .env.local já existe"
fi

# 4. Limpar build anterior
echo "🧹 Limpando builds anteriores..."
rm -rf .next

# 5. Build inicial
echo "🔨 Compilando projeto..."
npm run build
if [ $? -ne 0 ]; then
  echo "❌ Erro na compilação"
  exit 1
fi

echo ""
echo "✅ Setup concluído com sucesso!"
echo ""
echo "🎯 Próximos passos:"
echo "   1. Configure seu .env.local com as URLs do backend"
echo "   2. Execute: npm run dev"
echo "   3. Acesse: http://localhost:3000"
echo ""
echo "📚 Documentação: Veja ARCHITECTURE.md para detalhes"
