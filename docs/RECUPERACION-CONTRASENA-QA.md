# Recuperación de contraseña en QA (qa.inamiunah.online)

Para que "¿Olvidaste tu contraseña?" funcione en **https://qa.inamiunah.online**, haz lo siguiente.

---

## 1. Variable de entorno en el servidor QA

En el VPS donde está desplegada la app, en el archivo de entorno (`.env`, `.env.production` o el que use PM2) debe estar:

```env
NEXT_PUBLIC_SITE_URL=https://qa.inamiunah.online
```

- Usa **HTTPS** y el dominio exacto (sin barra final).
- Después de cambiar: **npm run build** y **pm2 restart inami-qa** (o el comando que uses).

Así el enlace del correo de recuperación apuntará a tu QA.

---

## 2. Supabase – Redirect URLs

En **Supabase Dashboard** → **Authentication** → **URL Configuration** → **Redirect URLs** añade:

```
https://qa.inamiunah.online/**
```

Guarda. Si esta URL no está en la lista, Supabase rechazará el enlace del correo.

---

## 3. Site URL en Supabase (recomendado)

En la misma sección **URL Configuration**, en **Site URL** pon:

```
https://qa.inamiunah.online
```

---

## 4. Probar

1. Entra a **https://qa.inamiunah.online/login**.
2. Clic en "¿Olvidaste tu contraseña?" e introduce un correo de prueba.
3. Abre el correo y haz clic en el enlace (o copia la URL y pégala en el navegador).
4. Deberías llegar a la página de **Cambiar contraseña** en el mismo dominio QA.

Si el enlace del correo lleva a otra URL, revisa que `NEXT_PUBLIC_SITE_URL` en el **servidor** sea exactamente `https://qa.inamiunah.online` y que hayas hecho **build** y **reinicio** después de cambiarla.
