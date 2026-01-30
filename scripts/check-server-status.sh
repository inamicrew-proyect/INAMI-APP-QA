#!/bin/bash

# Script para verificar el estado del servidor Next.js en el VPS

echo "🔍 Verificando estado del servidor..."
echo ""

# Verificar si el proceso Node.js está corriendo
echo "1. Procesos Node.js activos:"
ps aux | grep node | grep -v grep || echo "   ❌ No hay procesos Node.js corriendo"
echo ""

# Verificar si el puerto 3000 está escuchando
echo "2. Estado del puerto 3000:"
if command -v netstat &> /dev/null; then
    netstat -tuln | grep :3000 || echo "   ❌ El puerto 3000 no está escuchando"
elif command -v ss &> /dev/null; then
    ss -tuln | grep :3000 || echo "   ❌ El puerto 3000 no está escuchando"
else
    echo "   ⚠️ No se encontró netstat ni ss"
fi
echo ""

# Verificar firewall (ufw)
echo "3. Estado del firewall (ufw):"
if command -v ufw &> /dev/null; then
    ufw status | grep 3000 || echo "   ⚠️ Regla para puerto 3000 no encontrada"
else
    echo "   ⚠️ ufw no está instalado"
fi
echo ""

# Verificar conexión local al puerto 3000
echo "4. Prueba de conexión local:"
if command -v curl &> /dev/null; then
    curl -I http://localhost:3000 2>&1 | head -1 || echo "   ❌ No se puede conectar a localhost:3000"
elif command -v wget &> /dev/null; then
    wget --spider -S http://localhost:3000 2>&1 | head -1 || echo "   ❌ No se puede conectar a localhost:3000"
else
    echo "   ⚠️ No se encontró curl ni wget para probar la conexión"
fi
echo ""

# Verificar si hay un archivo .next
echo "5. Verificando build:"
if [ -d ".next" ]; then
    echo "   ✅ Carpeta .next encontrada"
else
    echo "   ❌ Carpeta .next no encontrada - ejecuta 'npm run build' primero"
fi
echo ""

# Verificar variables de entorno
echo "6. Variables de entorno necesarias:"
[ -f ".env.local" ] && echo "   ✅ .env.local existe" || echo "   ⚠️ .env.local no existe"
[ -n "$NEXT_PUBLIC_SUPABASE_URL" ] && echo "   ✅ NEXT_PUBLIC_SUPABASE_URL configurada" || echo "   ⚠️ NEXT_PUBLIC_SUPABASE_URL no configurada"
echo ""

echo "✅ Verificación completada"

