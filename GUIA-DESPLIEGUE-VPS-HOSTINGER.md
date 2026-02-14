# Guía de Despliegue en VPS Hostinger - Ubuntu 25

## Requisitos Previos

- VPS Hostinger con Ubuntu 25
- Acceso SSH al servidor
- Dominio configurado (ej: `qa.inamiunah.online`)
- Certificado SSL (Let's Encrypt recomendado)
- Node.js 20.x o superior
- PM2 instalado globalmente
- Nginx instalado y configurado

## 1. Preparación del Entorno

### 1.1. Conectarse al VPS

```bash
ssh usuario@tu-vps-hostinger.com
```

### 1.2. Instalar Node.js 20.x

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 20.x usando NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalación
node --version  # Debe mostrar v20.x.x
npm --version
```

### 1.3. Instalar PM2

```bash
sudo npm install -g pm2

# Configurar PM2 para iniciar al arrancar el sistema
pm2 startup
# Sigue las instrucciones que aparecen
```

### 1.4. Instalar Nginx (si no está instalado)

```bash
sudo apt install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx
```

## 2. Clonar y Configurar la Aplicación

### 2.1. Clonar el Repositorio

```bash
# Ir al directorio home del usuario
cd ~

# Clonar el repositorio (ajusta la URL según tu repositorio)
git clone https://github.com/tu-usuario/INAMI-APP-QA.git
# o si ya existe:
cd INAMI-APP-QA
git pull origin main
```

### 2.2. Instalar Dependencias

```bash
cd ~/INAMI-APP-QA
npm install --production
```

### 2.3. Configurar Variables de Entorno

```bash
# Crear archivo .env.local
nano .env.local
```

Agregar las siguientes variables (reemplaza con tus valores reales):

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-aqui

# URL de Producción (IMPORTANTE: usar HTTPS y tu dominio)
NEXT_PUBLIC_SITE_URL=https://qa.inamiunah.online

# Entorno
NODE_ENV=production
```

**⚠️ IMPORTANTE:**
- `NEXT_PUBLIC_SITE_URL` debe ser la URL completa con HTTPS de tu dominio
- No uses IPs ni localhost en producción
- Ejemplo correcto: `https://qa.inamiunah.online`
- Ejemplo incorrecto: `http://31.220.20.232:3000`

Guardar el archivo (Ctrl+O, Enter, Ctrl+X en nano)

### 2.4. Verificar Variables de Entorno

```bash
# Verificar que el archivo existe
ls -la .env.local

# Verificar variables (sin mostrar valores completos)
cat .env.local | grep -E "NEXT_PUBLIC|SUPABASE" | sed 's/=.*/=***/'
```

## 3. Build de Producción

### 3.1. Compilar la Aplicación

```bash
cd ~/INAMI-APP-QA

# Hacer build de producción
npm run build

# Verificar que se creó el directorio .next/standalone
ls -la .next/standalone
```

### 3.2. Verificar el Build

```bash
# Verificar que el servidor standalone existe
ls -la .next/standalone/server.js
```

## 4. Configurar PM2

### 4.1. Crear Archivo de Configuración PM2

```bash
cd ~/INAMI-APP-QA
nano ecosystem.config.js
```

Contenido del archivo:

```javascript
module.exports = {
  apps: [{
    name: 'inami-qa',
    script: '.next/standalone/server.js',
    cwd: '/home/tu-usuario/INAMI-APP-QA',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: '/home/tu-usuario/.pm2/logs/inami-qa-error.log',
    out_file: '/home/tu-usuario/.pm2/logs/inami-qa-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G',
    watch: false,
    ignore_watch: ['node_modules', '.next', '.git']
  }]
}
```

**⚠️ IMPORTANTE:** Reemplaza `/home/tu-usuario/` con la ruta real de tu usuario.

Guardar el archivo (Ctrl+O, Enter, Ctrl+X)

### 4.2. Iniciar la Aplicación con PM2

```bash
# Iniciar la aplicación
pm2 start ecosystem.config.js

# Guardar la configuración para que persista después de reinicios
pm2 save

# Verificar estado
pm2 status

# Ver logs
pm2 logs inami-qa
```

### 4.3. Verificar que el Servidor Está Corriendo

```bash
# Verificar que el puerto 3001 está en uso
sudo ss -tulpn | grep 3001

# Probar localmente
curl http://localhost:3001
```

## 5. Configurar Nginx como Reverse Proxy

### 5.1. Crear Configuración de Nginx

```bash
sudo nano /etc/nginx/sites-available/qa.inamiunah.online
```

Contenido (ajusta el dominio según corresponda):

```nginx
server {
    listen 80;
    server_name qa.inamiunah.online;

    # Redirigir HTTP a HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name qa.inamiunah.online;

    # Certificados SSL (ajusta las rutas según tu configuración)
    ssl_certificate /etc/letsencrypt/live/qa.inamiunah.online/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/qa.inamiunah.online/privkey.pem;

    # Configuración SSL moderna
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Headers de seguridad
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Tamaño máximo de archivo
    client_max_body_size 50M;

    # Logs
    access_log /var/log/nginx/qa-inamiunah-access.log;
    error_log /var/log/nginx/qa-inamiunah-error.log;

    # Proxy a la aplicación Next.js
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Cache para archivos estáticos
    location /_next/static {
        proxy_pass http://localhost:3001;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, max-age=3600, immutable";
    }
}
```

### 5.2. Habilitar la Configuración

```bash
# Crear enlace simbólico
sudo ln -s /etc/nginx/sites-available/qa.inamiunah.online /etc/nginx/sites-enabled/

# Verificar configuración de Nginx
sudo nginx -t

# Si todo está bien, recargar Nginx
sudo systemctl reload nginx
```

## 6. Configurar SSL con Let's Encrypt

### 6.1. Instalar Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 6.2. Obtener Certificado SSL

```bash
sudo certbot --nginx -d qa.inamiunah.online
```

Sigue las instrucciones en pantalla.

### 6.3. Verificar Renovación Automática

```bash
# Probar renovación
sudo certbot renew --dry-run

# Verificar que el cron job está configurado
sudo systemctl status certbot.timer
```

## 7. Verificación Final

### 7.1. Verificar que Todo Funciona

```bash
# 1. Verificar PM2
pm2 status
pm2 logs inami-qa --lines 50

# 2. Verificar Nginx
sudo systemctl status nginx
sudo nginx -t

# 3. Verificar SSL
curl -I https://qa.inamiunah.online

# 4. Verificar que la aplicación responde
curl https://qa.inamiunah.online
```

### 7.2. Probar en el Navegador

1. Abre `https://qa.inamiunah.online` en tu navegador
2. Verifica que la aplicación carga correctamente
3. Prueba iniciar sesión
4. Verifica que todas las funcionalidades funcionan

## 8. Comandos Útiles para Mantenimiento

### 8.1. Reiniciar la Aplicación

```bash
pm2 restart inami-qa
```

### 8.2. Ver Logs en Tiempo Real

```bash
pm2 logs inami-qa
```

### 8.3. Ver Últimas 100 Líneas de Logs

```bash
pm2 logs inami-qa --lines 100
```

### 8.4. Detener la Aplicación

```bash
pm2 stop inami-qa
```

### 8.5. Actualizar la Aplicación

```bash
cd ~/INAMI-APP-QA

# Obtener últimos cambios
git pull origin main

# Reinstalar dependencias (si hay cambios)
npm install --production

# Rebuild
npm run build

# Reiniciar PM2
pm2 restart inami-qa
```

### 8.6. Ver Uso de Recursos

```bash
pm2 monit
```

## 9. Solución de Problemas

### 9.1. Error 502 Bad Gateway

**Causas posibles:**
- La aplicación no está corriendo
- El puerto está incorrecto
- Nginx no puede conectarse al servidor

**Solución:**
```bash
# Verificar que PM2 está corriendo
pm2 status

# Verificar que el puerto está en uso
sudo ss -tulpn | grep 3001

# Verificar logs de Nginx
sudo tail -f /var/log/nginx/qa-inamiunah-error.log

# Reiniciar la aplicación
pm2 restart inami-qa
```

### 9.2. Error de Variables de Entorno

**Solución:**
```bash
# Verificar que .env.local existe
ls -la .env.local

# Verificar variables (sin mostrar valores)
cat .env.local | grep -E "NEXT_PUBLIC|SUPABASE" | sed 's/=.*/=***/'

# Rebuild después de cambiar variables
npm run build
pm2 restart inami-qa
```

### 9.3. La Aplicación No Inicia

**Solución:**
```bash
# Ver logs detallados
pm2 logs inami-qa --err --lines 100

# Verificar que el build existe
ls -la .next/standalone/server.js

# Rebuild si es necesario
npm run build
pm2 restart inami-qa
```

### 9.4. Problemas con SSL

**Solución:**
```bash
# Verificar certificados
sudo certbot certificates

# Renovar certificado manualmente
sudo certbot renew

# Verificar configuración de Nginx
sudo nginx -t
```

## 10. Optimizaciones Adicionales

### 10.1. Configurar Firewall (UFW)

```bash
# Permitir SSH
sudo ufw allow 22/tcp

# Permitir HTTP y HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Habilitar firewall
sudo ufw enable

# Verificar estado
sudo ufw status
```

### 10.2. Configurar Swap (si es necesario)

```bash
# Verificar si hay swap
free -h

# Si no hay swap y necesitas más memoria, crear swap
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Hacer permanente
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## 11. Checklist de Despliegue

- [ ] Node.js 20.x instalado
- [ ] PM2 instalado y configurado
- [ ] Nginx instalado y configurado
- [ ] Repositorio clonado
- [ ] Dependencias instaladas
- [ ] Variables de entorno configuradas (`.env.local`)
- [ ] `NEXT_PUBLIC_SITE_URL` configurado con HTTPS y dominio correcto
- [ ] Build de producción completado (`npm run build`)
- [ ] PM2 iniciado y aplicación corriendo
- [ ] Nginx configurado como reverse proxy
- [ ] SSL configurado (Let's Encrypt)
- [ ] Firewall configurado
- [ ] Aplicación accesible desde el navegador
- [ ] Login funciona correctamente
- [ ] Logout funciona correctamente
- [ ] Logs monitoreados

## Notas Importantes

1. **Nunca uses localhost o IPs en `NEXT_PUBLIC_SITE_URL` en producción**
2. **Siempre usa HTTPS en producción**
3. **Mantén las variables de entorno seguras y nunca las subas a Git**
4. **Haz backups regulares de la base de datos**
5. **Monitorea los logs regularmente**
6. **Actualiza el sistema y las dependencias regularmente**

## Soporte

Si encuentras problemas:
1. Revisa los logs: `pm2 logs inami-qa`
2. Revisa los logs de Nginx: `sudo tail -f /var/log/nginx/qa-inamiunah-error.log`
3. Verifica el estado de los servicios: `pm2 status` y `sudo systemctl status nginx`
