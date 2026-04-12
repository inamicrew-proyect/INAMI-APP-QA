/**
 * Perfiles pueden usar `admin` (legacy) o `ADMINISTRADOR` (como en catálogo roles / UI).
 * Sin esto, usuarios con rol administrador en BD no pasan los checks de API ni middleware.
 */
export function isProfileAdminRole(role: string | null | undefined): boolean {
  if (role == null || role === '') return false
  const r = role.trim()
  if (r === 'admin' || r === 'ADMINISTRADOR') return true
  const lower = r.toLowerCase()
  return lower === 'admin' || lower === 'administrador'
}
