/** Indica si el usuario debe cambiar la contraseña temporal (metadato en Supabase Auth). */
export function userMustChangePassword(user: {
  user_metadata?: Record<string, unknown> | null
} | null): boolean {
  if (!user) return false
  const m = user.user_metadata?.must_change_password
  return m === true || m === 'true'
}
