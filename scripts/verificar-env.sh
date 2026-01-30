#!/bin/bash

# Script para verificar las variables de entorno

echo "🔍 Verificando Variables de Entorno..."
echo ""

cd ~/INAMI.APP || exit 1

if [ ! -f ".env.local" ]; then
    echo "❌ El archivo .env.local NO existe."
    echo "💡 Ejecuta: ./scripts/configurar-env.sh"
    exit 1
fi

echo "✅ Archivo .env.local encontrado"
echo ""

# Verificar cada variable
SUPABASE_URL=$(grep "^NEXT_PUBLIC_SUPABASE_URL=" .env.local | cut -d '=' -f2-)
SUPABASE_ANON=$(grep "^NEXT_PUBLIC_SUPABASE_ANON_KEY=" .env.local | cut -d '=' -f2-)
SUPABASE_SERVICE=$(grep "^SUPABASE_SERVICE_ROLE_KEY=" .env.local | cut -d '=' -f2-)

echo "📋 Variables configuradas:"
echo ""

if [ -z "$SUPABASE_URL" ]; then
    echo "   ❌ NEXT_PUBLIC_SUPABASE_URL: NO configurada"
else
    echo "   ✅ NEXT_PUBLIC_SUPABASE_URL: ${SUPABASE_URL:0:40}..."
fi

if [ -z "$SUPABASE_ANON" ]; then
    echo "   ❌ NEXT_PUBLIC_SUPABASE_ANON_KEY: NO configurada"
else
    echo "   ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY: ${SUPABASE_ANON:0:20}..."
fi

if [ -z "$SUPABASE_SERVICE" ]; then
    echo "   ⚠️  SUPABASE_SERVICE_ROLE_KEY: NO configurada (opcional pero recomendado)"
else
    echo "   ✅ SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE:0:20}..."
fi

echo ""
echo "💡 Si alguna variable falta, edita .env.local o ejecuta: ./scripts/configurar-env.sh"
echo ""

