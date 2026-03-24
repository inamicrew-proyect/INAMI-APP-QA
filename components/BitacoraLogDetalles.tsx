'use client'

import { useMemo } from 'react'

const ETIQUETA_CAMPO: Record<string, string> = {
  email: 'Correo electrónico',
  full_name: 'Nombre completo',
  role: 'Rol',
  photo_url: 'Foto de perfil',
  nombre: 'Nombre',
  descripcion: 'Descripción',
  activo: 'Activo',
  joven_id: 'ID joven',
  atencion_id: 'ID atención',
  tipo_atencion_id: 'Tipo de atención',
  profesional_id: 'Profesional asignado',
  motivo: 'Motivo',
  estado: 'Estado',
  tipo: 'Tipo',
  account_status: 'Estado de cuenta',
  old_role: 'Rol anterior',
  new_role: 'Rol nuevo',
  changed_by: 'Modificado por (usuario)',
  created_by: 'Creado por (usuario)',
  updated_by: 'Actualizado por (usuario)',
  deleted_by: 'Eliminado por (usuario)',
  module_id: 'Módulo',
  permissions: 'Permisos',
  datos_json: 'Datos (JSON)',
  tipo_formulario: 'Tipo de formulario',
}

function etiqueta(key: string): string {
  return ETIQUETA_CAMPO[key] ?? key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatearValor(v: unknown): string {
  if (v === null || v === undefined) return '—'
  if (typeof v === 'boolean') return v ? 'Sí' : 'No'
  if (typeof v === 'object') {
    try {
      return JSON.stringify(v, null, 2)
    } catch {
      return String(v)
    }
  }
  if (typeof v === 'string') {
    if (/^\d{4}-\d{2}-\d{2}T/.test(v) || /^\d{4}-\d{2}-\d{2}/.test(v)) {
      try {
        return new Date(v).toLocaleString('es-ES', {
          dateStyle: 'short',
          timeStyle: 'short',
        })
      } catch {
        return v
      }
    }
    return v
  }
  return String(v)
}

type Detalles = Record<string, unknown>

/** Líneas de resumen en lenguaje natural (español) */
function resumenAccion(accion: string, entidad: string | null, d: Detalles): string[] {
  const a = accion.toLowerCase()
  const out: string[] = []

  if (a === 'login') {
    out.push('Se registró un inicio de sesión en el sistema.')
    if (typeof d.email === 'string' && d.email) {
      out.push(`Cuenta utilizada: ${d.email}.`)
    }
    return out
  }
  if (a === 'logout') {
    out.push('Se registró el cierre de sesión.')
    if (typeof d.email === 'string' && d.email) {
      out.push(`Sesión de la cuenta: ${d.email}.`)
    }
    return out
  }

  if (a === 'change_role') {
    out.push('Se modificó el rol asignado a un usuario.')
    if (typeof d.old_role === 'string' && typeof d.new_role === 'string') {
      out.push(`Cambio: de «${d.old_role}» a «${d.new_role}».`)
    }
    return out
  }

  if (a === 'create_role') {
    out.push('Se creó un nuevo rol en el sistema.')
    if (typeof d.nombre === 'string') out.push(`Nombre del rol: «${d.nombre}».`)
    return out
  }

  if (a === 'create_user') {
    out.push('Se dio de alta un usuario.')
    if (typeof d.email === 'string') out.push(`Correo del usuario nuevo: ${d.email}.`)
    return out
  }

  if (a === 'delete_user') {
    out.push('Se eliminó o desactivó un usuario del sistema.')
    if (typeof d.email === 'string') out.push(`Cuenta afectada: ${d.email}.`)
    return out
  }

  if (a === 'update_user') {
    out.push('Se actualizó la ficha de un usuario.')
    const ch = d.changes
    if (ch && typeof ch === 'object' && !Array.isArray(ch) && Object.keys(ch as object).length > 0) {
      const keys = Object.keys(ch as Record<string, unknown>).filter((k) => !['updated_by'].includes(k))
      if (keys.length > 0) {
        out.push(`Campos tocados en esta operación: ${keys.map(etiqueta).join(', ')}.`)
      }
    } else {
      out.push('Se guardaron cambios en datos del perfil o la cuenta.')
    }
    return out
  }

  if (a === 'create_joven') {
    out.push('Se registró un nuevo joven en el sistema.')
    if (typeof d.nombre === 'string') out.push(`Nombre: ${d.nombre}.`)
    return out
  }

  if (a === 'update_joven') {
    out.push('Se modificaron datos de un joven.')
    const ch = d.changes
    if (ch && typeof ch === 'object' && !Array.isArray(ch)) {
      const keys = Object.keys(ch as Record<string, unknown>).filter((k) => !['updated_by'].includes(k))
      if (keys.length) out.push(`Campos modificados: ${keys.map(etiqueta).join(', ')}.`)
    }
    return out
  }

  if (a === 'delete_joven') {
    out.push('Se eliminó el registro de un joven.')
    if (typeof d.nombre === 'string') out.push(`Referencia: ${d.nombre}.`)
    return out
  }

  if (a === 'create_atencion') {
    out.push('Se creó una nueva atención.')
    if (typeof d.tipo === 'string') out.push(`Tipo: ${d.tipo}.`)
    return out
  }

  if (a === 'update_atencion') {
    out.push('Se actualizó una atención existente.')
    const ch = d.changes
    if (ch && typeof ch === 'object' && !Array.isArray(ch)) {
      const keys = Object.keys(ch as Record<string, unknown>).filter((k) => !['updated_by'].includes(k))
      if (keys.length) out.push(`Columnas o datos actualizados: ${keys.map(etiqueta).join(', ')}.`)
    }
    return out
  }

  if (a === 'delete_atencion') {
    out.push('Se eliminó una atención.')
    if (d.motivo != null && String(d.motivo)) out.push(`Motivo registrado: ${formatearValor(d.motivo)}`)
    return out
  }

  if (a === 'update_permissions') {
    out.push('Se modificaron permisos de módulo para un usuario.')
    return out
  }

  if (a.startsWith('create_')) {
    out.push(`Operación de alta (${entidad || 'registro'}).`)
    return out
  }
  if (a.startsWith('update_')) {
    out.push(`Operación de modificación (${entidad || 'registro'}).`)
    return out
  }
  if (a.startsWith('delete_')) {
    out.push(`Operación de eliminación (${entidad || 'registro'}).`)
    return out
  }

  out.push(`Acción registrada: ${accion}${entidad ? ` · Entidad: ${entidad}` : ''}.`)
  return out
}

function extraerChanges(d: Detalles): Record<string, unknown> | null {
  const ch = d.changes
  if (ch && typeof ch === 'object' && !Array.isArray(ch)) {
    return ch as Record<string, unknown>
  }
  return null
}

function clavesRestantes(d: Detalles): [string, unknown][] {
  const skip = new Set(['changes', 'updated_by', 'created_by', 'deleted_by', 'changed_by'])
  return Object.entries(d).filter(([k]) => !skip.has(k))
}

export function BitacoraLogDetalles({
  accion,
  entidad,
  entidad_id,
  detalles,
}: {
  accion: string
  entidad: string | null
  entidad_id: string | null
  detalles: unknown
}) {
  const d = useMemo(() => {
    if (!detalles || typeof detalles !== 'object' || Array.isArray(detalles)) return {} as Detalles
    return detalles as Detalles
  }, [detalles])

  const lineasResumen = useMemo(() => resumenAccion(accion, entidad, d), [accion, entidad, d])
  const changes = useMemo(() => extraerChanges(d), [d])
  const resto = useMemo(() => {
    const base = clavesRestantes(d).filter(([key]) => !(changes && key in changes))
    const a = accion.toLowerCase()
    if (a === 'login' || a === 'logout') {
      return base.filter(([k]) => k !== 'email')
    }
    return base
  }, [d, changes, accion])

  const hayDetalles = Object.keys(d).length > 0

  if (!hayDetalles) {
    return (
      <span className="text-gray-400 dark:text-gray-500 text-sm">Sin detalles adicionales guardados.</span>
    )
  }

  return (
    <div className="space-y-3 text-left">
      <div className="rounded-lg border border-sky-200 dark:border-sky-800 bg-sky-50/80 dark:bg-sky-950/30 p-3">
        <p className="text-xs font-semibold text-sky-800 dark:text-sky-200 uppercase tracking-wide mb-2">
          Qué ocurrió
        </p>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-800 dark:text-gray-200">
          {lineasResumen.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
        {entidad_id && (
          <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 font-mono break-all">
            ID de entidad: {entidad_id}
          </p>
        )}
      </div>

      {changes && Object.keys(changes).length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
            Campos modificados o enviados en la operación
          </p>
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-600">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-800">
                  <th className="text-left px-3 py-2 font-medium text-gray-700 dark:text-gray-300">Campo</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-700 dark:text-gray-300">Valor registrado</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(changes).map(([key, val]) => (
                  <tr key={key} className="border-t border-gray-200 dark:border-gray-700">
                    <td className="px-3 py-2 align-top text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      {etiqueta(key)}
                    </td>
                    <td className="px-3 py-2 align-top text-gray-900 dark:text-gray-100 break-words max-w-md">
                      <span className="whitespace-pre-wrap font-mono text-xs">{formatearValor(val)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {resto.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
            {changes ? 'Otros datos del evento' : 'Datos registrados'}
          </p>
          <ul className="space-y-2 text-sm">
            {resto.map(([key, val]) => (
                <li key={key} className="border-b border-gray-100 dark:border-gray-800 pb-2 last:border-0">
                  <span className="font-medium text-gray-700 dark:text-gray-300">{etiqueta(key)}: </span>
                  <span className="text-gray-900 dark:text-gray-100 break-words whitespace-pre-wrap font-mono text-xs">
                    {formatearValor(val)}
                  </span>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  )
}
