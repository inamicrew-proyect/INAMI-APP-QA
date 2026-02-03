#!/bin/bash

echo "=========================================="
echo "DIAGNÓSTICO DE PROCESOS EN VPS"
echo "=========================================="
echo ""

echo "1. PROCESOS DE PM2:"
echo "-------------------"
pm2 list
echo ""

echo "2. PROCESOS DE NODE.JS:"
echo "-----------------------"
ps aux | grep node | grep -v grep
echo ""

echo "3. PUERTOS EN USO (3000-3010):"
echo "-------------------------------"
netstat -tulpn | grep -E ':(300[0-9]|3010)' || ss -tulpn | grep -E ':(300[0-9]|3010)'
echo ""

echo "4. CONFIGURACIÓN DE NGINX:"
echo "-------------------------"
echo "Buscando configuraciones relacionadas con inami..."
sudo find /etc/nginx -name "*.conf" -type f -exec grep -l "inami" {} \; 2>/dev/null
echo ""

echo "5. SITIOS HABILITADOS EN NGINX:"
echo "-------------------------------"
ls -la /etc/nginx/sites-enabled/ 2>/dev/null || ls -la /etc/nginx/conf.d/ 2>/dev/null
echo ""

echo "6. VERIFICAR PROCESO EN PUERTO 3001:"
echo "-------------------------------------"
lsof -i :3001 2>/dev/null || fuser 3001/tcp 2>/dev/null || echo "No se pudo verificar (puede requerir permisos)"
echo ""

echo "7. VERIFICAR PROCESO EN PUERTO 3000:"
echo "-------------------------------------"
lsof -i :3000 2>/dev/null || fuser 3000/tcp 2>/dev/null || echo "No se pudo verificar (puede requerir permisos)"
echo ""

echo "8. LOGS DE PM2 (últimas 10 líneas de cada proceso):"
echo "----------------------------------------------------"
pm2 list | grep -E "online|stopped" | awk '{print $2}' | while read app; do
    if [ ! -z "$app" ] && [ "$app" != "name" ]; then
        echo "--- $app ---"
        pm2 logs "$app" --lines 5 --nostream 2>/dev/null || echo "No hay logs disponibles"
        echo ""
    fi
done

echo "=========================================="
echo "FIN DEL DIAGNÓSTICO"
echo "=========================================="
