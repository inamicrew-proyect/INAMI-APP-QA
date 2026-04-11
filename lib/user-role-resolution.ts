import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * IDs de roles efectivos: unión de `user_roles` y el rol inferido desde
 * `profiles.role` → `roles.nombre`. Así un usuario con filas en `user_roles`
 * sigue acumulando permisos de su rol de perfil (p. ej. admin) y viceversa.
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

  const { data: profile, error: pErr } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()

  let fromProfile: string[] = []
  if (!pErr && profile?.role) {
    const { data: roleRow, error: rErr } = await supabase
      .from('roles')
      .select('id')
      .eq('nombre', profile.role)
      .maybeSingle()
    if (!rErr && roleRow?.id) {
      fromProfile = [roleRow.id]
    }
  }

  const merged = [...new Set([...fromAssignments, ...fromProfile])]
  return merged
}
