#!/bin/bash

# Script para resolver conflictos de Git en el VPS
# Elimina archivos temporales que causan conflictos

echo "🔧 Resolviendo conflicto de Git en VPS"
echo "======================================"
echo ""

# Verificar que se ejecuta desde el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Ejecuta este script desde el directorio raíz del proyecto"
    exit 1
fi

echo "📋 Eliminando archivos temporales que causan conflictos..."
echo ""

# Archivos que causan conflictos (ya fueron eliminados del repositorio)
ARCHIVOS_CONFLICTO=(
    "scripts/limpiar-archivos-temporales.sh"
    "scripts/ver-archivos-temporales.sh"
    "scripts/diagnostico-completo-nginx.sh"
    "scripts/diagnosticar-nginx.sh"
    "scripts/verificar-y-completar-ssl.sh"
    "scripts/solucion-automatica-nginx.sh"
    "scripts/fix-nginx-conflict.sh"
    "scripts/setup-domain-ssl.sh"
    "scripts/configurar-dominio-paso-a-paso.sh"
    "scripts/completar-configuracion-ssl.sh"
    "nginx-inamiunah-initial.conf"
    "nginx-inamiunah.conf"
    "nginx-config.conf"
    "SOLUCION-PROBLEMAS-DOMINIO.md"
    "CONFIGURAR-DOMINIO-SSL.md"
    "CONFIGURAR-NGINX.md"
    "REBUILD-WITH-ENV.md"
    "GIT-RESOLVER-CONFLICTO.md"
    "SOLUCION-ENV-VPS.md"
    "PM2-FIX.md"
    "LIMPIAR-ARCHIVOS.md"
)

ELIMINADOS=0

for archivo in "${ARCHIVOS_CONFLICTO[@]}"; do
    if [ -f "$archivo" ]; then
        rm -f "$archivo"
        echo "   ✅ Eliminado: $archivo"
        ELIMINADOS=$((ELIMINADOS + 1))
    fi
done

echo ""
echo "📊 Archivos eliminados: $ELIMINADOS"
echo ""

# Ahora intentar hacer pull de nuevo
echo "🔄 Intentando hacer git pull..."
echo ""

# Opción 1: Hacer reset hard para descartar cambios locales
echo "¿Deseas descartar todos los cambios locales y sincronizar con el repositorio?"
read -p "Esto eliminará cualquier cambio local no guardado. ¿Continuar? (s/N): " continuar

if [[ $continuar =~ ^[Ss]$ ]]; then
    echo ""
    echo "📥 Descartando cambios locales y sincronizando..."
    git reset --hard HEAD
    git clean -fd
    git pull
    echo ""
    echo "✅ Sincronización completada"
else
    echo ""
    echo "💡 Alternativa: Hacer stash de los cambios"
    echo "   Ejecuta manualmente:"
    echo "   git stash"
    echo "   git pull"
    echo "   git stash drop  # Si quieres eliminar el stash después"
fi

echo ""

