# Limpieza para desplegar en VPS

Resumen de lo revisado y lo que se limpió para que el proyecto no suba código que pueda interferir o llenar logs en producción.

---

## ✅ Cambios realizados (ya aplicados)

### 1. **app/auth/callback/route.ts**
- Eliminados todos los `console.log` del flujo de recuperación (evita llenar logs del servidor y exponer detalles del flujo).
- Errores reales: solo se registra en desarrollo con `NODE_ENV === 'development'`.

### 2. **app/login/page.tsx**
- Eliminados `console.log` y `console.warn` de login exitoso, sesión, perfil y redirección.
- Errores (perfil, log de login) solo en desarrollo donde aplica.
- **Estado de carga al ingresar:** el botón y un recuadro muestran "Iniciando sesión..." hasta que se redirige al dashboard o se muestra error; compatible con VPS (solo React, rutas relativas `/api/`, sin lógica por entorno).

### 3. **middleware.ts**
- Eliminados todos los `console.log` y `console.warn` de la verificación de acceso admin (se ejecuta en cada request; en producción llenaba los logs).

### 4. **components/Navbar.tsx**
- Eliminados los `useEffect` de debug que hacían log del perfil y del panel admin.
- Eliminados `console.log` del render y de los clics en “Panel Admin” (desktop y móvil).
- El `catch` del rol solo hace `console.error` en desarrollo.

---

## ⚠️ Pendiente opcional (no bloquea el VPS)

### **lib/auth.ts**
- Tiene muchos `console.log` de depuración (useAuth, getInitialSession, etc.).
- **Efecto:** en producción pueden llenar los logs de PM2.
- **Recomendación:** si los logs del VPS crecen mucho, puedes envolver esos logs en `if (process.env.NODE_ENV === 'development')` o eliminarlos.

### **APIs y páginas con console.log**
- Varias rutas en `app/api/` (jovenes, users, auth/reset-password, etc.) y páginas del dashboard hacen `console.log` de datos o estados.
- **Efecto:** en servidor solo afectan los logs (PM2/archivos .log), no la respuesta al usuario.
- **Recomendación:** para producción puedes ir quitando los que imprimen cuerpos de petición/respuesta completos (por seguridad y tamaño de log). Los `console.error` para errores reales conviene dejarlos.

### **Formularios (entrevista-inicial, etc.)**
- Algunos hacen `console.log('FormData completo:', formData)` o similar.
- **Recomendación:** quitar en producción para no volcar datos sensibles a logs.

---

## 🔒 .gitignore y despliegue

- **.env.local** y **.env** con secretos no deben subirse (comprueba que estén en `.gitignore`; por defecto `.env.local` suele estar).
- En el VPS usa un `.env` o variables de entorno del sistema con `NEXT_PUBLIC_SITE_URL`, `SUPABASE_*`, etc.; no copies `.env.local` del PC.
- Los scripts y docs temporales que ya están en `.gitignore` (diagnóstico nginx, configs duplicadas, etc.) no se suben con `git push`.

---

## 📋 Checklist antes de subir al VPS

- [ ] `git status` sin archivos sensibles (no commitear `.env.local` ni claves).
- [ ] `npm run build` sin errores.
- [ ] En el VPS: `NEXT_PUBLIC_SITE_URL` y variables de Supabase configuradas.
- [ ] En el VPS: después de `git pull`, ejecutar `npm run build` y `pm2 restart`.

Con los cambios aplicados, el callback, login, middleware y Navbar ya no generan logs de depuración en producción; el resto es opcional según cuánto quieras limitar el tamaño y contenido de los logs en el VPS.
