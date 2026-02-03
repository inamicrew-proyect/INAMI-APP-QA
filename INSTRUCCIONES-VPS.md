# Instrucciones para Desplegar en VPS

## Problema Identificado

Tu aplicación usa `output: 'standalone'` en `next.config.js`, lo que significa que **NO puedes usar `next start`**. Debes usar el servidor standalone que Next.js genera.

## Solución

### 1. Actualizar el script de inicio

El `package.json` ya ha sido actualizado con el script correcto:
- `npm start` ahora usa: `node .next/standalone/server.js`
- `npm run start:next` está disponible si necesitas usar `next start` (solo si cambias la configuración)

### 2. Pasos para desplegar en el VPS

```bash
# 1. Conectarse al VPS
ssh tu_usuario@tu_vps

# 2. Ir al directorio del proyecto
cd /home/inami_admin/INAMI.APP_QA

# 3. Asegurarse de tener las últimas actualizaciones
git pull origin main  # o la rama que uses

# 4. Instalar dependencias (si hay cambios)
npm install

# 5. Hacer el build (MUY IMPORTANTE)
npm run build

# 6. Verificar que el build se completó correctamente
ls -la .next/standalone/server.js

# 7. Reiniciar PM2 con el nuevo script
pm2 restart inami-qa

# O si necesitas cambiar el comando de PM2:
pm2 delete inami-qa
pm2 start npm --name "inami-qa" -- start
pm2 save
```

### 3. Configuración de PM2

Si necesitas crear/actualizar la configuración de PM2, usa uno de estos métodos:

#### Opción A: Usando npm start (recomendado)
```bash
pm2 start npm --name "inami-qa" -- start
pm2 save
```

#### Opción B: Usando el comando directo
```bash
pm2 start .next/standalone/server.js --name "inami-qa"
pm2 save
```

#### Opción C: Crear un archivo ecosystem.config.js
```javascript
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
    max_memory_restart: '1G'
  }]
}
```

Luego:
```bash
pm2 start ecosystem.config.js
pm2 save
```

### 4. Verificar que funciona

```bash
# Ver logs
pm2 logs inami-qa

# Ver estado
pm2 status

# Ver información detallada
pm2 info inami-qa
```

### 5. Solución de problemas

#### Error: ENOENT: no such file or directory, open '.next/prerender-manifest.json'
**Solución:** Ejecuta `npm run build` antes de iniciar la aplicación.

#### Error: "next start" does not work with "output: standalone"
**Solución:** Usa `node .next/standalone/server.js` en lugar de `next start`.

#### Error 502 Bad Gateway
**Causas posibles:**
1. El servidor no está corriendo: `pm2 status`
2. El puerto está incorrecto: verifica que PM2 use el puerto correcto (3001)
3. Nginx no está configurado correctamente: verifica la configuración de proxy
4. El build no se completó: ejecuta `npm run build` nuevamente

#### Verificar que el servidor está escuchando
```bash
# Verificar que el proceso está corriendo
pm2 status

# Verificar que el puerto está en uso
netstat -tulpn | grep 3001
# o
ss -tulpn | grep 3001
```

### 6. Variables de entorno

Asegúrate de que las variables de entorno estén configuradas correctamente:
- `.env.local` o `.env.production` en el directorio del proyecto
- O configuradas en PM2 usando `--env production`

### 7. Nginx Configuration (si usas Nginx)

Asegúrate de que tu configuración de Nginx apunte al puerto correcto:

```nginx
server {
    listen 80;
    server_name qa.inamiunah.online;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Luego recarga Nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Resumen de comandos rápidos

```bash
# Build y reinicio completo
cd /home/inami_admin/INAMI.APP_QA
npm run build
pm2 restart inami-qa
pm2 logs inami-qa --lines 50
```
