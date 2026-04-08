'use client'

import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Plus, Clock3, Pencil, Trash2, FileDown, Search, Users } from 'lucide-react'
import jsPDF from 'jspdf'
import { useAuth, useIsAdmin } from '@/lib/auth'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { Routes } from '@/lib/routes'

type Cita = {
  id: string
  fecha_cita: string
  motivo: string
  estado: 'pendiente' | 'en_proceso' | 'realizada' | 'cancelada'
  joven?: { id: string; nombres: string; apellidos: string } | null
  profesional?: { id: string; full_name: string; role: string } | null
  solicitante?: { id: string; full_name: string; role: string } | null
}

type JovenOption = { id: string; nombres: string; apellidos: string; estado: string }
type ProfesionalOption = { id: string; full_name: string; role: string }

function estadoPdfLabel(estado: Cita['estado']): string {
  switch (estado) {
    case 'pendiente':
      return 'Pendiente'
    case 'en_proceso':
      return 'En proceso'
    case 'realizada':
      return 'Realizada'
    case 'cancelada':
      return 'Cancelada'
    default:
      return estado
  }
}

function estadoPdfRgb(estado: Cita['estado']): [number, number, number] {
  switch (estado) {
    case 'pendiente':
      return [217, 119, 6]
    case 'en_proceso':
      return [37, 99, 235]
    case 'realizada':
      return [22, 163, 74]
    case 'cancelada':
      return [220, 38, 38]
    default:
      return [71, 85, 105]
  }
}

/** Alineado con `theme.extend.colors.primary` en tailwind.config.js (primary-600 / blue del sistema) */
const PDF_BLUE = { r: 37, g: 99, b: 235 } as const
const PDF_BLUE_SOFT_BG = { r: 239, g: 246, b: 255 } as const
const PDF_BLUE_BORDER = { r: 147, g: 197, b: 253 } as const

const CITAS_PAGE_SIZE = 10

function loadPdfLogo(): Promise<{ dataUrl: string; widthMm: number; heightMm: number } | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const maxH = 24
      const scale = maxH / img.naturalHeight
      const widthMm = img.naturalWidth * scale
      const heightMm = maxH
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(null)
        return
      }
      ctx.drawImage(img, 0, 0)
      resolve({
        dataUrl: canvas.toDataURL('image/png'),
        widthMm,
        heightMm,
      })
    }
    img.onerror = () => resolve(null)
    img.src = '/inami-logo.png'
  })
}

type PdfCitasSemanaOpts = {
  titulo: string
  nombreArchivo: string
  incluirSolicitante?: boolean
}

async function exportarPdfCitasSemana(
  citasSemana: Cita[],
  start: Date,
  end: Date,
  opts: PdfCitasSemanaOpts
) {
  const logo = await loadPdfLogo()
  const incluirSolicitante = Boolean(opts.incluirSolicitante)
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 14
  const contentW = pageW - margin * 2
  const lineH = 5
  let y = 0
  let pageCount = 1

  const ensureSpace = (needed: number) => {
    if (y + needed > pageH - margin) {
      doc.addPage()
      pageCount += 1
      y = margin
    }
  }

  const headerH = 34
  const drawHeader = () => {
    doc.setFillColor(PDF_BLUE.r, PDF_BLUE.g, PDF_BLUE.b)
    doc.rect(0, 0, pageW, headerH, 'F')

    const textX = logo ? margin + logo.widthMm + 5 : margin
    const titleMaxW = pageW - textX - margin

    if (logo) {
      const yLogo = Math.max(2, (headerH - logo.heightMm) / 2)
      doc.addImage(logo.dataUrl, 'PNG', margin, yLogo, logo.widthMm, logo.heightMm)
    }

    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(15)
    const titleLines = doc.splitTextToSize(opts.titulo, titleMaxW)
    let yHead = 12
    doc.text(titleLines, textX, yHead)
    yHead += titleLines.length * 5.5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)
    const sub = `Semana del ${start.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })} al ${end.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}`
    const subLines = doc.splitTextToSize(sub, titleMaxW)
    doc.text(subLines, textX, yHead + 4)
    doc.setTextColor(0, 0, 0)
    y = headerH + 6
  }

  drawHeader()

  const porRealizar = citasSemana.filter((c) => c.estado === 'pendiente' || c.estado === 'en_proceso')
  const boxGap = 4
  const boxW = (contentW - boxGap) / 2
  const boxH = 18

  ensureSpace(boxH + 12)
  doc.setFillColor(PDF_BLUE_SOFT_BG.r, PDF_BLUE_SOFT_BG.g, PDF_BLUE_SOFT_BG.b)
  doc.roundedRect(margin, y, boxW, boxH, 2, 2, 'F')
  doc.setDrawColor(PDF_BLUE_BORDER.r, PDF_BLUE_BORDER.g, PDF_BLUE_BORDER.b)
  doc.setLineWidth(0.3)
  doc.roundedRect(margin, y, boxW, boxH, 2, 2, 'S')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(71, 85, 105)
  doc.text('Total en la semana', margin + 3, y + 6)
  doc.setFontSize(14)
  doc.setTextColor(15, 23, 42)
  doc.text(String(citasSemana.length), margin + 3, y + 14)

  const x2 = margin + boxW + boxGap
  doc.setFillColor(PDF_BLUE_SOFT_BG.r, PDF_BLUE_SOFT_BG.g, PDF_BLUE_SOFT_BG.b)
  doc.roundedRect(x2, y, boxW, boxH, 2, 2, 'F')
  doc.setDrawColor(PDF_BLUE_BORDER.r, PDF_BLUE_BORDER.g, PDF_BLUE_BORDER.b)
  doc.roundedRect(x2, y, boxW, boxH, 2, 2, 'S')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(71, 85, 105)
  doc.text('Por realizar (pendiente / en proceso)', x2 + 3, y + 6)
  doc.setFontSize(14)
  doc.setTextColor(15, 23, 42)
  doc.text(String(porRealizar.length), x2 + 3, y + 14)
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'normal')
  y += boxH + 10

  if (citasSemana.length === 0) {
    ensureSpace(20)
    doc.setFontSize(11)
    doc.setTextColor(100, 116, 139)
    doc.text('No hay citas registradas para esta semana.', margin, y)
    doc.setTextColor(0, 0, 0)
  } else {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(PDF_BLUE.r, PDF_BLUE.g, PDF_BLUE.b)
    doc.text('Detalle de citas', margin, y)
    doc.setTextColor(0, 0, 0)
    y += 8

    citasSemana.forEach((cita, index) => {
      const fechaStr = new Date(cita.fecha_cita).toLocaleString('es-ES', {
        dateStyle: 'short',
        timeStyle: 'short',
      })
      const jovenNombre = cita.joven ? `${cita.joven.nombres} ${cita.joven.apellidos}` : 'Sin joven asignado'
      const encargado = cita.profesional?.full_name || 'Sin asignar'
      const cardPadding = 5
      const innerW = contentW - cardPadding * 2
      const motivoLines = doc.splitTextToSize(cita.motivo || '—', contentW - 14)
      const jovenLines = doc.splitTextToSize(jovenNombre, innerW - 28)
      const encLines = doc.splitTextToSize(encargado, innerW - 32)
      const solLines = incluirSolicitante
        ? doc.splitTextToSize(cita.solicitante?.full_name || '—', innerW - 36)
        : []
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      const badgeW = doc.getTextWidth(estadoPdfLabel(cita.estado)) + 6
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      const extraSolic =
        incluirSolicitante ? lineH + Math.max(lineH, solLines.length * lineH) : 0
      const cardH =
        cardPadding +
        7 +
        lineH +
        Math.max(lineH, jovenLines.length * lineH) +
        Math.max(lineH, encLines.length * lineH) +
        extraSolic +
        4 +
        4 +
        motivoLines.length * lineH +
        cardPadding

      ensureSpace(cardH + 4)

      doc.setFillColor(PDF_BLUE_SOFT_BG.r, PDF_BLUE_SOFT_BG.g, PDF_BLUE_SOFT_BG.b)
      doc.roundedRect(margin, y, contentW, cardH, 2, 2, 'F')
      doc.setDrawColor(PDF_BLUE_BORDER.r, PDF_BLUE_BORDER.g, PDF_BLUE_BORDER.b)
      doc.setLineWidth(0.25)
      doc.roundedRect(margin, y, contentW, cardH, 2, 2, 'S')

      let cy = y + cardPadding + 5
      const ix = margin + cardPadding

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(15, 23, 42)
      doc.text(`Cita ${index + 1}`, ix, cy)

      const [r, g, b] = estadoPdfRgb(cita.estado)
      doc.setFillColor(r, g, b)
      const bx = margin + contentW - cardPadding - badgeW
      doc.roundedRect(bx, cy - 4, badgeW, 6, 1, 1, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.text(estadoPdfLabel(cita.estado), bx + 3, cy)
      doc.setTextColor(0, 0, 0)
      doc.setFont('helvetica', 'normal')
      cy += 8

      doc.setFontSize(9)
      doc.setTextColor(71, 85, 105)
      doc.text('Fecha y hora', ix, cy)
      doc.setTextColor(15, 23, 42)
      doc.setFont('helvetica', 'bold')
      doc.text(fechaStr, ix + 28, cy)
      doc.setFont('helvetica', 'normal')
      cy += lineH

      doc.setTextColor(71, 85, 105)
      doc.text('Joven', ix, cy)
      doc.setTextColor(15, 23, 42)
      doc.text(jovenLines, ix + 28, cy)
      cy += Math.max(lineH, jovenLines.length * lineH)

      doc.setTextColor(71, 85, 105)
      doc.text('Encargado', ix, cy)
      doc.setTextColor(15, 23, 42)
      doc.text(encLines, ix + 32, cy)
      cy += Math.max(lineH, encLines.length * lineH)

      if (incluirSolicitante) {
        doc.setTextColor(71, 85, 105)
        doc.text('Solicitado por', ix, cy)
        doc.setTextColor(15, 23, 42)
        doc.text(solLines, ix + 36, cy)
        cy += Math.max(lineH, solLines.length * lineH)
      }

      cy += 2
      doc.setDrawColor(PDF_BLUE_BORDER.r, PDF_BLUE_BORDER.g, PDF_BLUE_BORDER.b)
      doc.line(ix, cy, margin + contentW - cardPadding, cy)
      cy += 5

      doc.setFontSize(8)
      doc.setTextColor(71, 85, 105)
      doc.text('Motivo', ix, cy)
      cy += 4
      doc.setFontSize(9)
      doc.setTextColor(51, 65, 85)
      doc.text(motivoLines, ix, cy)
      cy += motivoLines.length * lineH

      y += cardH + 5
    })
  }

  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p)
    doc.setFontSize(8)
    doc.setTextColor(148, 163, 184)
    doc.setFont('helvetica', 'normal')
    doc.text(
      `Generado el ${new Date().toLocaleString('es-ES')} · Página ${p} de ${pageCount}`,
      margin,
      pageH - 8
    )
    doc.setTextColor(0, 0, 0)
  }

  doc.save(opts.nombreArchivo)
}

export default function CitasPage() {
  const { profile } = useAuth()
  const { isAdmin } = useIsAdmin()
  const { canView, canCreate, canEdit, canDelete, loading: permissionsLoading } = usePermissions()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [citas, setCitas] = useState<Cita[]>([])
  const [jovenes, setJovenes] = useState<JovenOption[]>([])
  const [profesionales, setProfesionales] = useState<ProfesionalOption[]>([])

  const [jovenId, setJovenId] = useState('')
  const [jovenSearch, setJovenSearch] = useState('')
  const [profesionalId, setProfesionalId] = useState('')
  const [profesionalSearch, setProfesionalSearch] = useState('')
  const [fechaCita, setFechaCita] = useState('')
  const [motivo, setMotivo] = useState('')
  const [editingCitaId, setEditingCitaId] = useState<string | null>(null)

  const [filtroListaFechaDesde, setFiltroListaFechaDesde] = useState('')
  const [filtroListaFechaHasta, setFiltroListaFechaHasta] = useState('')
  const [filtroListaJoven, setFiltroListaJoven] = useState('')
  const [filtroListaEstado, setFiltroListaEstado] = useState<'' | Cita['estado']>('')
  const [paginaCitas, setPaginaCitas] = useState(1)

  const canViewCitas = isAdmin || (!permissionsLoading && canView(Routes.CITAS))
  const canCreateCitas = isAdmin || (!permissionsLoading && canCreate(Routes.CITAS))
  const canEditCitas = isAdmin || (!permissionsLoading && canEdit(Routes.CITAS))
  const canDeleteCitas = isAdmin || (!permissionsLoading && canDelete(Routes.CITAS))

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/citas', { credentials: 'include', cache: 'no-store' })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'No se pudieron cargar las citas')
      }
      setCitas(data.citas || [])
      setJovenes(data.jovenes || [])
      setProfesionales(data.profesionales || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar citas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    fetch('/api/citas/notificar-proximas', { method: 'POST', credentials: 'include' }).catch(() => undefined)
  }, [])

  const citasOrdenadas = useMemo(() => {
    return [...citas].sort((a, b) => new Date(a.fecha_cita).getTime() - new Date(b.fecha_cita).getTime())
  }, [citas])

  const citasFiltradas = useMemo(() => {
    return citasOrdenadas.filter((c) => {
      const fc = new Date(c.fecha_cita).getTime()
      if (filtroListaFechaDesde) {
        const desde = new Date(filtroListaFechaDesde)
        desde.setHours(0, 0, 0, 0)
        if (fc < desde.getTime()) return false
      }
      if (filtroListaFechaHasta) {
        const hasta = new Date(filtroListaFechaHasta)
        hasta.setHours(23, 59, 59, 999)
        if (fc > hasta.getTime()) return false
      }
      if (filtroListaEstado && c.estado !== filtroListaEstado) return false
      if (filtroListaJoven.trim()) {
        const nombre = c.joven
          ? `${c.joven.nombres} ${c.joven.apellidos}`.toLowerCase()
          : ''
        if (!nombre.includes(filtroListaJoven.trim().toLowerCase())) return false
      }
      return true
    })
  }, [citasOrdenadas, filtroListaFechaDesde, filtroListaFechaHasta, filtroListaEstado, filtroListaJoven])

  const totalPaginasLista = useMemo(() => {
    if (citasFiltradas.length === 0) return 0
    return Math.ceil(citasFiltradas.length / CITAS_PAGE_SIZE)
  }, [citasFiltradas])

  const citasPagina = useMemo(() => {
    const start = (paginaCitas - 1) * CITAS_PAGE_SIZE
    return citasFiltradas.slice(start, start + CITAS_PAGE_SIZE)
  }, [citasFiltradas, paginaCitas])

  useEffect(() => {
    setPaginaCitas(1)
  }, [filtroListaFechaDesde, filtroListaFechaHasta, filtroListaJoven, filtroListaEstado])

  useEffect(() => {
    if (totalPaginasLista === 0) return
    setPaginaCitas((p) => Math.min(Math.max(1, p), totalPaginasLista))
  }, [totalPaginasLista])

  const jovenesFiltrados = useMemo(() => {
    const term = jovenSearch.trim().toLowerCase()
    if (!term) return []
    return jovenes
      .filter((j) => `${j.nombres} ${j.apellidos}`.toLowerCase().includes(term))
      .slice(0, 8)
  }, [jovenes, jovenSearch])

  const profesionalesFiltrados = useMemo(() => {
    const term = profesionalSearch.trim().toLowerCase()
    if (!term) return []
    return profesionales
      .filter((p) => `${p.full_name} ${p.role}`.toLowerCase().includes(term))
      .slice(0, 8)
  }, [profesionales, profesionalSearch])

  const toDateTimeLocal = (dateStr: string) => {
    const d = new Date(dateStr)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  const getWeekRange = () => {
    const now = new Date()
    const day = now.getDay()
    const mondayOffset = day === 0 ? -6 : 1 - day
    const start = new Date(now)
    start.setDate(now.getDate() + mondayOffset)
    start.setHours(0, 0, 0, 0)

    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    end.setHours(23, 59, 59, 999)

    return { start, end }
  }

  const resetForm = () => {
    setEditingCitaId(null)
    setJovenId('')
    setJovenSearch('')
    setProfesionalId('')
    setProfesionalSearch('')
    setFechaCita('')
    setMotivo('')
  }

  const handleEditarCita = (cita: Cita) => {
    setEditingCitaId(cita.id)
    const jovenNombre = cita.joven ? `${cita.joven.nombres} ${cita.joven.apellidos}` : ''
    const profesionalNombre = cita.profesional ? `${cita.profesional.full_name} (${cita.profesional.role})` : ''
    setJovenId(cita.joven?.id || '')
    setJovenSearch(jovenNombre)
    setProfesionalId(cita.profesional?.id || '')
    setProfesionalSearch(profesionalNombre)
    setFechaCita(toDateTimeLocal(cita.fecha_cita))
    setMotivo(cita.motivo)
    setError(null)
    setSuccess(null)
  }

  const handleGuardarCita = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!jovenId || !fechaCita || !motivo.trim()) {
      setError('Completa todos los campos obligatorios.')
      return
    }

    try {
      setSaving(true)
      const isEditing = Boolean(editingCitaId)
      const endpoint = isEditing ? `/api/citas/${editingCitaId}` : '/api/citas'
      const method = isEditing ? 'PATCH' : 'POST'
      const res = await fetch(endpoint, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          joven_id: jovenId,
          profesional_id: profesionalId || null,
          fecha_cita: new Date(fechaCita).toISOString(),
          motivo: motivo.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'No se pudo guardar la cita')
      }

      setSuccess(isEditing ? 'Cita actualizada correctamente.' : 'Cita agendada correctamente.')
      resetForm()
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar cita')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCita = async (citaId: string) => {
    const confirmed = window.confirm('¿Deseas eliminar esta cita? Esta acción no se puede deshacer.')
    if (!confirmed) return

    try {
      setError(null)
      setSuccess(null)
      const res = await fetch(`/api/citas/${citaId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'No se pudo eliminar la cita')
      }
      if (editingCitaId === citaId) {
        resetForm()
      }
      setSuccess('Cita eliminada correctamente.')
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar cita')
    }
  }

  const handleEstadoChange = async (citaId: string, estado: Cita['estado']) => {
    try {
      setError(null)
      setSuccess(null)
      const res = await fetch(`/api/citas/${citaId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'No se pudo actualizar el estado')
      }
      setSuccess('Estado de la cita actualizado.')
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar el estado')
    }
  }

  const descargarPdfSemanal = async () => {
    const { start, end } = getWeekRange()
    const citasSemana = citasOrdenadas.filter((cita) => {
      const fecha = new Date(cita.fecha_cita)
      if (fecha < start || fecha > end) return false
      if (!profile?.id) return true
      return cita.profesional?.id === profile.id || cita.solicitante?.id === profile.id
    })
    await exportarPdfCitasSemana(citasSemana, start, end, {
      titulo: 'Listado semanal de citas (mis citas)',
      nombreArchivo: 'citas-semana.pdf',
    })
  }

  const descargarPdfSemanalTodos = async () => {
    const { start, end } = getWeekRange()
    try {
      setError(null)
      const res = await fetch('/api/citas?vista=agenda_completa', {
        credentials: 'include',
        cache: 'no-store',
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'No se pudieron cargar las citas para el PDF')
      }
      const todas: Cita[] = data.citas || []
      const citasSemana = todas.filter((cita) => {
        const fecha = new Date(cita.fecha_cita)
        return fecha >= start && fecha <= end
      })
      await exportarPdfCitasSemana(citasSemana, start, end, {
        titulo: 'Listado semanal — Vista general (todos los usuarios)',
        nombreArchivo: 'citas-semana-vista-general.pdf',
        incluirSolicitante: true,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al generar el PDF de vista general')
    }
  }

  const badgeClass = (estado: Cita['estado']) => {
    switch (estado) {
      case 'pendiente':
        return 'badge-warning'
      case 'en_proceso':
        return 'badge-info'
      case 'realizada':
        return 'badge-success'
      case 'cancelada':
        return 'badge-danger'
      default:
        return 'badge-info'
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {!permissionsLoading && !canViewCitas ? (
        <div className="card text-center py-10">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Sin acceso al módulo Citas</h2>
          <p className="text-gray-600 dark:text-gray-300">No tienes permisos para ver este apartado.</p>
        </div>
      ) : (
        <>
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <CalendarDays className="w-8 h-8 text-blue-600" />
            Citas
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            {isAdmin
              ? 'Vista global de la agenda en la tabla. Puedes descargar un PDF con tus citas de la semana u otro con la vista general de todas las citas. Usa filtros y paginación en la tabla.'
              : 'En la tabla ves las citas donde participas. Puedes descargar un PDF con solo tus citas de la semana u otro con la vista general de toda la agenda.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            className="btn-secondary flex items-center gap-2"
            onClick={() => {
              void descargarPdfSemanal()
            }}
          >
            <FileDown className="w-4 h-4" />
            PDF semanal (mis citas)
          </button>
          <button
            type="button"
            className="btn-secondary flex items-center gap-2"
            onClick={() => {
              void descargarPdfSemanalTodos()
            }}
            title="PDF con todas las citas de la semana (agenda completa)"
          >
            <Users className="w-4 h-4" />
            PDF semanal (vista general)
          </button>
        </div>
      </div>

      <div className="card mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-blue-600" />
          Agendar nueva cita
        </h2>
        {!canCreateCitas ? (
          <p className="text-sm text-gray-600 dark:text-gray-300">Tu rol no tiene permisos para crear o actualizar citas.</p>
        ) : (
        <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleGuardarCita}>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Buscar joven</label>
            <input
              type="text"
              className="input-field w-full mb-2"
              value={jovenSearch}
              onChange={(e) => {
                setJovenSearch(e.target.value)
                setJovenId('')
              }}
              placeholder="Escribe nombre o apellido..."
              required
            />
            {jovenSearch.trim() !== '' && (
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 max-h-44 overflow-y-auto">
                {jovenesFiltrados.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                    No hay jóvenes que coincidan con la búsqueda.
                  </p>
                ) : (
                  jovenesFiltrados.map((j) => {
                    const nombre = `${j.nombres} ${j.apellidos}`
                    const selected = jovenId === j.id
                    return (
                      <button
                        key={j.id}
                        type="button"
                        onClick={() => {
                          setJovenId(j.id)
                          setJovenSearch(nombre)
                        }}
                        className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                          selected
                            ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200'
                        }`}
                      >
                        {nombre}
                      </button>
                    )
                  })
                )}
              </div>
            )}
            <input type="hidden" value={jovenId} required readOnly />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Buscar encargado de la cita</label>
            <input
              type="text"
              className="input-field w-full mb-2"
              value={profesionalSearch}
              onChange={(e) => {
                setProfesionalSearch(e.target.value)
                setProfesionalId('')
              }}
              placeholder="Escribe nombre o rol..."
            />
            {profesionalSearch.trim() !== '' && (
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 max-h-44 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => {
                    setProfesionalId('')
                    setProfesionalSearch('Sin asignar')
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
                >
                  Sin asignar
                </button>
                {profesionalesFiltrados.map((p) => {
                  const nombre = `${p.full_name} (${p.role})`
                  const selected = profesionalId === p.id
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setProfesionalId(p.id)
                        setProfesionalSearch(nombre)
                      }}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                        selected
                          ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200'
                      }`}
                    >
                      {nombre}
                    </button>
                  )
                })}
                {profesionalesFiltrados.length === 0 && (
                  <p className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                    No hay usuarios que coincidan con la búsqueda.
                  </p>
                )}
              </div>
            )}
            <input type="hidden" value={profesionalId} readOnly />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha y hora *</label>
            <input
              type="datetime-local"
              className="input-field w-full"
              value={fechaCita}
              onChange={(e) => setFechaCita(e.target.value)}
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Motivo *</label>
            <textarea
              className="input-field w-full min-h-[90px]"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Describe el motivo de la cita"
              required
            />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <div className="flex items-center gap-2">
              {editingCitaId && (
                <button type="button" className="btn-secondary" onClick={resetForm} disabled={saving}>
                  Cancelar edición
                </button>
              )}
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Guardando...' : editingCitaId ? 'Actualizar cita' : 'Guardar cita'}
              </button>
            </div>
          </div>
        </form>
        )}
      </div>

      {error && <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700">{error}</div>}
      {success && <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700">{success}</div>}

      <div className="card overflow-hidden">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Clock3 className="w-5 h-5 text-blue-600" />
          {isAdmin ? 'Todas las citas' : 'Mis citas (solicitante o encargado)'}
        </h2>
        {loading ? (
          <p className="text-gray-600 dark:text-gray-300">Cargando citas...</p>
        ) : citasOrdenadas.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-300">No hay citas registradas.</p>
        ) : (
          <>
            <div className="mb-6 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Buscar citas</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Fecha desde</label>
                  <input
                    type="date"
                    className="input-field w-full"
                    value={filtroListaFechaDesde}
                    onChange={(e) => setFiltroListaFechaDesde(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Fecha hasta</label>
                  <input
                    type="date"
                    className="input-field w-full"
                    value={filtroListaFechaHasta}
                    onChange={(e) => setFiltroListaFechaHasta(e.target.value)}
                  />
                </div>
                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Joven</label>
                  <div className="relative">
                    <Search
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 shrink-0 text-gray-400 pointer-events-none z-0"
                      aria-hidden
                    />
                    <input
                      type="search"
                      className="input-field w-full !pl-12 sm:!pl-[3.25rem] pr-4"
                      placeholder="Nombre o apellido"
                      value={filtroListaJoven}
                      onChange={(e) => setFiltroListaJoven(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Estado</label>
                  <select
                    className="input-field w-full"
                    value={filtroListaEstado}
                    onChange={(e) => setFiltroListaEstado(e.target.value as '' | Cita['estado'])}
                  >
                    <option value="">Todos</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="en_proceso">En proceso</option>
                    <option value="realizada">Realizada</option>
                    <option value="cancelada">Cancelada</option>
                  </select>
                </div>
                <div className="flex gap-2 lg:col-span-1">
                  <button
                    type="button"
                    className="btn-secondary text-sm whitespace-nowrap"
                    onClick={() => {
                      setFiltroListaFechaDesde('')
                      setFiltroListaFechaHasta('')
                      setFiltroListaJoven('')
                      setFiltroListaEstado('')
                    }}
                  >
                    Limpiar filtros
                  </button>
                </div>
              </div>
            </div>

            {citasFiltradas.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-300 py-4">
                No hay citas que coincidan con los filtros. Prueba a ampliar fechas o limpiar la búsqueda.
              </p>
            ) : (
              <>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Mostrando{' '}
                  {citasFiltradas.length === 0
                    ? 0
                    : `${(paginaCitas - 1) * CITAS_PAGE_SIZE + 1}–${Math.min(paginaCitas * CITAS_PAGE_SIZE, citasFiltradas.length)}`}{' '}
                  de {citasFiltradas.length} cita(s)
                </p>
                <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Joven</th>
                  <th>Solicitado por</th>
                  <th>Atenderá</th>
                  <th>Motivo</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {citasPagina.map((cita) => (
                  <tr key={cita.id}>
                    <td>{new Date(cita.fecha_cita).toLocaleString('es-ES')}</td>
                    <td>{cita.joven ? `${cita.joven.nombres} ${cita.joven.apellidos}` : 'N/A'}</td>
                    <td>{cita.solicitante?.full_name || 'N/A'}</td>
                    <td>{cita.profesional?.full_name || 'Sin asignar'}</td>
                    <td className="max-w-[360px] truncate">{cita.motivo}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className={`badge ${badgeClass(cita.estado)}`}>{cita.estado}</span>
                        {canEditCitas && (
                          <select
                            className="input-field !py-1 !px-2 text-xs min-w-[128px]"
                            value={cita.estado}
                            onChange={(e) => handleEstadoChange(cita.id, e.target.value as Cita['estado'])}
                          >
                            <option value="pendiente">pendiente</option>
                            <option value="en_proceso">en proceso</option>
                            <option value="realizada">realizada</option>
                            <option value="cancelada">cancelada</option>
                          </select>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        {canEditCitas && (
                          <button
                            type="button"
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Editar cita"
                            onClick={() => handleEditarCita(cita)}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                        {canDeleteCitas && (
                          <button
                            type="button"
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Eliminar cita"
                            onClick={() => handleDeleteCita(cita.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
                </div>
                {totalPaginasLista > 1 && (
                  <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      type="button"
                      className="btn-secondary text-sm"
                      disabled={paginaCitas <= 1}
                      onClick={() => setPaginaCitas((p) => Math.max(1, p - 1))}
                    >
                      Anterior
                    </button>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Página {paginaCitas} de {totalPaginasLista}
                    </span>
                    <button
                      type="button"
                      className="btn-secondary text-sm"
                      disabled={paginaCitas >= totalPaginasLista}
                      onClick={() => setPaginaCitas((p) => Math.min(totalPaginasLista, p + 1))}
                    >
                      Siguiente
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
      </>
      )}
    </div>
  )
}
