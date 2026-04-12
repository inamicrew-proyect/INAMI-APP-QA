import type { SupabaseClient } from '@supabase/supabase-js'
import {
  type EstadoJovenCatalogo,
  isLegacyJovenEstadoCodigo,
} from '@/lib/joven-estados'

type AdminLike = Pick<SupabaseClient, 'from'>

export async function listEstadosJovenRows(admin: AdminLike): Promise<{
  rows: EstadoJovenCatalogo[] | null
  error?: string
}> {
  const { data, error } = await admin
    .from('estados_joven')
    .select('id, codigo, nombre, orden, activo, cuenta_como_activo')
    .order('orden', { ascending: true })

  if (error) {
    const msg = error.message ?? ''
    if (
      error.code === '42P01' ||
      msg.includes('estados_joven') ||
      msg.toLowerCase().includes('does not exist') ||
      msg.toLowerCase().includes('no existe')
    ) {
      return { rows: null }
    }
    return { rows: null, error: error.message }
  }

  return { rows: (data ?? []) as EstadoJovenCatalogo[] }
}

export async function getEstadoJovenByCodigo(
  admin: AdminLike,
  codigo: string
): Promise<EstadoJovenCatalogo | null> {
  const { data, error } = await admin
    .from('estados_joven')
    .select('id, codigo, nombre, orden, activo, cuenta_como_activo')
    .eq('codigo', codigo)
    .maybeSingle()

  if (error || !data) return null
  return data as EstadoJovenCatalogo
}

/** Código por defecto al crear joven (preferir “operativos” del catálogo). */
export function pickDefaultEstadoCodigo(rows: EstadoJovenCatalogo[] | null): string {
  if (rows && rows.length > 0) {
    const selectable = rows.filter((r) => r.activo)
    const prefer = selectable.find((r) => r.cuenta_como_activo)
    if (prefer) return prefer.codigo
    if (selectable[0]) return selectable[0].codigo
    if (rows[0]) return rows[0].codigo
  }
  return 'activo'
}

export async function assertEstadoValidForCreate(
  admin: AdminLike,
  codigo: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { rows, error } = await listEstadosJovenRows(admin)
  if (error) {
    return { ok: false, message: error }
  }
  if (!rows || rows.length === 0) {
    if (isLegacyJovenEstadoCodigo(codigo)) return { ok: true }
    return { ok: false, message: 'Estado de joven no válido.' }
  }
  const row = rows.find((r) => r.codigo === codigo)
  if (!row) {
    return { ok: false, message: 'El estado indicado no existe en el catálogo.' }
  }
  if (!row.activo) {
    return { ok: false, message: 'Ese estado está desactivado en el catálogo y no se puede asignar a nuevos registros.' }
  }
  return { ok: true }
}

export async function assertEstadoValidForUpdate(
  admin: AdminLike,
  codigo: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { rows, error } = await listEstadosJovenRows(admin)
  if (error) {
    return { ok: false, message: error }
  }
  if (!rows || rows.length === 0) {
    if (isLegacyJovenEstadoCodigo(codigo)) return { ok: true }
    return { ok: false, message: 'Estado de joven no válido.' }
  }
  const row = rows.find((r) => r.codigo === codigo)
  if (!row) {
    return { ok: false, message: 'El estado indicado no existe en el catálogo.' }
  }
  return { ok: true }
}

export async function countJovenesWithEstado(
  admin: AdminLike,
  codigo: string
): Promise<number> {
  const { count, error } = await admin
    .from('jovenes')
    .select('id', { count: 'exact', head: true })
    .eq('estado', codigo)

  if (error) return 0
  return count ?? 0
}
