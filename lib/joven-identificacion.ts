import type { Joven } from '@/lib/supabase'

/** Nombre completo a partir del registro del joven (evita duplicar la concatenación en cada formulario). */
export function nombreCompletoDesdeJoven(j: Pick<Joven, 'nombres' | 'apellidos'>): string {
  return `${j.nombres || ''} ${j.apellidos || ''}`.trim()
}

/**
 * Fecha de nacimiento en formato `YYYY-MM-DD` para inputs `type="date"`.
 */
export function fechaNacimientoParaInput(j: Pick<Joven, 'fecha_nacimiento'>): string {
  if (!j.fecha_nacimiento) return ''
  return j.fecha_nacimiento.slice(0, 10)
}

export type PatchIdentificacionNnaj = {
  nombreCompleto?: string
  fechaNacimiento?: string
  edad?: number
}

/**
 * Campos típicos de identificación del NNAJ que muchas fichas repiten.
 * Pasar solo las claves que existan en el estado del formulario.
 */
export function patchIdentificacionDesdeJoven<T extends Record<string, unknown>>(
  prev: T,
  joven: Pick<Joven, 'nombres' | 'apellidos' | 'fecha_nacimiento' | 'edad'>,
  keys: {
    nombreCompleto?: keyof T
    fechaNacimiento?: keyof T
    edad?: keyof T
  }
): T {
  const next = { ...prev }
  if (keys.nombreCompleto) {
    ;(next as any)[keys.nombreCompleto] = nombreCompletoDesdeJoven(joven)
  }
  if (keys.fechaNacimiento) {
    ;(next as any)[keys.fechaNacimiento] = fechaNacimientoParaInput(joven)
  }
  if (keys.edad !== undefined) {
    ;(next as any)[keys.edad] = joven.edad ?? (next as any)[keys.edad]
  }
  return next
}
