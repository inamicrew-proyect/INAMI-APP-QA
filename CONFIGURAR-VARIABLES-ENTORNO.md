# Configuración de Variables de Entorno en el VPS

## Variables Necesarias

Tu aplicación necesita las siguientes variables de entorno:

### Variables de Supabase:
1. **NEXT_PUBLIC_SUPABASE_URL** - URL de tu proyecto Supabase
2. **NEXT_PUBLIC_SUPABASE_ANON_KEY** - Clave pública (anon) de Supabase
3. **SUPABASE_SERVICE_ROLE_KEY** - Clave de servicio (service_role) de Supabase (para funciones administrativas)

### Variables de Producción:
4. **NEXT_PUBLIC_SITE_URL** - URL completa de tu aplicación en producción (⚠️ CRÍTICO)
   - **IMPORTANTE:** Debe ser la URL completa con HTTPS
   - Ejemplo correcto: `https://qa.inamiunah.online`
   - ❌ NO uses: `http://31.220.20.232:3000` o `localhost`
   - Esta variable se usa para redirecciones y callbacks de autenticación

## Cómo Obtener las Claves de Supabase

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Ve a **Settings** > **API**
3. Encontrarás:
   - **Project URL** → Esta es tu `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → Esta es tu `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → Esta es tu `SUPABASE_SERVICE_ROLE_KEY` (⚠️ MANTÉN ESTA SECRETA)

## Configurar en el VPS

### Opción 1: Crear archivo .env.local (Recomendado)

```bash
cd ~/INAMI.APP

# Crear el archivo .env.local
nano .env.local
```

Pega el siguiente contenido (reemplaza con tus valores reales):

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-aqui

# Producción - URL completa con HTTPS (IMPORTANTE)
NEXT_PUBLIC_SITE_URL=https://qa.inamiunah.online

# Entorno
NODE_ENV=production
```

**⚠️ IMPORTANTE sobre NEXT_PUBLIC_SITE_URL:**
- Debe ser la URL completa con HTTPS de tu dominio
- NO uses IPs ni localhost
- Esta variable es crítica para que funcionen correctamente:
  - Redirecciones después de login
  - Callbacks de autenticación
  - Enlaces en correos electrónicos
  - Funcionalidad de logout

Guarda el archivo (Ctrl+O, Enter, Ctrl+X en nano)

### Opción 2: Usar el script de configuración

```bash
cd ~/INAMI.APP
chmod +x scripts/configurar-env.sh
./scripts/configurar-env.sh
```

## Verificar la Configuración

```bash
# Verificar que el archivo existe
ls -la .env.local

# Verificar que las variables están configuradas (sin mostrar los valores completos)
cat .env.local | grep -E "NEXT_PUBLIC_SUPABASE_URL|NEXT_PUBLIC_SUPABASE_ANON_KEY|SUPABASE_SERVICE_ROLE_KEY" | sed 's/=.*/=***/'

# O usar el script de verificación
npm run verificar-config
```

## Reiniciar la Aplicación

Después de configurar las variables, reinicia PM2:

```bash
pm2 restart inami-app
pm2 logs inami-app
```

## Importante

- ⚠️ **NUNCA** subas el archivo `.env.local` a Git
- ⚠️ **NUNCA** compartas tu `SUPABASE_SERVICE_ROLE_KEY` públicamente
- ✅ El archivo `.env.local` ya debería estar en `.gitignore`

