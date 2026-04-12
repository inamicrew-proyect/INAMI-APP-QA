'use client'

import { useCallback, useEffect, useState } from 'react'
import { Plus, Trash2, Save, Loader2 } from 'lucide-react'

type Item = {
  id: string
  codigo: string
  nombre: string
  orden: number
  activo: boolean
  cuenta_como_activo: boolean
}

export function JovenEstadosMaintenancePanel() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const [newCodigo, setNewCodigo] = useState('')
  const [newNombre, setNewNombre] = useState('')
  const [newOrden, setNewOrden] = useState(0)
  const [newActivo, setNewActivo] = useState(true)
  const [newCuentaActivo, setNewCuentaActivo] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setMsg(null)
    try {
      const res = await fetch('/api/admin/maintenance/joven-estados', { credentials: 'include', cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || 'No se pudieron cargar los estados')
      }
      setItems(data.items || [])
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Error al cargar')
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const saveRow = async (row: Item) => {
    setSavingId(row.id)
    setMsg(null)
    try {
      const res = await fetch(`/api/admin/maintenance/joven-estados/${row.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: row.nombre,
          orden: row.orden,
          activo: row.activo,
          cuenta_como_activo: row.cuenta_como_activo,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'No se pudo guardar')
      setItems((prev) => prev.map((i) => (i.id === row.id ? { ...data.item } : i)))
      setMsg('Cambios guardados.')
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('joven-estados:updated'))
      }
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setSavingId(null)
    }
  }

  const deleteRow = async (row: Item) => {
    if (!confirm(`¿Eliminar el estado "${row.nombre}" (${row.codigo})? Solo se permite si ningún joven lo usa.`)) {
      return
    }
    setDeletingId(row.id)
    setMsg(null)
    try {
      const res = await fetch(`/api/admin/maintenance/joven-estados/${row.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'No se pudo eliminar')
      setItems((prev) => prev.filter((i) => i.id !== row.id))
      setMsg('Estado eliminado.')
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('joven-estados:updated'))
      }
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Error al eliminar')
    } finally {
      setDeletingId(null)
    }
  }

  const createRow = async () => {
    setCreating(true)
    setMsg(null)
    try {
      const res = await fetch('/api/admin/maintenance/joven-estados', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codigo: newCodigo.trim().toLowerCase(),
          nombre: newNombre.trim(),
          orden: newOrden,
          activo: newActivo,
          cuenta_como_activo: newCuentaActivo,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'No se pudo crear')
      setItems((prev) => [...prev, data.item].sort((a, b) => a.orden - b.orden))
      setNewCodigo('')
      setNewNombre('')
      setNewOrden(0)
      setNewActivo(true)
      setNewCuentaActivo(false)
      setMsg('Estado creado.')
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('joven-estados:updated'))
      }
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Error al crear')
    } finally {
      setCreating(false)
    }
  }

  const updateLocal = (id: string, patch: Partial<Item>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)))
  }

  return (
    <div className="space-y-6">
      <div className="text-sm text-gray-600 dark:text-gray-400 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/40 p-4">
        <p>
          El <strong>código</strong> se guarda en cada joven y no se puede cambiar después de creado. Use{' '}
          <strong>Activo en catálogo</strong> para ocultar un estado en nuevos registros (los jóvenes que ya lo tienen
          siguen igual). <strong>Cuenta en listado &quot;activos&quot;</strong> define qué estados suman en el resumen y
          filtros de jóvenes activos.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-gray-500">
          <Loader2 className="w-10 h-10 animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/80">
                <tr>
                  <th className="text-left p-2 font-medium text-gray-700 dark:text-gray-300">Código</th>
                  <th className="text-left p-2 font-medium text-gray-700 dark:text-gray-300">Nombre</th>
                  <th className="text-left p-2 font-medium text-gray-700 dark:text-gray-300 w-20">Orden</th>
                  <th className="text-center p-2 font-medium text-gray-700 dark:text-gray-300">Catálogo</th>
                  <th className="text-center p-2 font-medium text-gray-700 dark:text-gray-300">Activo list.</th>
                  <th className="p-2 w-28" />
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="p-2 font-mono text-xs text-gray-800 dark:text-gray-200">{row.codigo}</td>
                    <td className="p-2">
                      <input
                        className="input-field w-full text-sm py-1"
                        value={row.nombre}
                        onChange={(e) => updateLocal(row.id, { nombre: e.target.value })}
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        className="input-field w-full text-sm py-1"
                        value={row.orden}
                        onChange={(e) => updateLocal(row.id, { orden: Number(e.target.value) || 0 })}
                      />
                    </td>
                    <td className="p-2 text-center">
                      <input
                        type="checkbox"
                        checked={row.activo}
                        onChange={(e) => updateLocal(row.id, { activo: e.target.checked })}
                        title="Activo en catálogo (selectores)"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <input
                        type="checkbox"
                        checked={row.cuenta_como_activo}
                        onChange={(e) => updateLocal(row.id, { cuenta_como_activo: e.target.checked })}
                        title="Cuenta como joven activo en resumen/filtros"
                      />
                    </td>
                    <td className="p-2 flex gap-1 justify-end">
                      <button
                        type="button"
                        onClick={() => saveRow(row)}
                        disabled={savingId === row.id}
                        className="btn-primary text-xs py-1 px-2 inline-flex items-center gap-1"
                      >
                        {savingId === row.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                        Guardar
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteRow(row)}
                        disabled={deletingId === row.id}
                        className="btn-secondary text-xs py-1 px-2 text-red-600 dark:text-red-400 inline-flex items-center gap-1"
                      >
                        {deletingId === row.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-600 p-4 space-y-3">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Nuevo estado</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Código (único)</label>
                <input
                  className="input-field w-full text-sm"
                  placeholder="ej. suspendido"
                  value={newCodigo}
                  onChange={(e) => setNewCodigo(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Nombre visible</label>
                <input
                  className="input-field w-full text-sm"
                  placeholder="ej. Suspendido"
                  value={newNombre}
                  onChange={(e) => setNewNombre(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Orden</label>
                <input
                  type="number"
                  className="input-field w-full text-sm"
                  value={newOrden}
                  onChange={(e) => setNewOrden(Number(e.target.value) || 0)}
                />
              </div>
              <div className="flex items-center gap-4 pt-5">
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input type="checkbox" checked={newActivo} onChange={(e) => setNewActivo(e.target.checked)} />
                  En catálogo
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={newCuentaActivo}
                    onChange={(e) => setNewCuentaActivo(e.target.checked)}
                  />
                  Cuenta activo
                </label>
              </div>
            </div>
            <button
              type="button"
              onClick={createRow}
              disabled={creating}
              className="btn-primary text-sm inline-flex items-center gap-2"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Agregar estado
            </button>
          </div>
        </div>
      )}

      {msg && (
        <p className="text-sm text-gray-700 dark:text-gray-300 rounded-lg bg-gray-100 dark:bg-gray-800/60 px-4 py-2">
          {msg}
        </p>
      )}
    </div>
  )
}
