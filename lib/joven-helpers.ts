import type { Joven } from '@/lib/supabase'

type JovenEdadInput = Pick<Joven, 'edad' | 'fecha_nacimiento'> | null | undefined

/**
 * Usa `edad` de BD si es un número > 0; si no, calcula desde `fecha_nacimiento`.
 * Evita quedar en 0 cuando el buscador trae un joven que no está en la lista local de Supabase.
 */
export function edadDesdeJoven(joven: JovenEdadInput): number {
  if (!joven) return 0
  const dbEdad = joven.edad
  if (typeof dbEdad === 'number' && dbEdad > 0) return dbEdad

  const fn = joven.fecha_nacimiento
  if (!fn) return typeof dbEdad === 'number' ? Math.max(0, dbEdad) : 0

  const birth = new Date(fn)
  if (Number.isNaN(birth.getTime())) return 0

  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return Math.max(0, age)
}
