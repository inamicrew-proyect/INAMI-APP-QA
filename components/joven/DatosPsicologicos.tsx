'use client'

import { Brain, AlertCircle, Shield } from 'lucide-react'

interface DatosPsicologicosProps {
  data: any
  onChange: (data: any) => void
  editable: boolean
  userRole: string
}

export default function DatosPsicologicos({ data, onChange, editable, userRole }: DatosPsicologicosProps) {

  const datosPsicologicos = data.datos_psicologicos || {}

  const handleInputChange = (field: string, value: any) => {
    onChange({
      ...data,
      datos_psicologicos: {
        ...datosPsicologicos,
        [field]: value
      }
    })
  }

  const isPsychologicalUser = userRole === 'psicologo'
  const canViewSensitive = ['psicologo', 'trabajador_social', 'medico'].includes(userRole)

  return (
    <div className="datos-psicologicos">
      <div className="flex items-center gap-3 mb-6">
        <Brain className="w-6 h-6 text-pink-600" />
        <div>
          <h2 className="text-xl font-bold text-gray-900">Datos Psicológicos</h2>
          <p className="text-sm text-gray-600">
            Información psicológica y de salud mental del NNAJ
            {editable ? (
              <span className="ml-2 text-green-600 font-medium">• Puedes editar</span>
            ) : (
              <span className="ml-2 text-gray-500">• Solo lectura</span>
            )}
          </p>
        </div>
      </div>

      {/* Estado Psicológico General */}
      <div className="card mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado Psicológico General</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado Emocional
            </label>
            <select
              value={datosPsicologicos.estado_emocional || ''}
              onChange={(e) => handleInputChange('estado_emocional', e.target.value)}
              disabled={!editable}
              className={`input-field ${!editable ? 'bg-gray-50' : ''}`}
            >
              <option value="">Seleccionar estado</option>
              <option value="Estable">Estable</option>
              <option value="Ansioso">Ansioso</option>
              <option value="Deprimido">Deprimido</option>
              <option value="Irritable">Irritable</option>
              <option value="Agresivo">Agresivo</option>
              <option value="Retraído">Retraído</option>
              <option value="Otro">Otro</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nivel de Funcionamiento
            </label>
            <select
              value={datosPsicologicos.nivel_funcionamiento || ''}
              onChange={(e) => handleInputChange('nivel_funcionamiento', e.target.value)}
              disabled={!editable}
              className={`input-field ${!editable ? 'bg-gray-50' : ''}`}
            >
              <option value="">Seleccionar nivel</option>
              <option value="Alto">Alto</option>
              <option value="Medio">Medio</option>
              <option value="Bajo">Bajo</option>
              <option value="Muy bajo">Muy bajo</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Capacidad de Adaptación
            </label>
            <select
              value={datosPsicologicos.capacidad_adaptacion || ''}
              onChange={(e) => handleInputChange('capacidad_adaptacion', e.target.value)}
              disabled={!editable}
              className={`input-field ${!editable ? 'bg-gray-50' : ''}`}
            >
              <option value="">Seleccionar capacidad</option>
              <option value="Excelente">Excelente</option>
              <option value="Buena">Buena</option>
              <option value="Regular">Regular</option>
              <option value="Deficiente">Deficiente</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Habilidades Sociales
            </label>
            <select
              value={datosPsicologicos.habilidades_sociales || ''}
              onChange={(e) => handleInputChange('habilidades_sociales', e.target.value)}
              disabled={!editable}
              className={`input-field ${!editable ? 'bg-gray-50' : ''}`}
            >
              <option value="">Seleccionar habilidades</option>
              <option value="Desarrolladas">Desarrolladas</option>
              <option value="En desarrollo">En desarrollo</option>
              <option value="Limitadas">Limitadas</option>
              <option value="Deficientes">Deficientes</option>
            </select>
          </div>
        </div>
      </div>

      {/* Evaluaciones Psicológicas */}
      <div className="card mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Evaluaciones Psicológicas</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Evaluación Realizada
            </label>
            <select
              value={datosPsicologicos.tipo_evaluacion || ''}
              onChange={(e) => handleInputChange('tipo_evaluacion', e.target.value)}
              disabled={!editable}
              className={`input-field ${!editable ? 'bg-gray-50' : ''}`}
            >
              <option value="">Seleccionar tipo</option>
              <option value="Evaluación inicial">Evaluación inicial</option>
              <option value="Evaluación de seguimiento">Evaluación de seguimiento</option>
              <option value="Evaluación final">Evaluación final</option>
              <option value="Evaluación especializada">Evaluación especializada</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de la Evaluación
            </label>
            <input
              type="date"
              value={datosPsicologicos.fecha_evaluacion || ''}
              onChange={(e) => handleInputChange('fecha_evaluacion', e.target.value)}
              disabled={!editable}
              className={`input-field ${!editable ? 'bg-gray-50' : ''}`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Instrumentos Utilizados
            </label>
            <textarea
              value={datosPsicologicos.instrumentos_utilizados || ''}
              onChange={(e) => handleInputChange('instrumentos_utilizados', e.target.value)}
              disabled={!editable}
              className={`input-field ${!editable ? 'bg-gray-50' : ''}`}
              rows={3}
              placeholder="Instrumentos de evaluación utilizados"
            />
          </div>
        </div>
      </div>

      {/* Información Psicológica Confidencial - Solo para psicólogos */}
      {isPsychologicalUser && (
        <div className="card mb-6 border-pink-200 bg-pink-50">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-pink-600" />
            <h3 className="text-lg font-semibold text-pink-900">Información Psicológica Confidencial</h3>
            <span className="px-2 py-1 bg-pink-100 text-pink-800 text-xs rounded-full">Solo Psicólogos</span>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Evaluaciones Psicológicas Detalladas
              </label>
              <textarea
                value={datosPsicologicos.evaluaciones_psicologicas || ''}
                onChange={(e) => handleInputChange('evaluaciones_psicologicas', e.target.value)}
                disabled={!editable}
                className={`input-field ${!editable ? 'bg-gray-50' : ''}`}
                rows={4}
                placeholder="Resultados detallados de evaluaciones psicológicas"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Diagnóstico Psicológico
              </label>
              <textarea
                value={datosPsicologicos.diagnostico_psicologico || ''}
                onChange={(e) => handleInputChange('diagnostico_psicologico', e.target.value)}
                disabled={!editable}
                className={`input-field ${!editable ? 'bg-gray-50' : ''}`}
                rows={4}
                placeholder="Diagnóstico psicológico detallado"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observaciones Clínicas
              </label>
              <textarea
                value={datosPsicologicos.observaciones_clinicas || ''}
                onChange={(e) => handleInputChange('observaciones_clinicas', e.target.value)}
                disabled={!editable}
                className={`input-field ${!editable ? 'bg-gray-50' : ''}`}
                rows={4}
                placeholder="Observaciones clínicas confidenciales"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tratamiento Psicológico */}
      <div className="card mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tratamiento Psicológico</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              En Tratamiento Psicológico
            </label>
            <select
              value={datosPsicologicos.en_tratamiento || ''}
              onChange={(e) => handleInputChange('en_tratamiento', e.target.value)}
              disabled={!editable}
              className={`input-field ${!editable ? 'bg-gray-50' : ''}`}
            >
              <option value="">Seleccionar opción</option>
              <option value="Sí">Sí</option>
              <option value="No">No</option>
              <option value="En proceso">En proceso</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Terapia
            </label>
            <select
              value={datosPsicologicos.tipo_terapia || ''}
              onChange={(e) => handleInputChange('tipo_terapia', e.target.value)}
              disabled={!editable}
              className={`input-field ${!editable ? 'bg-gray-50' : ''}`}
            >
              <option value="">Seleccionar tipo</option>
              <option value="Individual">Individual</option>
              <option value="Familiar">Familiar</option>
              <option value="Grupal">Grupal</option>
              <option value="Cognitivo-conductual">Cognitivo-conductual</option>
              <option value="Sistémica">Sistémica</option>
              <option value="Otro">Otro</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Frecuencia de Sesiones
            </label>
            <select
              value={datosPsicologicos.frecuencia_sesiones || ''}
              onChange={(e) => handleInputChange('frecuencia_sesiones', e.target.value)}
              disabled={!editable}
              className={`input-field ${!editable ? 'bg-gray-50' : ''}`}
            >
              <option value="">Seleccionar frecuencia</option>
              <option value="Diaria">Diaria</option>
              <option value="3 veces por semana">3 veces por semana</option>
              <option value="2 veces por semana">2 veces por semana</option>
              <option value="Semanal">Semanal</option>
              <option value="Quincenal">Quincenal</option>
              <option value="Mensual">Mensual</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duración del Tratamiento
            </label>
            <input
              type="text"
              value={datosPsicologicos.duracion_tratamiento || ''}
              onChange={(e) => handleInputChange('duracion_tratamiento', e.target.value)}
              disabled={!editable}
              className={`input-field ${!editable ? 'bg-gray-50' : ''}`}
              placeholder="Duración del tratamiento"
            />
          </div>
        </div>
      </div>

      {/* Factores de Riesgo y Protección */}
      <div className="card mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Factores de Riesgo y Protección</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Factores de Riesgo Identificados
            </label>
            <textarea
              value={datosPsicologicos.factores_riesgo || ''}
              onChange={(e) => handleInputChange('factores_riesgo', e.target.value)}
              disabled={!editable}
              className={`input-field ${!editable ? 'bg-gray-50' : ''}`}
              rows={3}
              placeholder="Factores de riesgo psicológico identificados"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Factores de Protección
            </label>
            <textarea
              value={datosPsicologicos.factores_proteccion || ''}
              onChange={(e) => handleInputChange('factores_proteccion', e.target.value)}
              disabled={!editable}
              className={`input-field ${!editable ? 'bg-gray-50' : ''}`}
              rows={3}
              placeholder="Factores de protección identificados"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Red de Apoyo
            </label>
            <textarea
              value={datosPsicologicos.red_apoyo || ''}
              onChange={(e) => handleInputChange('red_apoyo', e.target.value)}
              disabled={!editable}
              className={`input-field ${!editable ? 'bg-gray-50' : ''}`}
              rows={3}
              placeholder="Red de apoyo social y familiar"
            />
          </div>
        </div>
      </div>

      {/* Seguimiento Psicológico */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Seguimiento Psicológico</h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Última Evaluación Psicológica
              </label>
              <input
                type="date"
                value={datosPsicologicos.ultima_evaluacion_psicologica || ''}
                onChange={(e) => handleInputChange('ultima_evaluacion_psicologica', e.target.value)}
                disabled={!editable}
                className={`input-field ${!editable ? 'bg-gray-50' : ''}`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Próxima Evaluación
              </label>
              <input
                type="date"
                value={datosPsicologicos.proxima_evaluacion_psicologica || ''}
                onChange={(e) => handleInputChange('proxima_evaluacion_psicologica', e.target.value)}
                disabled={!editable}
                className={`input-field ${!editable ? 'bg-gray-50' : ''}`}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observaciones Psicológicas
            </label>
            <textarea
              value={datosPsicologicos.observaciones_psicologicas || ''}
              onChange={(e) => handleInputChange('observaciones_psicologicas', e.target.value)}
              disabled={!editable}
              className={`input-field ${!editable ? 'bg-gray-50' : ''}`}
              rows={4}
              placeholder="Observaciones sobre el proceso psicológico"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recomendaciones Psicológicas
            </label>
            <textarea
              value={datosPsicologicos.recomendaciones_psicologicas || ''}
              onChange={(e) => handleInputChange('recomendaciones_psicologicas', e.target.value)}
              disabled={!editable}
              className={`input-field ${!editable ? 'bg-gray-50' : ''}`}
              rows={3}
              placeholder="Recomendaciones para el desarrollo psicológico"
            />
          </div>
        </div>
      </div>

      {/* Información de permisos */}
      {!editable && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            <p className="text-sm text-blue-800">
              <strong>Información:</strong> Solo puedes ver estos datos. Para editarlos, contacta al área de Psicología.
            </p>
          </div>
        </div>
      )}

      {/* Información sobre datos confidenciales */}
      {!isPsychologicalUser && canViewSensitive && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-yellow-600" />
            <p className="text-sm text-yellow-800">
              <strong>Nota:</strong> Algunos datos psicológicos confidenciales solo son visibles para el personal psicológico.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

