# Solución para Problema de URLs en Nginx

## Problema
- `https://www.inamiunah.online/login` funciona (producción) pero no debería
- `https://qa.inamiunah.online/login` se queda en blanco (debería funcionar)

## Diagnóstico

### 1. Verificar configuración de Nginx

```bash
# Ver todas las configuraciones de Nginx
sudo ls -la /etc/nginx/sites-enabled/
sudo ls -la /etc/nginx/conf.d/

# Ver configuración para qa.inamiunah.online
sudo grep -r "qa.inamiunah.online" /etc/nginx/

# Ver configuración para inamiunah.online (producción)
sudo grep -r "inamiunah.online" /etc/nginx/ | grep -v "qa.inamiunah.online"

# Ver todas las configuraciones completas
sudo nginx -T | grep -A 30 "server_name"
```

### 2. Verificar qué procesos están corriendo

```bash
# Ver procesos de PM2
pm2 list

# Ver todos los procesos de Node.js
ps aux | grep node | grep -v grep

# Ver puertos en uso
sudo ss -tulpn | grep -E ':(300[0-9]|3010)'
```

### 3. Verificar qué está respondiendo en cada puerto

```bash
# Verificar puerto 3000 (posible producción)
curl -I http://localhost:3000

# Verificar puerto 3001 (QA)
curl -I http://localhost:3001

# Ver qué proceso está usando cada puerto
sudo lsof -i :3000
sudo lsof -i :3001
```

## Solución

### Opción 1: Deshabilitar producción y dejar solo QA

Si solo quieres que QA funcione:

```bash
# 1. Ver configuración de producción
sudo cat /etc/nginx/sites-enabled/inamiunah.online.conf
# o
sudo cat /etc/nginx/conf.d/inamiunah.online.conf

# 2. Deshabilitar la configuración de producción
sudo mv /etc/nginx/sites-enabled/inamiunah.online.conf /etc/nginx/sites-enabled/inamiunah.online.conf.disabled
# o
sudo rm /etc/nginx/sites-enabled/inamiunah.online.conf

# 3. Verificar que solo QA esté habilitado
sudo ls -la /etc/nginx/sites-enabled/

# 4. Verificar configuración de Nginx
sudo nginx -t

# 5. Recargar Nginx
sudo systemctl reload nginx
```

### Opción 2: Configurar Nginx correctamente

Si quieres que ambas URLs funcionen pero apunten a diferentes servidores:

#### Configuración para QA (`/etc/nginx/sites-enabled/qa.inamiunah.online.conf`):

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

    ssl_certificate /ruta/a/tu/certificado.crt;
    ssl_certificate_key /ruta/a/tu/llave.key;

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
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

#### Configuración para Producción (deshabilitar o apuntar a otro servidor):

```bash
# Si quieres deshabilitar producción completamente:
sudo mv /etc/nginx/sites-enabled/inamiunah.online.conf /etc/nginx/sites-enabled/inamiunah.online.conf.disabled

# O si quieres que apunte a otro puerto/servidor:
# Editar el archivo y cambiar el proxy_pass
```

### Opción 3: Verificar que QA esté corriendo correctamente

```bash
# 1. Verificar que inami-qa está corriendo
pm2 status

# 2. Verificar que responde en localhost:3001
curl http://localhost:3001

# 3. Ver logs de PM2
pm2 logs inami-qa --lines 30

# 4. Si no responde, reiniciar
pm2 restart inami-qa
```

## Comandos Rápidos de Diagnóstico

```bash
# Ver configuración completa de Nginx
sudo nginx -T | grep -B 5 -A 25 "server_name"

# Ver logs de acceso de Nginx en tiempo real
sudo tail -f /var/log/nginx/access.log

# Ver logs de error de Nginx
sudo tail -f /var/log/nginx/error.log

# Verificar estado de Nginx
sudo systemctl status nginx
```

## Pasos Recomendados

1. **Verificar configuración de Nginx:**
   ```bash
   sudo nginx -T | grep -A 30 "server_name"
   ```

2. **Verificar qué procesos están corriendo:**
   ```bash
   pm2 list
   ps aux | grep node | grep -v grep
   ```

3. **Verificar qué responde en cada puerto:**
   ```bash
   curl http://localhost:3000
   curl http://localhost:3001
   ```

4. **Deshabilitar producción si no debería estar activa:**
   ```bash
   sudo mv /etc/nginx/sites-enabled/inamiunah.online.conf /etc/nginx/sites-enabled/inamiunah.online.conf.disabled
   sudo nginx -t
   sudo systemctl reload nginx
   ```

5. **Verificar que QA funciona:**
   ```bash
   curl http://localhost:3001
   pm2 logs inami-qa --lines 20
   ```

## Si QA se queda en blanco

Posibles causas:
1. El servidor no está respondiendo
2. Error de JavaScript en el cliente
3. Problema de CORS
4. Error en la aplicación

**Verificar:**
```bash
# Ver logs de PM2
pm2 logs inami-qa --err --lines 50

# Ver logs de Nginx
sudo tail -f /var/log/nginx/error.log

# Verificar que el servidor responde
curl -v http://localhost:3001
```
