# Instrucciones para Diagnosticar el Problema de URLs

## Problema
Tienes dos URLs funcionando:
- `https://qa.inamiunah.online/` (debería estar activa)
- `https://inamiunah.online/` (no debería estar activa si solo está corriendo `inami-qa`)

## Pasos para Diagnosticar

### 1. Verificar procesos de PM2

```bash
pm2 list .
```

Esto mostrará todos los procesos de PM2. Deberías ver solo `inami-qa` si es el único que está corriendo.

### 2. Verificar todos los procesos de Node.js

```bash
ps aux | grep node | grep -v grep
```

Esto mostrará todos los procesos de Node.js corriendo, incluso si no están en PM2.

### 3. Verificar puertos en uso

```bash
# Opción 1 (si tienes netstat)
netstat -tulpn | grep -E ':(300[0-9]|3010)'

# Opción 2 (si tienes ss)
ss -tulpn | grep -E ':(300[0-9]|3010)'
```

Esto mostrará qué puertos están en uso y qué procesos los están usando.

### 4. Verificar configuración de Nginx

```bash
# Ver todas las configuraciones de Nginx
sudo ls -la /etc/nginx/sites-enabled/
# o
sudo ls -la /etc/nginx/conf.d/

# Ver el contenido de las configuraciones
sudo cat /etc/nginx/sites-enabled/*.conf | grep -A 10 -B 5 "inami"
```

### 5. Ejecutar script de diagnóstico completo

```bash
# Subir el script al VPS (si no lo tienes)
# O ejecutar los comandos manualmente

# Dar permisos de ejecución
chmod +x scripts/diagnostico-vps.sh
####
# Ejecutar
./scripts/diagnostico-vps.sh
```

## Posibles Causas

### Causa 1: Múltiples procesos de PM2
Puede haber otro proceso de PM2 corriendo (por ejemplo, `inami-prod` o `inami`).

**Solución:**
```bash
# Ver todos los procesos
pm2 list

# Detener el proceso que no debería estar corriendo
pm2 delete nombre-del-proceso

# Guardar cambios
pm2 save
```

### Causa 2: Proceso de Node.js fuera de PM2
Puede haber un proceso de Node.js corriendo directamente (no a través de PM2).

**Solución:**
```bash
# Encontrar el proceso
ps aux | grep node

# Matar el proceso (reemplaza PID con el número del proceso)
kill -9 PID

# O si es un proceso específico en un puerto
lsof -ti:3000 | xargs kill -9  # Para puerto 3000
lsof -ti:3001 | xargs kill -9  # Para puerto 3001
```

### Causa 3: Configuración de Nginx incorrecta
Nginx puede estar configurado para redirigir ambas URLs al mismo servidor.

**Solución:**
Revisa los archivos de configuración de Nginx:

```bash
# Ver configuración para qa.inamiunah.online
sudo grep -r "qa.inamiunah.online" /etc/nginx/

# Ver configuración para inamiunah.online
sudo grep -r "inamiunah.online" /etc/nginx/ | grep -v "qa.inamiunah.online"
```

Luego edita la configuración para que `inamiunah.online` apunte a un servidor diferente o esté deshabilitado:

```bash
sudo nano /etc/nginx/sites-enabled/inamiunah.online.conf
# o
sudo nano /etc/nginx/conf.d/inamiunah.online.conf
```

### Causa 4: Múltiples instancias de la aplicación
Puede haber dos builds diferentes corriendo en diferentes puertos.

**Solución:**
```bash
# Verificar qué hay en cada puerto
curl http://localhost:3000
curl http://localhost:3001

# Verificar qué proceso está usando cada puerto
sudo lsof -i :3000
sudo lsof -i :3001
```

## Solución Recomendada

1. **Identificar qué proceso está sirviendo cada URL:**
   ```bash
   # Ver logs de Nginx para identificar qué backend está usando
   sudo tail -f /var/log/nginx/access.log
   # Luego accede a ambas URLs y verifica en los logs
   ```

2. **Detener el proceso que no debería estar corriendo:**
   ```bash
   # Si es un proceso de PM2
   pm2 delete nombre-del-proceso-incorrecto
   
   # Si es un proceso directo de Node.js
   ps aux | grep node
   kill -9 PID
   ```

3. **Verificar que solo `inami-qa` esté corriendo:**
   ```bash
   pm2 list
   # Deberías ver solo inami-qa
   ```

4. **Verificar que Nginx esté configurado correctamente:**
   ```bash
   # Verificar configuración
   sudo nginx -t
   
   # Recargar Nginx
   sudo systemctl reload nginx
   ```

## Comandos Rápidos de Verificación

```bash
# Ver todos los procesos de PM2
pm2 list

# Ver todos los procesos de Node.js
ps aux | grep node | grep -v grep

# Ver puertos en uso
ss -tulpn | grep -E ':(300[0-9]|3010)'

# Ver configuración de Nginx
sudo nginx -T | grep -A 20 "server_name"

# Ver logs de acceso de Nginx en tiempo real
sudo tail -f /var/log/nginx/access.log
```

## Después de Identificar el Problema

Una vez que identifiques qué proceso está sirviendo `inamiunah.online`, puedes:

1. **Si es un proceso de PM2:** Detenerlo con `pm2 delete nombre-proceso`
2. **Si es un proceso directo:** Matarlo con `kill -9 PID`
3. **Si es una configuración de Nginx:** Editar la configuración para deshabilitarlo o redirigirlo
