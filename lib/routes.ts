/**
 * Rutas de la aplicación INAMI - Fuente única de verdad
 *
 * Estructura jerárquica (lo que el usuario ve en pantalla):
 *
 *   /                          → Página de inicio (login si no autenticado)
 *   /login                     → Inicio de sesión
 *   /register                  → Registro
 *   /reset-password            → Recuperar contraseña
 *   /dashboard                 → INICIO (panel principal)
 *   /dashboard/jovenes        → JÓVENES (gestión de menores)
 *   /dashboard/atenciones     → ATENCIONES (gestión de atenciones)
 *   /dashboard/citas          → CITAS (agenda de citas para jóvenes)
 *   /dashboard/notificaciones → NOTIFICACIONES
 *   /dashboard/configuracion  → CONFIGURACIÓN (y preguntas secretas)
 *   /dashboard/seguridad      → redirige a /dashboard/admin si hay acceso; si no, mensaje informativo
 *   /dashboard/usuarios/:id   → Mi perfil / Perfil de usuario
 *   /dashboard/admin          → PANEL ADMINISTRADOR
 *   /dashboard/admin/usuarios → Usuarios (admin)
 *   /dashboard/admin/roles    → Roles (admin)
 *   /dashboard/admin/seguridad → Seguridad del sistema (admin)
 */

export const Routes = {
  // Públicas / Auth
  HOME: '/',
  LOGIN: '/login',
  LOGIN_VERIFY_2FA: '/login/verify-2fa',
  REGISTER: '/register',
  RESET_PASSWORD: '/reset-password',
  AUTH_CALLBACK: '/auth/callback',
  AUTH_REDIRECT: '/auth/redirect',

  // Dashboard - Vista principal (lo que sale en menú como "Inicio")
  DASHBOARD: '/dashboard',

  // Dashboard - Jóvenes (menú "Jóvenes")
  JOVENES: '/dashboard/jovenes',
  JOVENES_NUEVO: '/dashboard/jovenes/nuevo',
  jovenId: (id: string) => `/dashboard/jovenes/${id}` as const,
  jovenEditar: (id: string) => `/dashboard/jovenes/${id}/editar` as const,
  jovenExpediente: (id: string) => `/dashboard/jovenes/${id}/expediente` as const,

  // Dashboard - Atenciones (menú "Atenciones")
  ATENCIONES: '/dashboard/atenciones',
  ATENCIONES_NUEVA: '/dashboard/atenciones/nueva',
  atencionId: (id: string) => `/dashboard/atenciones/${id}` as const,
  atencionEditar: (id: string) => `/dashboard/atenciones/${id}/editar` as const,
  ATENCIONES_FORMULARIOS: '/dashboard/atenciones/formularios',

  // Dashboard - Citas (menú "Citas")
  CITAS: '/dashboard/citas',

  // Dashboard - Notificaciones (menú "Notificaciones")
  NOTIFICACIONES: '/dashboard/notificaciones',

  // Dashboard - Configuración (menú / acciones rápidas)
  CONFIGURACION: '/dashboard/configuracion',
  CONFIGURACION_PREGUNTAS_SECRETAS: '/dashboard/configuracion/preguntas-secretas',

  // Dashboard - Seguridad (usuario)
  SEGURIDAD: '/dashboard/seguridad',

  // Dashboard - Perfil de usuario (mi perfil / usuarios/:id)
  usuarioId: (id: string) => `/dashboard/usuarios/${id}` as const,
  usuarioEditar: (id: string) => `/dashboard/usuarios/${id}/editar` as const,
  USUARIOS_NUEVO: '/dashboard/usuarios/nuevo',

  // Panel Administrador (menú "Panel Admin") - rutas deben coincidir con tabla modulos.ruta
  ADMIN: '/dashboard/admin',
  ADMIN_USUARIOS: '/dashboard/admin/usuarios',
  ADMIN_USUARIOS_NUEVO: '/dashboard/admin/usuarios/nuevo',
  adminUsuarioId: (id: string) => `/dashboard/admin/usuarios/${id}` as const,
  adminUsuarioEditar: (id: string) => `/dashboard/admin/usuarios/${id}/editar` as const,
  adminUsuarioPermisos: (id: string) => `/dashboard/admin/usuarios/${id}/permisos` as const,
  ADMIN_ROLES: '/dashboard/admin/roles',
  ADMIN_ROLES_NUEVO: '/dashboard/admin/roles/nuevo',
  adminRolId: (id: string) => `/dashboard/admin/roles/${id}` as const,
  adminRolEditar: (id: string) => `/dashboard/admin/roles/${id}/editar` as const,
  adminRolPermisos: (id: string) => `/dashboard/admin/roles/${id}/permisos` as const,
  ADMIN_SEGURIDAD: '/dashboard/admin/seguridad',
} as const

/**
 * Query en `/reset-password` cuando el usuario llega del enlace del correo (callback/set-session).
 * Evita activar el flujo de preguntas secretas aunque la URL lleve otros parámetros.
 */
export const RESET_PASSWORD_FROM_EMAIL_PARAM = 'from' as const
export const RESET_PASSWORD_FROM_EMAIL_VALUE = 'recovery-email' as const

export function resetPasswordEmailRecoveryPath(): string {
  return `${Routes.RESET_PASSWORD}?${RESET_PASSWORD_FROM_EMAIL_PARAM}=${RESET_PASSWORD_FROM_EMAIL_VALUE}`
}

export function resetPasswordEmailRecoveryAbsoluteUrl(origin: string): string {
  const base = origin.replace(/\/$/, '')
  return `${base}${resetPasswordEmailRecoveryPath()}`
}

export type RoutePath = typeof Routes[keyof typeof Routes] | string
