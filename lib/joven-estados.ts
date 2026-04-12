/** Tipos y constantes compartidas para el catálogo `estados_joven`. */

export type EstadoJovenCatalogo = {
  id: string
  codigo: string
  nombre: string
  orden: number
  activo: boolean
  cuenta_como_activo: boolean
}

/** Si la tabla no existe aún, la API acepta estos códigos (comportamiento previo + inactivo). */
export const JOVEN_ESTADO_LEGACY_CODIGOS = ['activo', 'egresado', 'transferido', 'inactivo'] as const

export const JOVEN_ESTADO_CODIGO_REGEX = /^[a-z0-9_]{1,40}$/

export function isLegacyJovenEstadoCodigo(codigo: string): boolean {
  return (JOVEN_ESTADO_LEGACY_CODIGOS as readonly string[]).includes(codigo)
}
