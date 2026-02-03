# Solución para Error 502 Bad Gateway

## Problemas Identificados

1. **Error `EADDRINUSE`**: El puerto 3001 ya está en uso por otro proceso
2. **Sigue usando `next start`**: PM2 está usando el comando incorrecto
3. **Proceso se reinicia constantemente**: Por el error de puerto

## Solución Paso a Paso

### 1. Detener el proceso actual de PM2

```bash
pm2 delete inami-qa
```

### 2. Verificar qué está usando el puerto 3001

```bash
# Ver qué proceso está usando el puerto 3001
sudo lsof -i :3001
# o
sudo ss -tulpn | grep 3001
# o
sudo fuser 3001/tcp
```

### 3. Matar el proceso que está usando el puerto 3001

```bash
# Si encuentras un PID, matarlo:
sudo kill -9 PID

# O matar directamente el puerto:
sudo fuser -k 3001/tcp
```

### 4. Verificar que el build esté completo

```bash
# Verificar que existe el servidor standalone
ls -la .next/standalone/server.js

# Si no existe, hacer el build:
npm run build
```

### 5. Reiniciar PM2 con el comando correcto

```bash
# Opción A: Usar npm start (que ahora usa el servidor standalone)
pm2 start npm --name "inami-qa" -- start

# Opción B: Usar el comando directo
pm2 start .next/standalone/server.js --name "inami-qa"

# Opción C: Usar el archivo ecosystem.config.js
# Primero crea el archivo (ver abajo)
pm2 start ecosystem.config.js
```

### 6. Guardar la configuración de PM2

```bash
pm2 save
```

### 7. Verificar que funciona

```bash
# Ver logs
pm2 logs inami-qa --lines 20

# Ver estado
pm2 status

# Verificar que el puerto está en uso correctamente
sudo lsof -i :3001
```

## Crear archivo ecosystem.config.js

Si prefieres usar un archivo de configuración:

```bash
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'inami-qa',
    script: '.next/standalone/server.js',
    cwd: '/home/inami_admin/INAMI.APP_QA',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: '/home/inami_admin/.pm2/logs/inami-qa-error.log',
    out_file: '/home/inami_admin/.pm2/logs/inami-qa-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G',
    watch: false,
    ignore_watch: ['node_modules', '.next', '.git'],
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000
  }]
}
EOF
```

Luego:
```bash
pm2 start ecosystem.config.js
pm2 save
```

## Comandos Rápidos (Todo en uno)

```bash
# 1. Detener PM2
pm2 delete inami-qa

# 2. Matar proceso en puerto 3001
sudo fuser -k 3001/tcp

# 3. Verificar build
ls -la .next/standalone/server.js || npm run build

# 4. Iniciar con comando correcto
pm2 start .next/standalone/server.js --name "inami-qa"

# 5. Guardar
pm2 save

# 6. Ver logs
pm2 logs inami-qa --lines 30
```

## Verificar que funciona

```bash
# Verificar que el servidor responde
curl http://localhost:3001

# Debería devolver HTML de la aplicación
```

## Si sigue fallando

1. **Verificar variables de entorno:**
   ```bash
   # Verificar que existen las variables necesarias
   cat .env.local | grep -v "^#"
   ```

2. **Verificar permisos:**
   ```bash
   # Verificar permisos del archivo
   ls -la .next/standalone/server.js
   ```

3. **Ver logs detallados:**
   ```bash
   pm2 logs inami-qa --err --lines 50
   ```
