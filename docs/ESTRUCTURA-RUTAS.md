# Estructura de rutas y carpetas - INAMI

Este documento describe la jerarquía de rutas de la aplicación y su relación con lo que el usuario ve en pantalla y con las carpetas del proyecto.

## Regla importante

**Las URLs no deben cambiarse sin actualizar también:**

- La tabla `modulos` en la base de datos (campo `ruta`)
- Todos los `href`, `router.push()` y `redirect()` en el código
- El middleware y los hooks de permisos (`canView(ruta)`)

Por eso se usa **una única fuente de verdad** en `lib/routes.ts`. Todas las rutas deben referenciarse desde ahí.

---

## Jerarquía (lo que sale en pantalla)

```
Inicio (Dashboard)
├── Inicio          → /dashboard
├── Jóvenes         → /dashboard/jovenes
├── Atenciones      → /dashboard/atenciones
├── Notificaciones  → /dashboard/notificaciones
├── Configuración   → /dashboard/configuracion
│   └── Preguntas secretas → /dashboard/configuracion/preguntas-secretas
├── Seguridad       → /dashboard/seguridad
├── Mi perfil       → /dashboard/usuarios/:id
└── Panel Admin     → /dashboard/admin  (solo administradores)
    ├── Usuarios    → /dashboard/admin/usuarios
    ├── Roles       → /dashboard/admin/roles
    └── Seguridad   → /dashboard/admin/seguridad
```

## Correspondencia carpeta ↔ pantalla

| Carpeta en `app/` | Nombre en pantalla | Ruta |
|-------------------|--------------------|------|
| `dashboard/page.tsx` | Inicio | `/dashboard` |
| `dashboard/jovenes/` | Jóvenes | `/dashboard/jovenes` |
| `dashboard/atenciones/` | Atenciones | `/dashboard/atenciones` |
| `dashboard/notificaciones/` | Notificaciones | `/dashboard/notificaciones` |
| `dashboard/configuracion/` | Configuración | `/dashboard/configuracion` |
| `dashboard/seguridad/` | Seguridad | `/dashboard/seguridad` |
| `dashboard/usuarios/` | Perfil de usuario | `/dashboard/usuarios/:id` |
| `dashboard/admin/` | Panel Administrador | `/dashboard/admin` |
| `dashboard/admin/usuarios/` | Usuarios (admin) | `/dashboard/admin/usuarios` |
| `dashboard/admin/roles/` | Roles | `/dashboard/admin/roles` |
| `dashboard/admin/seguridad/` | Seguridad del sistema | `/dashboard/admin/seguridad` |

## Uso en código

```ts
import { Routes } from '@/lib/routes'

// En lugar de strings sueltos:
<Link href={Routes.DASHBOARD}>Inicio</Link>
<Link href={Routes.JOVENES}>Jóvenes</Link>
router.push(Routes.adminUsuarioEditar(userId))
```

## Base de datos (módulos)

La tabla `modulos` almacena las rutas para permisos. Los valores actuales deben coincidir con las constantes en `lib/routes.ts`:

- `/dashboard` (Dashboard)
- `/dashboard/jovenes` (Jóvenes)
- `/dashboard/atenciones` (Atenciones)
- `/dashboard/notificaciones` (Notificaciones)
- `/dashboard/admin` (Panel Administrador)

Si se añade o cambia una ruta en el código, hay que actualizar también la base de datos y este documento.
