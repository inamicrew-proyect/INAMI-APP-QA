'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'

// 1. CAMBIO: Borramos la importación del cliente antiguo
// import { supabase } from '@/lib/supabase' 
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Joven, TipoAtencion } from '@/lib/supabase'
import NoUsersWarning from '@/components/NoUsersWarning'
import { atencionCreateSchema } from '@/lib/validation/atenciones'
import { zodErrorToFieldErrors } from '@/lib/validation/utils'

export default function NuevaAtencionPage() {
  // 2. CAMBIO: Creamos el cliente nuevo
  const supabase = createClientComponentClient()

  const router = useRouter()
  const [jovenes, setJovenes] = useState<Joven[]>([])
  const [tiposAtencion, setTiposAtencion] = useState<TipoAtencion[]>([])
  const [loading, setLoading] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [formData, setFormData] = useState({
  	joven_id: '',
  	tipo_atencion_id: '',
  	fecha_atencion: new Date().toISOString().slice(0, 16),
  	motivo: '',
  	observaciones: '',
  	recomendaciones: '',
  	proxima_cita: '',
  	estado: 'pendiente',
  })
  const [formularioEspecifico, setFormularioEspecifico] = useState<any>({})
  const [tipoSeleccionado, setTipoSeleccionado] = useState<TipoAtencion | null>(null)
  const [showNoUsersWarning, setShowNoUsersWarning] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [jovenSearchTerm, setJovenSearchTerm] = useState('')
  const [showJovenDropdown, setShowJovenDropdown] = useState(false)

  useEffect(() => {
  	loadData()
  }, [])

  // Filtrar jóvenes según el término de búsqueda
  const filteredJovenes = jovenes.filter(joven => {
    const searchLower = jovenSearchTerm.toLowerCase()
    const fullName = `${joven.nombres} ${joven.apellidos}`.toLowerCase()
    return fullName.includes(searchLower) || 
           joven.nombres.toLowerCase().includes(searchLower) || 
           joven.apellidos.toLowerCase().includes(searchLower)
  })

  // Manejar selección de joven
  const handleJovenSelect = (joven: Joven) => {
    setFormData(prev => ({ ...prev, joven_id: joven.id }))
    setJovenSearchTerm(`${joven.nombres} ${joven.apellidos}`)
    setShowJovenDropdown(false)
    if (errors.joven_id) {
      setErrors(prev => ({ ...prev, joven_id: '' }))
    }
  }

  // Manejar cambio en el input de búsqueda
  const handleJovenSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setJovenSearchTerm(value)
    setShowJovenDropdown(true)
    
    // Si se borra el texto, limpiar la selección
    if (!value) {
      setFormData(prev => ({ ...prev, joven_id: '' }))
    }
  }

  const loadData = async () => {
  	// Load current user
    // 3. CAMBIO: Usamos la nueva forma de obtener el usuario
  	const { data: { user } } = await supabase.auth.getUser() 
  	if (user) setCurrentUserId(user.id)

  	// Load jovenes activos
    // El resto de la función usa la variable 'supabase' que ya creamos,
    // así que ahora funcionará.
  	const { data: jovenesData } = await supabase
  	  .from('jovenes')
  	  .select('*')
  	  .eq('estado', 'activo')
  	  .order('nombres')
  	
  	if (jovenesData) setJovenes(jovenesData)

  	// Load tipos de atencion
  	const { data: tiposData } = await supabase
  	  .from('tipos_atencion')
  	  .select('*')
  	  .order('nombre')
  	
  	if (tiposData) setTiposAtencion(tiposData)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
  	const { name, value } = e.target
  	setFormData(prev => ({ ...prev, [name]: value }))
  	if (errors[name]) {
  	  setErrors(prev => ({ ...prev, [name]: '' }))
  	}
  	
  	// Si cambia el tipo de atención, actualizar el tipo seleccionado
  	if (name === 'tipo_atencion_id') {
  	  const tipo = tiposAtencion.find(t => t.id === value)
  	  setTipoSeleccionado(tipo || null)
  	}
  }

  const handleFormularioEspecificoChange = (field: string, value: any) => {
  	setFormularioEspecifico((prev: any) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
  	e.preventDefault()
  	setErrors({})
  	setLoading(true)

  	try {
  	  const parsed = atencionCreateSchema.safeParse({
  		...formData,
  		proxima_cita: formData.proxima_cita || undefined,
  	  })

  	  if (!parsed.success) {
  		setErrors(zodErrorToFieldErrors(parsed.error))
  		setLoading(false)
  		return
  	  }

  	  const sanitized = parsed.data

  	  setFormData((prev) => ({
  		...prev,
  		joven_id: sanitized.joven_id,
  		tipo_atencion_id: sanitized.tipo_atencion_id,
  		fecha_atencion: sanitized.fecha_atencion,
  		motivo: sanitized.motivo,
  		observaciones: sanitized.observaciones ?? '',
  		recomendaciones: sanitized.recomendaciones ?? '',
  		proxima_cita: sanitized.proxima_cita ?? '',
  		estado: sanitized.estado,
  	  }))

  	  // Verificar que tenemos un usuario válido
  	  if (!currentUserId) {
        // 4. CAMBIO: Usamos la nueva forma de obtener el usuario
  		const { data: { user } } = await supabase.auth.getUser() 
  		if (!user) {
  		  alert('Error: No se pudo obtener la información del usuario. Por favor, inicia sesión nuevamente.')
  		  router.push('/login')
  		  return
  		}
  		setCurrentUserId(user.id)
  	  }

  	  const dataToInsert = {
  		joven_id: sanitized.joven_id,
  		tipo_atencion_id: sanitized.tipo_atencion_id,
  		fecha_atencion: sanitized.fecha_atencion,
  		motivo: sanitized.motivo,
  		profesional_id: currentUserId,
  		proxima_cita: sanitized.proxima_cita ?? null,
  		observaciones: sanitized.observaciones ?? null,
  		recomendaciones: sanitized.recomendaciones ?? null,
  		estado: sanitized.estado,
  	  }
      
      // 'supabase' aquí ya es el cliente correcto
  	  const { data: atencionData, error: atencionError } = await supabase
  		.from('atenciones')
  		.insert([dataToInsert])
  		.select()

  	  if (atencionError) {
  		console.error('Error detallado al crear atención:', atencionError)
  		if (atencionError.code === '23503') {
  		  setShowNoUsersWarning(true)
  		  return
  		} else {
  		  alert(`Error al registrar la atención: ${atencionError.message}`)
  		}
  		throw atencionError
  	  }

  	  // Si hay formulario específico, guardarlo también
  	  if (Object.keys(formularioEspecifico).length > 0 && atencionData && atencionData[0]) {
  		const { error: formularioError } = await supabase
  		  .from('formularios_atencion')
  		  .insert([{
  			atencion_id: atencionData[0].id,
  			datos_json: formularioEspecifico
  		  }])

  		if (formularioError) {
  		  console.error('Error saving specific form:', formularioError)
  		  // No lanzar error aquí, la atención principal ya se guardó
  		}
  	  }

	  // Disparar evento para actualizar la lista
	  if (typeof window !== 'undefined') {
		window.dispatchEvent(new CustomEvent('atenciones:updated'))
	  }
	  
	  alert('Atención registrada exitosamente')
	  router.push('/dashboard/atenciones')
  	} catch (error) {
  	  console.error('Error creating atencion:', error)
  	  alert('Error al registrar la atención')
  	} finally {
  	  setLoading(false)
  	}
  }

  // ... (Pega el resto de tu archivo aquí)
  // La función 'renderFormularioEspecifico' y el 'return'
  // no necesitan ningún cambio.
  
  const renderFormularioEspecifico = () => {
  	if (!tipoSeleccionado) return null

  	const profesional = tipoSeleccionado.profesional_responsable

  	switch (profesional) {
  	  case 'medico':
  		return (
  		  <div className="card">
  			<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Formulario Médico</h3>
  			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  			  <div>
  				<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
  				  Historia Clínica
  				</label>
  				<textarea
  				  value={formularioEspecifico.historia_clinica || ''}
  				  onChange={(e) => handleFormularioEspecificoChange('historia_clinica', e.target.value)}
  				  className="input-field"
  				  rows={3}
  				  placeholder="Describa la historia clínica del paciente..."
  				/>
  			  </div>
  			  <div>
  				<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
  				  Examen Físico
  				</label>
  				<textarea
  				  value={formularioEspecifico.examen_fisico || ''}
  				  onChange={(e) => handleFormularioEspecificoChange('examen_fisico', e.target.value)}
  				  className="input-field"
  				  rows={3}
  				  placeholder="Resultados del examen físico..."
  				/>
  			  </div>
  			  <div>
  				<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
  				  Diagnóstico
  				</label>
  				<input
  				  type="text"
  				  value={formularioEspecifico.diagnostico || ''}
  				  onChange={(e) => handleFormularioEspecificoChange('diagnostico', e.target.value)}
  				  className="input-field"
  				  placeholder="Diagnóstico médico..."
  				/>
  			  </div>
  			  <div>
  				<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
  				  Tratamiento
  				</label>
  				<textarea
  				  value={formularioEspecifico.tratamiento || ''}
  				  onChange={(e) => handleFormularioEspecificoChange('tratamiento', e.target.value)}
  				  className="input-field"
  				  rows={3}
  				  placeholder="Tratamiento prescrito..."
  				/>
  			  </div>
  			</div>
  		  </div>
  		)

  	  case 'psicologo':
  		return (
  		  <div className="card">
  			<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Formulario Psicológico</h3>
  			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  			  <div>
  				<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
  				  Evaluación Psicológica
  				</label>
  				<textarea
  				  value={formularioEspecifico.evaluacion_psicologica || ''}
  				  onChange={(e) => handleFormularioEspecificoChange('evaluacion_psicologica', e.target.value)}
  				  className="input-field"
  				  rows={3}
  				  placeholder="Resultados de la evaluación psicológica..."
  				/>
  			  </div>
  			  <div>
  				<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
  				  Diagnóstico Psicológico
  				</label>
  				<input
  				  type="text"
  				  value={formularioEspecifico.diagnostico_psicologico || ''}
  				  onChange={(e) => handleFormularioEspecificoChange('diagnostico_psicologico', e.target.value)}
  				  className="input-field"
  				  placeholder="Diagnóstico psicológico..."
  				/>
  			  </div>
  			  <div>
  				<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
  				  Recomendaciones Terapéuticas
  				</label>
  				<textarea
  				  value={formularioEspecifico.recomendaciones_terapeuticas || ''}
  				  onChange={(e) => handleFormularioEspecificoChange('recomendaciones_terapeuticas', e.target.value)}
  				  className="input-field"
  				  rows={3}
  				  placeholder="Recomendaciones terapéuticas..."
  				/>
  			  </div>
  			</div>
  		  </div>
  		)

  	  case 'trabajador_social':
  		return (
  		  <div className="card">
  			<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Formulario de Trabajo Social</h3>
  			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  			  <div>
  				<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
  				  Evaluación Social
  				</label>
  				<textarea
  				  value={formularioEspecifico.evaluacion_social || ''}
  				  onChange={(e) => handleFormularioEspecificoChange('evaluacion_social', e.target.value)}
className="input-field"
  				  rows={3}
  				  placeholder="Evaluación del contexto social..."
  				/>
  			  </div>
  			  <div>
  				<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
  				  Situación Familiar
  				</label>
  				<textarea
  				  value={formularioEspecifico.situacion_familiar || ''}
  				  onChange={(e) => handleFormularioEspecificoChange('situacion_familiar', e.target.value)}
  				  className="input-field"
  				  rows={3}
  				  placeholder="Descripción de la situación familiar..."
  				/>
  			  </div>
  			  <div>
  				<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
  				  Recursos Disponibles
  				</label>
  				<textarea
  				  value={formularioEspecifico.recursos_disponibles || ''}
  				  onChange={(e) => handleFormularioEspecificoChange('recursos_disponibles', e.target.value)}
  				  className="input-field"
  				  rows={3}
  				  placeholder="Recursos disponibles para el joven..."
  				/>
  			  </div>
  			</div>
  		  </div>
  		)

  	  case 'abogado':
  		return (
  		  <div className="card">
  			<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Formulario Legal</h3>
  			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  			  <div>
  				<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
  				  Situación Legal
  				</label>
  				<textarea
  				  value={formularioEspecifico.situacion_legal || ''}
  				  onChange={(e) => handleFormularioEspecificoChange('situacion_legal', e.target.value)}
  				  className="input-field"
  				  rows={3}
  				  placeholder="Descripción de la situación legal..."
  				/>
  			  </div>
  			  <div>
  				<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
  				  Proceso Judicial
  				</label>
  				<textarea
  				  value={formularioEspecifico.proceso_judicial || ''}
  				  onChange={(e) => handleFormularioEspecificoChange('proceso_judicial', e.target.value)}
  				  className="input-field"
  				  rows={3}
  				  placeholder="Estado del proceso judicial..."
  				/>
  			  </div>
  			  <div>
  				<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
D 				  erechos del Menor
  				</label>
  				<textarea
  				  value={formularioEspecifico.derechos_menor || ''}
  				  onChange={(e) => handleFormularioEspecificoChange('derechos_menor', e.target.value)}
  				  className="input-field"
  				  rows={3}
  				  placeholder="Derechos que se están garantizando..."
  				/>
  			  </div>
  			</div>
  		  </div>
  		)

  	  case 'pedagogo':
  		return (
  		  <div className="card">
  			<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Formulario Pedagógico</h3>
  			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  			  <div>
  				<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
  				  Evaluación Educativa
  				</label>
  				<textarea
  				  value={formularioEspecifico.evaluacion_educativa || ''}
  				  onChange={(e) => handleFormularioEspecificoChange('evaluacion_educativa', e.target.value)}
  				  className="input-field"
  				  rows={3}
  				  placeholder="Evaluación del nivel educativo..."
  				/>
  			  </div>
  			  <div>
  				<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
  				  Plan de Estudios
  				</label>
  				<textarea
  				  value={formularioEspecifico.plan_estudios || ''}
  				  onChange={(e) => handleFormularioEspecificoChange('plan_estudios', e.target.value)}
  				  className="input-field"
  				  rows={3}
  				  placeholder="Plan de estudios recomendado..."
  				/>
  			  </div>
  			  <div>
  				<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
source   				  Necesidades Educativas
  				</label>
  				<textarea
  				  value={formularioEspecifico.necesidades_educativas || ''}
  				  onChange={(e) => handleFormularioEspecificoChange('necesidades_educativas', e.target.value)}
  				  className="input-field"
  				  rows={3}
  				  placeholder="Necesidades educativas especiales..."
  				/>
  			  </div>
  			</div>
  		  </div>
  		)

  	  case 'seguridad':
  		return (
  		  <div className="card">
  			<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Formulario de Seguridad</h3>
  			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  			  <div>
  				<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
  				  Registro de Ingreso
  				</label>
  				<textarea
  				  value={formularioEspecifico.registro_ingreso || ''}
  				  onChange={(e) => handleFormularioEspecificoChange('registro_ingreso', e.target.value)}
  				  className="input-field"
  				  rows={3}
  				  placeholder="Detalles del registro de ingreso..."
  				/>
  			  </div>
  			  <div>
  				<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
  				  Medidas de Seguridad
  				</label>
  				<textarea
  				  value={formularioEspecifico.medidas_seguridad || ''}
  				  onChange={(e) => handleFormularioEspecificoChange('medidas_seguridad', e.target.value)}
  				  className="input-field"
  				  rows={3}
  				  placeholder="Medidas de seguridad aplicadas..."
  				/>
  			  </div>
  			</div>
  		  </div>
  		)

  	  default:
  		return null
  	}
  }

  return (
  	<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
  	  {/* Header */}
  	  <div className="mb-8">
  		<Link href="/dashboard/atenciones" className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-4">
  		  <ArrowLeft className="w-4 h-4" />
  		  Volver a lista
  		</Link>
  		<h1 className="text-3xl font-bold text-gray-900 dark:text-white">Registrar Nueva Atención</h1>
ar   	<p className="text-gray-600 dark:text-gray-300 mt-2">Complete la información de la atención</p>
  	  </div>

  	  {/* Form */}
  	  <form onSubmit={handleSubmit} className="space-y-6">
  		{/* Información Básica */}
  		<div className="card">
  		  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Información Básica</h2>
  		  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  			<div className="md:col-span-2 relative">
  			  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
  				Joven <span className="text-red-500">*</span>
  			  </label>
  			  <div className="relative">
  				<input
  				  type="text"
  				  value={jovenSearchTerm}
  				  onChange={handleJovenSearchChange}
  				  onFocus={() => setShowJovenDropdown(true)}
  				  onBlur={() => setTimeout(() => setShowJovenDropdown(false), 200)}
  				  placeholder="Buscar por nombre o apellido..."
  				  className="input-field w-full pr-10"
  				  required={!formData.joven_id}
  				/>
  				{showJovenDropdown && jovenSearchTerm && filteredJovenes.length > 0 && (
  				  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto">
  					{filteredJovenes.map(joven => (
  					  <div
  						key={joven.id}
  						onClick={() => handleJovenSelect(joven)}
  						className="px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
  					  >
  						<div className="font-medium text-gray-900 dark:text-white">
  						  {joven.nombres} {joven.apellidos}
  						</div>
  						<div className="text-sm text-gray-500 dark:text-gray-400">
  						  {joven.edad} años
  						</div>
  					  </div>
  					))}
  				  </div>
  				)}
  				{showJovenDropdown && jovenSearchTerm && filteredJovenes.length === 0 && (
  				  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-4">
  					<p className="text-gray-500 dark:text-gray-400 text-sm">No se encontraron jóvenes</p>
  				  </div>
  				)}
  			  </div>
  			{errors.joven_id && <p className="text-red-500 text-sm mt-1">{errors.joven_id}</p>}
  			</div>

  			<div>
  			  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
  				Tipo de Atención <span className="text-red-500">*</span>
  			  </label>
  			  <select
  				name="tipo_atencion_id"
  				value={formData.tipo_atencion_id}
  				onChange={handleChange}
  				className="input-field"
  				required
  			  >
  				<option value="">Seleccionar tipo...</option>
  				{tiposAtencion.map(tipo => (
  				  <option key={tipo.id} value={tipo.id}>
  					{tipo.nombre}
  				  </option>
  				))}
  			  </select>
  			{errors.tipo_atencion_id && <p className="text-red-500 text-sm mt-1">{errors.tipo_atencion_id}</p>}
  			</div>

  			<div>
  			  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
  				Fecha y Hora <span className="text-red-500">*</span>
  			  </label>
  			  <input
  				type="datetime-local"
  				name="fecha_atencion"
  				value={formData.fecha_atencion}
  				onChange={handleChange}
  				className="input-field"
  				required
  			  />
  			{errors.fecha_atencion && <p className="text-red-500 text-sm mt-1">{errors.fecha_atencion}</p>}
style   		</div>

  			<div>
  			  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
  				Estado
  			  </label>
  			  <select
  				name="estado"
  				value={formData.estado}
  				onChange={handleChange}
  				className="input-field"
  			  >
  				<option value="pendiente">Pendiente</option>
  				<option value="en_proceso">En Proceso</option>
source   			<option value="completada">Completada</option>
  				<option value="cancelada">Cancelada</option>
  			  </select>
  			{errors.estado && <p className="text-red-500 text-sm mt-1">{errors.estado}</p>}
  			</div>

  			<div>
  			  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
  				Próxima Cita
  			  </label>
  			  <input   		type="date"
  				name="proxima_cita"
  				value={formData.proxima_cita}
  				onChange={handleChange}
  				className="input-field"
  			  />
  			{errors.proxima_cita && <p className="text-red-500 text-sm mt-1">{errors.proxima_cita}</p>}
  			</div>
  		  </div>
  		</div>

  		{/* Detalles de la Atención */}
  		<div className="card">
  		  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Detalles de la Atención</h2>
svg   		<div className="space-y-6">
  			<div>
  			  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
  				Motivo de la Atención <span className="text-red-500">*</span>
  			  </label>
  			  <textarea
  				name="motivo"
  				value={formData.motivo}
  				onChange={handleChange}   			className="input-field"
  				rows={3}
  				placeholder="Describa el motivo de esta atención..."
  				required
  			  />
  			{errors.motivo && <p className="text-red-500 text-sm mt-1">{errors.motivo}</p>}
  			</div>

  			<div>
  			  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
  				Observaciones
  			  </label>
  			  <textarea
  				name="observaciones"
  				value={formData.observaciones}
  				onChange={handleChange}
  				className="input-field"
  				rows={4}
  				placeholder="Observaciones generales durante la atención..."
  			  />
  			</div>

  			<div>
  			  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
  				Recomendaciones
  			  </label>
  			  <textarea
  				name="recomendaciones"
  				value={formData.recomendaciones}
  				onChange={handleChange}
  				className="input-field"
  				rows={4}
  				placeholder="Recomendaciones para el seguimiento..."   			/>
  			</div>
  		  </div>
  		</div>

  		{/* Formulario Específico por Tipo de Atención */}
  		{renderFormularioEspecifico()}

  		{/* Actions */}
  		<div className="flex justify-end gap-4">
  		  <Link href="/dashboard/atenciones" className="btn-secondary">
  			Cancelar
  		  </Link>
  		  <button
  			type="submit"
  			disabled={loading}
  			className="btn-primary flex items-center gap-2 disabled:opacity-50"
  		  >
  			<Save className="w-5 h-5" />
  			{loading ? 'Guardando...' : 'Guardar Atención'}
  		  </button>
  		</div>
  	  </form>
  	  
  	  {/* Warning modal for no users */}
  	  {showNoUsersWarning && <NoUsersWarning />}
A 	</div>
  )
};