# El enlace de recuperación expira al instante o "otp_expired"

Si al hacer clic en el enlace del correo de recuperación ves **"Email link is invalid or has expired"** nada más llegar el correo, suele ser por una de estas causas:

---

## 1. Revisar la validez del enlace en Supabase

El tiempo de validez del enlace se configura en el proyecto de Supabase:

1. Entra en **[Supabase Dashboard](https://supabase.com/dashboard)** → tu proyecto.
2. Ve a **Authentication** → **Providers** o **Email** (o **Settings** dentro de Authentication).
3. Busca opciones como **"Email OTP expiry"**, **"Magic link expiry"**, **"Recovery link expiry"** o **"Token expiry"** (en segundos).
4. Si está en un valor muy bajo (p. ej. 60 segundos), **súbelo** a **3600** (1 hora) o más.
5. Guarda los cambios.

Si no ves esa opción en la interfaz, puede estar en **Project Settings** → **Authentication** o en la pestaña de **Email**. La documentación actual de Supabase la suele ubicar en la configuración de Auth.

---

## 2. El enlace se “consume” antes de que hagas clic (prefetch)

Algunos clientes de correo (Outlook, Apple Mail, Gmail en algunos casos) o herramientas de seguridad **abren las URLs en segundo plano** para comprobar que no son maliciosas. Eso **usa el enlace una sola vez** y cuando tú haces clic, Supabase responde que ya expiró o que es inválido.

**Qué hacer:**

- **Abrir el enlace en otro navegador o dispositivo:** p. ej. copiar la URL del botón del correo y pegarla en Chrome/Firefox en modo incógnito, o en el móvil.
- **Desactivar la “vista previa” o “protección de enlaces”** del cliente de correo si tiene esa opción (no siempre es posible).
- **Solicitar un nuevo enlace** y abrirlo **solo una vez**, en una ventana normal del navegador, sin que el correo esté en segundo plano en otro sitio.

---

## 3. Comprobar la hora del sistema (menos frecuente)

Si el servidor o tu equipo tienen la **hora mal configurada**, el token puede considerarse expirado. En un VPS:

```bash
date
# Debe coincidir con la hora real (timezone correcto)
```

Si usas el correo desde tu PC, revisa que la hora de Windows/Mac sea la correcta.

---

## Resumen

1. **Sube el “Email OTP expiry”** en Supabase a 3600 segundos (1 h) o más.  
2. **Evita que el enlace se abra dos veces:** no uses “vista previa” del correo para hacer clic; copia la URL y ábrela en el navegador, o pide un enlace nuevo y ábrelo una sola vez.  
3. Si sigue fallando, comprueba la **hora del sistema** en el equipo desde el que abres el enlace y, si aplica, en el VPS.
