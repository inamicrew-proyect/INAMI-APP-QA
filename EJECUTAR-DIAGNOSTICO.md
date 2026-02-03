# Ejecutar Diagnóstico en VPS

## Pasos Inmediatos

```bash
# 1. Dar permisos de ejecución al script
chmod +x scripts/diagnostico-vps.sh

# 2. Ejecutar el diagnóstico
./scripts/diagnostico-vps.sh

# 3. O si prefieres ejecutar los comandos manualmente:
```

## Comandos Manuales de Diagnóstico

```bash
# Ver todos los procesos de PM2
pm2 list

# Ver todos los procesos de Node.js (incluso fuera de PM2)
ps aux | grep node | grep -v grep

# Ver puertos en uso
ss -tulpn | grep -E ':(300[0-9]|3010)'

# Ver configuración de Nginx para ambas URLs
sudo grep -r "inamiunah.online" /etc/nginx/ | grep -v "#"

# Ver qué proceso está usando el puerto 3000
sudo lsof -i :3000

# Ver qué proceso está usando el puerto 3001
sudo lsof -i :3001
```

## Después de Ejecutar el Diagnóstico

Comparte los resultados de:
1. `pm2 list` - Para ver qué procesos de PM2 están corriendo
2. `ps aux | grep node` - Para ver todos los procesos de Node.js
3. `ss -tulpn | grep -E ':(300[0-9]|3010)'` - Para ver qué puertos están en uso

Con esa información podremos identificar qué proceso está sirviendo `inamiunah.online` y cómo detenerlo.
