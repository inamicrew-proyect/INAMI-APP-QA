#!/bin/bash

# Script para configurar variables de entorno en el VPS

echo "🔧 Configuración de Variables de Entorno para INAMI.APP"
echo ""

cd ~/INAMI.APP || exit 1

# Verificar si ya existe .env.local
if [ -f ".env.local" ]; then
    echo "⚠️  El archivo .env.local ya existe."
    echo ""
    read -p "¿Deseas sobrescribirlo? (s/N): " respuesta
    if [[ ! $respuesta =~ ^[Ss]$ ]]; then
        echo "❌ Operación cancelada."
        exit 0
    fi
    echo ""
fi

echo "📝 Necesitarás los siguientes valores de Supabase:"
echo "   1. NEXT_PUBLIC_SUPABASE_URL (Project URL)"
echo "   2. NEXT_PUBLIC_SUPABASE_ANON_KEY (anon public key)"
echo "   3. SUPABASE_SERVICE_ROLE_KEY (service_role key)"
echo ""
echo "💡 Puedes obtenerlos en: Supabase Dashboard > Settings > API"
echo ""

# Solicitar valores
read -p "Ingresa NEXT_PUBLIC_SUPABASE_URL: " SUPABASE_URL
read -p "Ingresa NEXT_PUBLIC_SUPABASE_ANON_KEY: " SUPABASE_ANON_KEY
read -p "Ingresa SUPABASE_SERVICE_ROLE_KEY: " SUPABASE_SERVICE_KEY

# Validar que no estén vacíos
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ] || [ -z "$SUPABASE_SERVICE_KEY" ]; then
    echo "❌ Error: Todos los valores son requeridos."
    exit 1
fi

# Crear el archivo .env.local
cat > .env.local << EOF
# Variables de entorno para Supabase
# Generado automáticamente el $(date)

NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_KEY
EOF

echo ""
echo "✅ Archivo .env.local creado exitosamente!"
echo ""
echo "📋 Verificación:"
echo "   - NEXT_PUBLIC_SUPABASE_URL: ${SUPABASE_URL:0:30}..."
echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY:0:20}..."
echo "   - SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_KEY:0:20}..."
echo ""
echo "💡 Próximos pasos:"
echo "   1. Reinicia PM2: pm2 restart inami-app"
echo "   2. Verifica los logs: pm2 logs inami-app"
echo ""

