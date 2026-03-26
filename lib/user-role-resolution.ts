import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * IDs de roles efectivos del usuario: primero `user_roles`, si está vacío
 * cae a `profiles.role` → tabla `roles.nombre` (compatibilidad con datos legacy).
 * Funciona con cliente sesión (middleware) o service role (API).
 */
export async function getRoleIdsForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<string[]> {
  const { data: userRoles, error: urErr } = await supabase
    .from('user_roles')
    .select('role_id')
    .eq('user_id', userId)

  if (urErr) {
    console.warn('[getRoleIdsForUser] user_roles:', urErr.message)
  }

  const fromAssignments =
    userRoles?.map((r: { role_id: string }) => r.role_id).filter(Boolean) ?? []
  if (fromAssignments.length > 0) {
    return [...new Set(fromAssignments)]
  }

  const { data: profile, error: pErr } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()

  if (pErr || !profile?.role) {
    return []
  }

  const { data: roleRow, error: rErr } = await supabase
    .from('roles')
    .select('id')
    .eq('nombre', profile.role)
    .maybeSingle()

  if (rErr || !roleRow?.id) {
    return []
  }

  return [roleRow.id]
}
