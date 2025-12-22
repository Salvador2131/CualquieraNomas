#!/bin/bash

# Script de configuración inicial de Supabase CLI
# Uso: bash scripts/setup-supabase-cli.sh

set -e

echo "🚀 Configurando Supabase CLI..."
echo ""

# Verificar que Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js no está instalado"
    exit 1
fi

echo "✅ Node.js encontrado: $(node --version)"

# Verificar que npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm no está instalado"
    exit 1
fi

echo "✅ npm encontrado: $(npm --version)"
echo ""

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

# Verificar que Supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
    echo "📦 Instalando Supabase CLI globalmente..."
    npm install -g supabase@latest
fi

echo "✅ Supabase CLI: $(supabase --version)"
echo ""

# Verificar si ya está inicializado
if [ -f "supabase/config.toml" ]; then
    echo "⚠️  Supabase ya está inicializado"
    read -p "¿Deseas reinicializar? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🔄 Reinicializando..."
        supabase init
    fi
else
    echo "🔧 Inicializando Supabase..."
    supabase init
fi

echo ""
echo "📋 Próximos pasos:"
echo ""
echo "1. Obtén tu Project Ref de Supabase Dashboard"
echo "2. Obtén tu Access Token de: https://supabase.com/dashboard/account/tokens"
echo "3. Ejecuta: supabase link --project-ref <tu-project-ref>"
echo ""
echo "4. Para crear una migración:"
echo "   npm run supabase:migration:new nombre_descriptivo"
echo ""
echo "5. Configura GitHub Secrets:"
echo "   - SUPABASE_ACCESS_TOKEN"
echo "   - SUPABASE_PROJECT_REF"
echo "   - SUPABASE_DB_PASSWORD (opcional)"
echo ""
echo "✅ Configuración completada!"
