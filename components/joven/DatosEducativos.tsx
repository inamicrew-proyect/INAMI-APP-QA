'use client'

import { BookOpen, AlertCircle, Shield } from 'lucide-react'

interface DatosEducativosProps {
  data: any
  onChange: (data: any) => void
  editable: boolean
  userRole: string
}

export default function DatosEducativos({ data, onChange, editable, userRole }: DatosEducativosProps) {

  const datosEducativos = data.datos_educativos || {}

  const handleInputChange = (field: string, value: any) => {
    onChange({
      ...data,
      datos_educativos: {
        ...datosEducativos,
        [field]: value
      }
    })
  }

  const isEducationalUser = userRole === 'pedagogo'
  const canViewSensitive = ['pedagogo', 'trabajador_social', 'psicologo'].includes(userRole)

  return (
    <div className="datos-educativos">
      <div className="flex items-center gap-3 mb-6">
        <BookOpen className="w-6 h-6 text-purple-600" />
        <div>
          <h2 className="text-xl font-bold text-gray-900">Datos Educativos</h2>
          <p className="text-sm text-gray-600">
            Información académica y educativa del NNAJ
            {editable ? (
              <span className="ml-2 text-green-600 font-medium">• Puedes editar</span>
            ) : (
              <span className="ml-2 text-gray-500">• Solo lectura</span>
            )}
          </p>
        </div>
      </div>

      {/* Información Educativa Básica */}
      <div className="card mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Educativa Básica</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nivel Académico
            </label>
            <input
              type="text"
              value={datosEducativos.nivel_academico || ''}
              onChange={(e) => handleInputChange('nivel_academico', e.target.value)}
              disabled={!editable}
              className="input-field"
              placeholder="Ej: Primaria, Secundaria, Bachillerato"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Grado Actual
            </label>
            <input
              type="text"
              value={datosEducativos.grado_actual || ''}
              onChange={(e) => handleInputChange('grado_actual', e.target.value)}
              disabled={!editable}
              className="input-field"
              placeholder="Ej: 6to grado, 3er año"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rendimiento Académico
            </label>
            <select
              value={datosEducativos.rendimiento_academico || ''}
              onChange={(e) => handleInputChange('rendimiento_academico', e.target.value)}
              disabled={!editable}
              className="input-field"
            >
              <option value="">Seleccionar rendimiento</option>
              <option value="excelente">Excelente</option>
              <option value="bueno">Bueno</option>
              <option value="regular">Regular</option>
              <option value="deficiente">Deficiente</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Áreas de Fortaleza
            </label>
            <input
              type="text"
              value={datosEducativos.areas_fortaleza || ''}
              onChange={(e) => handleInputChange('areas_fortaleza', e.target.value)}
              disabled={!editable}
              className="input-field"
              placeholder="Ej: Matemáticas, Ciencias"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Áreas de Mejora
          </label>
          <input
            type="text"
            value={datosEducativos.areas_mejora || ''}
            onChange={(e) => handleInputChange('areas_mejora', e.target.value)}
            disabled={!editable}
            className="input-field"
            placeholder="Ej: Lectura, Escritura"
          />
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Plan Educativo
          </label>
          <textarea
            value={datosEducativos.plan_educativo || ''}
            onChange={(e) => handleInputChange('plan_educativo', e.target.value)}
            disabled={!editable}
            className="input-field"
            rows={3}
            placeholder="Describe el plan educativo personalizado..."
          />
        </div>
      </div>

      {/* Información de Acceso */}
      {!canViewSensitive && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-yellow-600" />
            <p className="text-sm text-yellow-800">
              <strong>Acceso limitado:</strong> Solo puedes ver información básica. 
              Para acceder a datos sensibles, contacta al administrador.
            </p>
          </div>
        </div>
      )}

      {/* Información Sensible (solo para roles autorizados) */}
      {canViewSensitive && (
        <div className="card mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Sensible</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Evaluaciones Psicológicas
              </label>
              <textarea
                value={datosEducativos.evaluaciones_psicologicas || ''}
                onChange={(e) => handleInputChange('evaluaciones_psicologicas', e.target.value)}
                disabled={!editable}
                className="input-field"
                rows={3}
                placeholder="Resultados de evaluaciones psicológicas..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Necesidades Especiales
              </label>
              <textarea
                value={datosEducativos.necesidades_especiales || ''}
                onChange={(e) => handleInputChange('necesidades_especiales', e.target.value)}
                disabled={!editable}
                className="input-field"
                rows={3}
                placeholder="Necesidades educativas especiales..."
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observaciones Clínicas
            </label>
            <textarea
              value={datosEducativos.observaciones_clinicas || ''}
              onChange={(e) => handleInputChange('observaciones_clinicas', e.target.value)}
              disabled={!editable}
              className="input-field"
              rows={3}
              placeholder="Observaciones clínicas relevantes..."
            />
          </div>
        </div>
      )}

      {/* Mensaje de permisos */}
      {!isEducationalUser && editable && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            <p className="text-sm text-blue-800">
              <strong>Nota:</strong> Solo los pedagogos pueden editar información educativa sensible.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}