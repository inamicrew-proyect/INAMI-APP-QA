'use client'

import { useCallback, useEffect, useState } from 'react'
import { Plus, Trash2, Save, Loader2 } from 'lucide-react'

type TipoCentro = 'CPI' | 'PAMSPL'

type Item = {
  id: string
  nombre: string
  tipo: TipoCentro
  ubicacion: string
  direccion?: string | null
  created_at: string
}

export function CentrosMaintenancePanel() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const [newNombre, setNewNombre] = useState('')
  const [newTipo, setNewTipo] = useState<TipoCentro>('CPI')
  const [newUbicacion, setNewUbicacion] = useState('')
  const [newDireccion, setNewDireccion] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setMsg(null)
    try {
      const res = await fetch('/api/admin/maintenance/centros', { credentials: 'include', cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || 'No se pudieron cargar los centros')
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
      const res = await fetch(`/api/admin/maintenance/centros/${row.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: row.nombre,
          tipo: row.tipo,
          ubicacion: row.ubicacion,
          direccion: row.direccion ?? '',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'No se pudo guardar')
      setItems((prev) => prev.map((i) => (i.id === row.id ? { ...data.item } : i)))
      setMsg('Cambios guardados.')
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setSavingId(null)
    }
  }

  const deleteRow = async (row: Item) => {
    if (!confirm(`¿Eliminar el centro "${row.nombre}"? Solo se permite si no hay jóvenes asignados.`)) {
      return
    }
    setDeletingId(row.id)
    setMsg(null)
    try {
      const res = await fetch(`/api/admin/maintenance/centros/${row.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'No se pudo eliminar')
      setItems((prev) => prev.filter((i) => i.id !== row.id))
      setMsg('Centro eliminado.')
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
      const res = await fetch('/api/admin/maintenance/centros', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: newNombre.trim(),
          tipo: newTipo,
          ubicacion: newUbicacion.trim(),
          direccion: newDireccion.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'No se pudo crear')
      setItems((prev) => [...prev, data.item].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')))
      setNewNombre('')
      setNewTipo('CPI')
      setNewUbicacion('')
      setNewDireccion('')
      setMsg('Centro creado.')
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
          Los centros se usan en formularios de jóvenes y en el panel principal. El <strong>tipo</strong> distingue CPI y
          PAMSPL. No puede eliminarse un centro mientras exista al menos un joven asignado.
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
                  <th className="text-left p-2 font-medium text-gray-700 dark:text-gray-300 min-w-[180px]">Nombre</th>
                  <th className="text-left p-2 font-medium text-gray-700 dark:text-gray-300 w-32">Tipo</th>
                  <th className="text-left p-2 font-medium text-gray-700 dark:text-gray-300 min-w-[140px]">Ubicación</th>
                  <th className="text-left p-2 font-medium text-gray-700 dark:text-gray-300 min-w-[160px]">Dirección</th>
                  <th className="p-2 w-28" />
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="p-2">
                      <input
                        className="input-field w-full text-sm py-1"
                        value={row.nombre}
                        onChange={(e) => updateLocal(row.id, { nombre: e.target.value })}
                      />
                    </td>
                    <td className="p-2">
                      <select
                        className="input-field w-full text-sm py-1"
                        value={row.tipo}
                        onChange={(e) => updateLocal(row.id, { tipo: e.target.value as TipoCentro })}
                      >
                        <option value="CPI">CPI</option>
                        <option value="PAMSPL">PAMSPL</option>
                      </select>
                    </td>
                    <td className="p-2">
                      <input
                        className="input-field w-full text-sm py-1"
                        value={row.ubicacion}
                        onChange={(e) => updateLocal(row.id, { ubicacion: e.target.value })}
                      />
                    </td>
                    <td className="p-2">
                      <input
                        className="input-field w-full text-sm py-1"
                        value={row.direccion ?? ''}
                        onChange={(e) => updateLocal(row.id, { direccion: e.target.value })}
                        placeholder="Opcional"
                      />
                    </td>
                    <td className="p-2 flex gap-1 justify-end flex-wrap">
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
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Nuevo centro</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Nombre</label>
                <input
                  className="input-field w-full text-sm"
                  placeholder="Nombre del centro"
                  value={newNombre}
                  onChange={(e) => setNewNombre(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Tipo</label>
                <select
                  className="input-field w-full text-sm"
                  value={newTipo}
                  onChange={(e) => setNewTipo(e.target.value as TipoCentro)}
                >
                  <option value="CPI">CPI</option>
                  <option value="PAMSPL">PAMSPL</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Ubicación</label>
                <input
                  className="input-field w-full text-sm"
                  placeholder="Departamento / ciudad"
                  value={newUbicacion}
                  onChange={(e) => setNewUbicacion(e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Dirección (opcional)</label>
                <input
                  className="input-field w-full text-sm"
                  placeholder="Dirección física"
                  value={newDireccion}
                  onChange={(e) => setNewDireccion(e.target.value)}
                />
              </div>
            </div>
            <button
              type="button"
              onClick={createRow}
              disabled={creating}
              className="btn-primary text-sm inline-flex items-center gap-2"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Agregar centro
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
