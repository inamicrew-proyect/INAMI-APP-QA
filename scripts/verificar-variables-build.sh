#!/bin/bash

# Script para verificar que las variables de entorno están disponibles en el build

echo "🔍 Verificando Variables de Entorno para el Build..."
echo ""

cd ~/INAMI.APP || exit 1

# Verificar que existe .env.local
if [ ! -f ".env.local" ]; then
    echo "❌ El archivo .env.local NO existe."
    echo "💡 Ejecuta: ./scripts/configurar-env.sh"
    exit 1
fi

echo "✅ Archivo .env.local encontrado"
echo ""

# Cargar variables de entorno
export $(grep -v '^#' .env.local | xargs)

# Verificar variables críticas
echo "📋 Verificando variables NEXT_PUBLIC_*:"
echo ""

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo "   ❌ NEXT_PUBLIC_SUPABASE_URL: NO configurada"
else
    echo "   ✅ NEXT_PUBLIC_SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL:0:40}..."
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo "   ❌ NEXT_PUBLIC_SUPABASE_ANON_KEY: NO configurada"
else
    echo "   ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY: ${NEXT_PUBLIC_SUPABASE_ANON_KEY:0:20}..."
fi

echo ""
echo "💡 IMPORTANTE: Las variables NEXT_PUBLIC_* deben estar disponibles durante el BUILD"
echo "💡 Si cambias estas variables, debes reconstruir: npm run build"
echo ""

