#!/bin/bash

# Script para iniciar el servidor Next.js en producción

echo "🚀 Iniciando servidor Next.js..."

# Verificar que existe el build
if [ ! -d ".next" ]; then
    echo "❌ Error: No se encontró la carpeta .next"
    echo "💡 Ejecuta 'npm run build' primero"
    exit 1
fi

# Verificar variables de entorno
if [ ! -f ".env.local" ]; then
    echo "⚠️ Advertencia: No se encontró .env.local"
fi

# Configurar variables de entorno para que escuche en todas las interfaces
export HOSTNAME=0.0.0.0
export PORT=3000
export NODE_ENV=production

# Iniciar el servidor
echo "📍 Servidor escuchando en: http://0.0.0.0:3000"
echo "🌐 Accesible desde: http://31.220.20.232:3000"
echo ""

npm start

