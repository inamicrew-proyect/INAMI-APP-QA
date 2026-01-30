#!/bin/bash

echo "🔍 DIAGNÓSTICO DE ERROR 502 BAD GATEWAY"
echo "========================================"
echo ""

echo "1️⃣ Estado de PM2:"
pm2 list
echo ""

echo "2️⃣ Logs recientes de PM2 (últimas 30 líneas):"
pm2 logs inami-app --lines 30 --nostream
echo ""

echo "3️⃣ Verificando si el puerto 3000 está en uso:"
if command -v netstat &> /dev/null; then
    netstat -tulnp | grep :3000 || echo "❌ No hay proceso escuchando en el puerto 3000"
elif command -v ss &> /dev/null; then
    ss -tulnp | grep :3000 || echo "❌ No hay proceso escuchando en el puerto 3000"
else
    echo "⚠️ netstat y ss no están disponibles"
fi
echo ""

echo "4️⃣ Verificando si existe el build:"
if [ -d ".next" ]; then
    echo "✅ Carpeta .next existe"
    ls -la .next | head -5
else
    echo "❌ Carpeta .next NO existe - Necesitas ejecutar: npm run build"
fi
echo ""

echo "5️⃣ Verificando variables de entorno:"
if [ -f ".env.local" ]; then
    echo "✅ Archivo .env.local existe"
    echo "   Variables importantes (sin valores):"
    grep -E "^(NEXT_PUBLIC_|SUPABASE_|DATABASE_)" .env.local | cut -d'=' -f1 | head -5
else
    echo "⚠️ Archivo .env.local NO existe"
fi
echo ""

echo "6️⃣ Verificando que server.js existe:"
if [ -f "server.js" ]; then
    echo "✅ server.js existe"
else
    echo "❌ server.js NO existe"
fi
echo ""

echo "7️⃣ Información detallada de PM2:"
pm2 describe inami-app
echo ""

echo "8️⃣ Intentando hacer una petición local al puerto 3000:"
curl -I http://localhost:3000 2>&1 | head -5 || echo "❌ No se pudo conectar a localhost:3000"
echo ""

echo "========================================"
echo "💡 SOLUCIONES SUGERIDAS:"
echo ""
echo "Si no hay logs o hay errores:"
echo "  1. pm2 delete inami-app"
echo "  2. npm run build"
echo "  3. pm2 start ecosystem.config.js"
echo "  4. pm2 logs inami-app"
echo ""
echo "Si el puerto 3000 no está en uso:"
echo "  1. Verificar que PORT=3000 en ecosystem.config.js"
echo "  2. Verificar que HOSTNAME=0.0.0.0 en ecosystem.config.js"
echo "  3. Reiniciar: pm2 restart inami-app"
echo ""
echo "Si hay errores de compilación:"
echo "  1. Verificar que todas las dependencias estén instaladas: npm install"
echo "  2. Reconstruir: npm run build"
echo "  3. Verificar que no haya errores de TypeScript: npx tsc --noEmit"
echo ""

