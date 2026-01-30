#!/bin/bash

# Script para reiniciar el servidor Next.js correctamente

echo "🔄 Reiniciando servidor Next.js..."
echo ""

# 1. Buscar y matar procesos en el puerto 3000
echo "1. Liberando puerto 3000..."
if command -v lsof &> /dev/null; then
    PID=$(lsof -ti :3000)
    if [ ! -z "$PID" ]; then
        echo "   🔍 Proceso encontrado en puerto 3000 (PID: $PID)"
        kill -9 $PID 2>/dev/null
        echo "   ✅ Proceso terminado"
        sleep 2
    else
        echo "   ℹ️ No hay proceso usando el puerto 3000"
    fi
elif command -v fuser &> /dev/null; then
    fuser -k 3000/tcp 2>/dev/null
    echo "   ✅ Puertos liberados con fuser"
    sleep 2
else
    echo "   ⚠️ lsof no está instalado, intentando encontrar proceso manualmente"
    netstat -tulnp | grep :3000
    echo "   💡 Si hay un proceso, mátalo manualmente con: kill -9 <PID>"
fi
echo ""

# 2. Verificar que el build existe
if [ ! -d ".next" ]; then
    echo "❌ Error: No se encontró la carpeta .next"
    echo "💡 Ejecutando build..."
    npm run build
    if [ $? -ne 0 ]; then
        echo "❌ Error en el build"
        exit 1
    fi
fi
echo "✅ Build verificado"
echo ""

# 3. Verificar variables de entorno
if [ ! -f ".env.local" ]; then
    echo "⚠️ Advertencia: No se encontró .env.local"
fi
echo ""

# 4. Configurar variables y iniciar
export HOSTNAME=0.0.0.0
export PORT=3000
export NODE_ENV=production

echo "🚀 Iniciando servidor..."
echo "📍 Escuchando en: http://0.0.0.0:3000"
echo "🌐 Accesible desde: http://31.220.20.232:3000"
echo ""
echo "💡 Para mantenerlo corriendo en segundo plano, usa:"
echo "   nohup npm start > server.log 2>&1 &"
echo "   O instala PM2: npm install -g pm2 && pm2 start npm --name 'inami-app' -- start"
echo ""

npm start

