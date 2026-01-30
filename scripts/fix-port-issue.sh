#!/bin/bash

# Script para encontrar y resolver problemas con el puerto 3000

echo "🔍 Diagnóstico del puerto 3000..."
echo ""

# 1. Ver qué proceso está usando el puerto 3000
echo "1. Proceso usando el puerto 3000:"
if command -v lsof &> /dev/null; then
    lsof -i :3000 || echo "   ⚠️ No se encontró proceso con lsof"
elif command -v fuser &> /dev/null; then
    fuser 3000/tcp || echo "   ⚠️ No se encontró proceso con fuser"
else
    echo "   ⚠️ lsof y fuser no están instalados"
    echo "   💡 Instala con: sudo apt-get install lsof"
fi
echo ""

# 2. Ver todos los procesos relacionados con node
echo "2. Todos los procesos Node.js:"
ps aux | grep -E "node|next" | grep -v grep || echo "   ❌ No hay procesos Node.js corriendo"
echo ""

# 3. Verificar si el puerto está realmente escuchando
echo "3. Estado del puerto 3000 (con más detalles):"
netstat -tulnp | grep :3000 || ss -tulnp | grep :3000 || echo "   ⚠️ No se pudo obtener información detallada"
echo ""

# 4. Intentar matar el proceso si está bloqueando
echo "4. ¿Quieres matar el proceso del puerto 3000? (requiere el PID del paso 1)"
echo "   Ejecuta manualmente: kill -9 <PID>"
echo ""

# 5. Probar conexión local
echo "5. Probar conexión local:"
if command -v curl &> /dev/null; then
    curl -v http://localhost:3000 2>&1 | head -20 || echo "   ❌ No se puede conectar"
elif command -v wget &> /dev/null; then
    wget -O- http://localhost:3000 2>&1 | head -10 || echo "   ❌ No se puede conectar"
else
    echo "   ⚠️ No hay curl ni wget instalado"
fi
echo ""

echo "✅ Diagnóstico completado"

