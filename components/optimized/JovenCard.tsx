import React, { memo } from 'react'
import { User, Calendar, MapPin, Phone, Edit, Eye } from 'lucide-react'
import type { Centro, Joven } from '@/lib/supabase'

type JovenWithCentro = Joven & { centros?: Centro | null; departamento?: string | null }

interface JovenCardProps {
  joven: JovenWithCentro
  onEdit: (id: string) => void
  onView: (id: string) => void
}

const JovenCard = memo(({ joven, onEdit, onView }: JovenCardProps) => {
  const centroAsociado = ((joven as unknown as { centros?: Centro | null })?.centros) ?? null

  const calcularEdad = (fechaNacimiento: string) => {
    if (!fechaNacimiento) return ''
    const hoy = new Date()
    const nacimiento = new Date(fechaNacimiento)
    let edad = hoy.getFullYear() - nacimiento.getFullYear()
    const mes = hoy.getMonth() - nacimiento.getMonth()
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--
    }
    return edad.toString()
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {joven.nombres} {joven.apellidos}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {centroAsociado?.nombre || 'Sin centro asignado'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onView(joven.id)}
            className="btn-secondary p-2"
            title="Ver expediente"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEdit(joven.id)}
            className="btn-primary p-2"
            title="Editar"
          >
            <Edit className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
          <Calendar className="w-4 h-4" />
          <span>Edad: {calcularEdad(joven.fecha_nacimiento)} años</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
          <MapPin className="w-4 h-4" />
          <span>{joven.departamento || 'Sin departamento'}</span>
        </div>
        {joven.telefono && (
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <Phone className="w-4 h-4" />
            <span>{joven.telefono}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
          <span>ID: {joven.identidad || 'Sin identidad'}</span>
        </div>
      </div>
    </div>
  )
})

JovenCard.displayName = 'JovenCard'

export default JovenCard
