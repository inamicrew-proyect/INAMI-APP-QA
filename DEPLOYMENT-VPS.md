# Guía de Despliegue en VPS

## Problema: No se puede acceder desde la IP del VPS (31.220.20.232:3000)

### Pasos para Solucionar

#### 1. **Verificar el Estado del Servidor**

En el VPS (mediante Putty), ejecuta:

```bash
# Dar permisos de ejecución a los scripts
chmod +x scripts/check-server-status.sh
chmod +x scripts/start-server.sh

# Ejecutar verificación
./scripts/check-server-status.sh
```

O manualmente:

```bash
# Verificar si hay procesos Node.js corriendo
ps aux | grep node

# Verificar si el puerto 3000 está escuchando
netstat -tuln | grep :3000
# O
ss -tuln | grep :3000

# Probar conexión local
curl http://localhost:3000
```

#### 2. **Si el Servidor NO Está Corriendo**

Ejecuta en el VPS:

```bash
# Ir al directorio del proyecto
cd /ruta/al/proyecto

# Asegurarte de que el build existe
npm run build

# Iniciar el servidor
npm start
# O usar el script
./scripts/start-server.sh
```

#### 3. **Verificar Firewall**

Asegúrate de que el firewall permita conexiones al puerto 3000:

```bash
# Si usas UFW (Ubuntu/Debian)
sudo ufw status
sudo ufw allow 3000/tcp
sudo ufw reload

# Si usas firewall-cmd (CentOS/RHEL)
sudo firewall-cmd --list-ports
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload

# Verificar que la regla esté activa
sudo ufw status | grep 3000
```

#### 4. **Verificar Variables de Entorno**

Asegúrate de tener `.env.local` en el VPS con las variables necesarias:

```bash
# Verificar que existe
ls -la .env.local

# Verificar contenido (sin mostrar valores sensibles)
cat .env.local | grep -E "NEXT_PUBLIC_SUPABASE_URL|SUPABASE_ANON_KEY"
```

#### 5. **Usar PM2 para Mantener el Servidor Corriendo (Recomendado)**

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar la aplicación con PM2
pm2 start npm --name "inami-app" -- start

# O usar el script directamente
pm2 start "npm start" --name "inami-app"

# Ver estado
pm2 status

# Ver logs
pm2 logs inami-app

# Guardar configuración para que se inicie al reiniciar el servidor
pm2 save
pm2 startup
```

#### 6. **Probar la Conexión**

Desde el VPS:

```bash
# Probar localhost
curl http://localhost:3000

# Probar desde la IP
curl http://31.220.20.232:3000
```

Desde tu computadora local:

```bash
# Probar desde fuera
curl http://31.220.20.232:3000
```

### Problemas Comunes

1. **El proceso se detiene al cerrar Putty**
   - Solución: Usa PM2 o `nohup npm start &`

2. **El puerto está en uso**
   - Solución: `lsof -i :3000` y luego `kill -9 <PID>`

3. **Permiso denegado**
   - Solución: Verifica permisos del usuario y del puerto

4. **Error de conexión pero el servidor está corriendo**
   - Solución: Verifica que esté escuchando en `0.0.0.0` y no en `127.0.0.1`

### Verificación Final

El servidor debe estar:
- ✅ Escuchando en `0.0.0.0:3000` (no en `127.0.0.1`)
- ✅ Accesible desde `http://localhost:3000` en el VPS
- ✅ Accesible desde `http://31.220.20.232:3000` externamente
- ✅ Corriendo con PM2 o en segundo plano

