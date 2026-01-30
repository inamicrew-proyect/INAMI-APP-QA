'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Save, ArrowLeft, User, Search, Home, DollarSign, Building2, Plus, Trash2, MapPin } from 'lucide-react'
import Link from 'next/link'

interface Joven {
  id: string
  nombres: string
  apellidos: string
  expediente_administrativo?: string
  expediente_judicial?: string
  fecha_nacimiento?: string
}

interface MiembroFamiliar {
  nombre: string
  edad: string
  parentesco: string
  escolaridad: string
  estado_civil: string
  formacion: string
  ocupacion: string
}

interface DistribucionIngreso {
  parentesco: string
  cantidad: string
  frecuencia: string
  observacion: string
}

interface FormData {
  joven_id: string
  regional: string
  
  // DATOS GENERALES DE NNAJ
  nombre_nnaj: string
  edad: string
  exp_administrativo: string
  exp_judicial: string
  nombre_responsable: string
  parentesco: string
  telefono: string
  fecha_visita: string
  
  // DATOS DE IDENTIFICACION DOMICILIARIA
  departamento: string
  municipio: string
  aldea_colonia_barrio: string
  calle_avenida_sector: string
  bloque: string
  numero_casa: string
  referencias: string
  medios_transporte: string
  
  // SITUACION DE LA VIVIENDA
  tipo_tenencia: string
  tipo_vivienda: string
  distribucion_vivienda: string[]
  servicios_publicos: string[]
  material_construccion: string
  material_construccion_otro: string
  techo: string
  techo_otro: string
  pisos: string
  pisos_otro: string
  mobiliario: string[]
  mobiliario_otros: string
  observaciones_vivienda: string
  
  // SITUACIÓN ECONÓMICA FAMILIAR
  estructura_familiar: MiembroFamiliar[]
  dinamica_familiar: string
  ingreso_familiar_total: string
  distribucion_ingresos: DistribucionIngreso[]
  otros_ingresos: string
  total_egreso_familiar: string
  egresos: {
    alimentacion: string
    transporte: string
    gas_combustible: string
    educacion: string
    renta_alquiler: string
    gastos_medicos: string
    agua: string
    recreacion: string
    electricidad: string
    ropa_calzado: string
    pago_creditos: string
    fondo_ahorro: string
    telefono_celular: string
    cable_internet: string
    otros: string
  }
  
  // SITUACIÓN DE LA COMUNIDAD
  nivel_riesgo_comunidad: string[]
  instituciones_comunidad: string[]
  acceso_vivienda: string
  ambiente_comunidad: string[]
  organizaciones_base: string
  lugares_recreacion: string
  presencia_ong: string
  otros_ambiente_comunidad: string
  organizaciones_empresas_aportan: string
  rubros_empleabilidad: string
  involucramiento_familiar: string
  
  // FIRMA
  trabajador_social: string
}

export default function EstudioSocioeconomicoPage() {
  const router = useRouter()
  const [jovenes, setJovenes] = useState<Joven[]>([])
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  const [formData, setFormData] = useState<FormData>({
    joven_id: '',
    regional: '',
    nombre_nnaj: '',
    edad: '',
    exp_administrativo: '',
    exp_judicial: '',
    nombre_responsable: '',
    parentesco: '',
    telefono: '',
    fecha_visita: new Date().toISOString().split('T')[0],
    departamento: '',
    municipio: '',
    aldea_colonia_barrio: '',
    calle_avenida_sector: '',
    bloque: '',
    numero_casa: '',
    referencias: '',
    medios_transporte: '',
    tipo_tenencia: '',
    tipo_vivienda: '',
    distribucion_vivienda: [],
    servicios_publicos: [],
    material_construccion: '',
    material_construccion_otro: '',
    techo: '',
    techo_otro: '',
    pisos: '',
    pisos_otro: '',
    mobiliario: [],
    mobiliario_otros: '',
    observaciones_vivienda: '',
    estructura_familiar: [],
    dinamica_familiar: '',
    ingreso_familiar_total: '',
    distribucion_ingresos: [],
    otros_ingresos: '',
    total_egreso_familiar: '',
    egresos: {
      alimentacion: '',
      transporte: '',
      gas_combustible: '',
      educacion: '',
      renta_alquiler: '',
      gastos_medicos: '',
      agua: '',
      recreacion: '',
      electricidad: '',
      ropa_calzado: '',
      pago_creditos: '',
      fondo_ahorro: '',
      telefono_celular: '',
      cable_internet: '',
      otros: ''
    },
    nivel_riesgo_comunidad: [],
    instituciones_comunidad: [],
    acceso_vivienda: '',
    ambiente_comunidad: [],
    organizaciones_base: '',
    lugares_recreacion: '',
    presencia_ong: '',
    otros_ambiente_comunidad: '',
    organizaciones_empresas_aportan: '',
    rubros_empleabilidad: '',
    involucramiento_familiar: '',
    trabajador_social: ''
  })

  useEffect(() => {
    loadJovenes()
  }, [])

  const loadJovenes = async () => {
    try {
      const { data, error } = await supabase
        .from('jovenes')
        .select('id, nombres, apellidos, expediente_administrativo, expediente_judicial, fecha_nacimiento')
        .eq('estado', 'activo')
        .order('nombres')

      if (error) throw error
      setJovenes(data || [])
    } catch (error) {
      console.error('Error loading jovenes:', error)
      alert('Error al cargar los jóvenes')
    }
  }

  const filteredJovenes = useMemo(() => {
    if (!searchTerm.trim()) return jovenes.slice(0, 10)
    
    const term = searchTerm.toLowerCase()
    return jovenes.filter(joven => {
      const nombreCompleto = `${joven.nombres} ${joven.apellidos}`.toLowerCase()
      const expAdmin = joven.expediente_administrativo?.toLowerCase() || ''
      const expJudicial = joven.expediente_judicial?.toLowerCase() || ''
      return nombreCompleto.includes(term) || expAdmin.includes(term) || expJudicial.includes(term)
    }).slice(0, 10)
  }, [jovenes, searchTerm])

  const handleJovenSelect = (joven: Joven) => {
    // Calcular edad si hay fecha de nacimiento
    let edad = ''
    if (joven.fecha_nacimiento) {
      const birthDate = new Date(joven.fecha_nacimiento)
      const today = new Date()
      let calculatedAge = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--
      }
      edad = calculatedAge.toString()
    }

    setFormData(prev => ({
      ...prev,
      joven_id: joven.id,
      nombre_nnaj: `${joven.nombres} ${joven.apellidos}`,
      exp_administrativo: joven.expediente_administrativo || '',
      exp_judicial: joven.expediente_judicial || '',
      edad: edad
    }))
    setSearchTerm(`${joven.nombres} ${joven.apellidos}`)
    setShowDropdown(false)
  }

  const handleCheckboxChange = (field: string, value: string, checked: boolean) => {
    setFormData(prev => {
      const currentArray = prev[field as keyof FormData] as string[] || []
      if (checked) {
        return { ...prev, [field]: [...currentArray, value] }
      } else {
        return { ...prev, [field]: currentArray.filter(item => item !== value) }
      }
    })
  }

  const addMiembroFamiliar = () => {
    setFormData(prev => ({
      ...prev,
      estructura_familiar: [
        ...prev.estructura_familiar,
        { nombre: '', edad: '', parentesco: '', escolaridad: '', estado_civil: '', formacion: '', ocupacion: '' }
      ]
    }))
  }

  const removeMiembroFamiliar = (index: number) => {
    setFormData(prev => ({
      ...prev,
      estructura_familiar: prev.estructura_familiar.filter((_, i) => i !== index)
    }))
  }

  const updateMiembroFamiliar = (index: number, field: keyof MiembroFamiliar, value: string) => {
    setFormData(prev => ({
      ...prev,
      estructura_familiar: prev.estructura_familiar.map((miembro, i) =>
        i === index ? { ...miembro, [field]: value } : miembro
      )
    }))
  }

  const addDistribucionIngreso = () => {
    setFormData(prev => ({
      ...prev,
      distribucion_ingresos: [
        ...prev.distribucion_ingresos,
        { parentesco: '', cantidad: '', frecuencia: '', observacion: '' }
      ]
    }))
  }

  const removeDistribucionIngreso = (index: number) => {
    setFormData(prev => ({
      ...prev,
      distribucion_ingresos: prev.distribucion_ingresos.filter((_, i) => i !== index)
    }))
  }

  const updateDistribucionIngreso = (index: number, field: keyof DistribucionIngreso, value: string) => {
    setFormData(prev => ({
      ...prev,
      distribucion_ingresos: prev.distribucion_ingresos.map((ingreso, i) =>
        i === index ? { ...ingreso, [field]: value } : ingreso
      )
    }))
  }

  const updateEgreso = (field: keyof FormData['egresos'], value: string) => {
    setFormData(prev => ({
      ...prev,
      egresos: {
        ...prev.egresos,
        [field]: value
      }
    }))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.joven_id) {
      newErrors.joven_id = 'Debe seleccionar un joven'
    }

    if (!formData.trabajador_social.trim()) {
      newErrors.trabajador_social = 'El nombre del trabajador social es requerido'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      setSaving(true)

      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('No se pudo obtener el usuario actual. Por favor, inicia sesión nuevamente.')
      }

      const { data: tipoAtencion } = await supabase
        .from('tipos_atencion')
        .select('id')
        .eq('profesional_responsable', 'trabajador_social')
        .limit(1)
        .maybeSingle()

      let tipoAtencionId = tipoAtencion?.id
      
      if (!tipoAtencionId) {
        const { data: anyTipo } = await supabase
          .from('tipos_atencion')
          .select('id')
          .limit(1)
          .maybeSingle()
        
        tipoAtencionId = anyTipo?.id
      }

      if (!tipoAtencionId) {
        throw new Error('No se encontró ningún tipo de atención en la base de datos.')
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!profile) {
        throw new Error('Tu usuario no tiene un perfil configurado.')
      }

      // Crear la atención
      const fechaAtencion = formData.fecha_visita || new Date().toISOString().split('T')[0]
      
      const { data: nuevaAtencion, error: atencionError } = await supabase
        .from('atenciones')
        .insert({
          joven_id: formData.joven_id,
          tipo_atencion_id: tipoAtencionId,
          profesional_id: user.id,
          motivo: 'Estudio Socioeconómico',
          fecha_atencion: fechaAtencion,
          estado: 'completada'
        })
        .select()
        .single()

      if (atencionError) {
        console.error('Error al crear la atención:', atencionError)
        throw new Error(`Error al crear la atención: ${atencionError.message}`)
      }

      const atencionId = nuevaAtencion.id

      // Preparar datos para guardar
      const datosJson = {
        ...formData
      }

      // Guardar en formularios_atencion
      const { error: insertError } = await supabase
        .from('formularios_atencion')
        .insert({
          tipo_formulario: 'estudio_socioeconomico',
          joven_id: formData.joven_id,
          atencion_id: atencionId,
          datos_json: datosJson,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (insertError) {
        console.error('Error al guardar el formulario:', insertError)
        throw new Error(`Error al guardar el formulario: ${insertError.message}`)
      }

      alert('Estudio socioeconómico guardado exitosamente')
      router.push('/dashboard/atenciones')
    } catch (error: any) {
      console.error('Error saving form:', error)
      const errorMessage = error?.message || error?.error?.message || 'Error al guardar el formulario'
      alert(`Error: ${errorMessage}`)
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/atenciones/formularios"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Estudio Socioeconómico</h1>
                <p className="text-sm text-gray-500 mt-1">PMSPL - Área de Trabajo Social</p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* DATOS GENERALES DE NNAJ */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="h-5 w-5" />
              DATOS GENERALES DE NNAJ
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del NNAJ <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value)
                      setShowDropdown(true)
                    }}
                    onFocus={() => setShowDropdown(true)}
                    placeholder="Buscar por nombre o expediente..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {showDropdown && filteredJovenes.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                      {filteredJovenes.map((joven) => (
                        <div
                          key={joven.id}
                          onClick={() => handleJovenSelect(joven)}
                          className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium text-gray-900">
                            {joven.nombres} {joven.apellidos}
                          </div>
                          {joven.expediente_administrativo && (
                            <div className="text-sm text-gray-500">
                              Exp. Admin: {joven.expediente_administrativo}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {errors.joven_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.joven_id}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Edad</label>
                <input
                  type="text"
                  value={formData.edad}
                  onChange={(e) => setFormData(prev => ({ ...prev, edad: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">No. Expediente Administrativo</label>
                <input
                  type="text"
                  value={formData.exp_administrativo}
                  onChange={(e) => setFormData(prev => ({ ...prev, exp_administrativo: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">No. Expediente Judicial</label>
                <input
                  type="text"
                  value={formData.exp_judicial}
                  onChange={(e) => setFormData(prev => ({ ...prev, exp_judicial: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del responsable</label>
                <input
                  type="text"
                  value={formData.nombre_responsable}
                  onChange={(e) => setFormData(prev => ({ ...prev, nombre_responsable: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Parentesco</label>
                <input
                  type="text"
                  value={formData.parentesco}
                  onChange={(e) => setFormData(prev => ({ ...prev, parentesco: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
                <input
                  type="text"
                  value={formData.telefono}
                  onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Regional</label>
                <input
                  type="text"
                  value={formData.regional}
                  onChange={(e) => setFormData(prev => ({ ...prev, regional: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de la Visita</label>
                <input
                  type="date"
                  value={formData.fecha_visita}
                  onChange={(e) => setFormData(prev => ({ ...prev, fecha_visita: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* DATOS DE IDENTIFICACION DOMICILIARIA */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              DATOS DE IDENTIFICACION DOMICILIARIA
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Departamento</label>
                <input
                  type="text"
                  value={formData.departamento}
                  onChange={(e) => setFormData(prev => ({ ...prev, departamento: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Municipio</label>
                <input
                  type="text"
                  value={formData.municipio}
                  onChange={(e) => setFormData(prev => ({ ...prev, municipio: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Aldea, colonia o barrio</label>
                <input
                  type="text"
                  value={formData.aldea_colonia_barrio}
                  onChange={(e) => setFormData(prev => ({ ...prev, aldea_colonia_barrio: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Calle, avenida o sector</label>
                <input
                  type="text"
                  value={formData.calle_avenida_sector}
                  onChange={(e) => setFormData(prev => ({ ...prev, calle_avenida_sector: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bloque</label>
                <input
                  type="text"
                  value={formData.bloque}
                  onChange={(e) => setFormData(prev => ({ ...prev, bloque: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">No. De Casa</label>
                <input
                  type="text"
                  value={formData.numero_casa}
                  onChange={(e) => setFormData(prev => ({ ...prev, numero_casa: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Referencias</label>
                <textarea
                  value={formData.referencias}
                  onChange={(e) => setFormData(prev => ({ ...prev, referencias: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Medios de transporte para ingreso</label>
                <textarea
                  value={formData.medios_transporte}
                  onChange={(e) => setFormData(prev => ({ ...prev, medios_transporte: e.target.value }))}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* SITUACION DE LA VIVIENDA */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Home className="h-5 w-5" />
              SITUACION DE LA VIVIENDA
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de tenencia</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {['Propia', 'Alquilada', 'Prestada', 'Familiar', 'Invadida', 'Otro'].map((opcion) => (
                    <label key={opcion} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="tipo_tenencia"
                        value={opcion}
                        checked={formData.tipo_tenencia === opcion}
                        onChange={(e) => setFormData(prev => ({ ...prev, tipo_tenencia: e.target.value }))}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{opcion}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de vivienda</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {['Casa sola', 'Apartamento', 'Cuartería', 'Campamento', 'Albergue', 'Otro'].map((opcion) => (
                    <label key={opcion} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="tipo_vivienda"
                        value={opcion}
                        checked={formData.tipo_vivienda === opcion}
                        onChange={(e) => setFormData(prev => ({ ...prev, tipo_vivienda: e.target.value }))}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{opcion}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Distribución de la vivienda</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {['Dormitorios', 'Sala', 'Comedor', 'Cocina', 'Baño privado', 'Baño colectivo'].map((opcion) => (
                    <label key={opcion} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.distribucion_vivienda.includes(opcion)}
                        onChange={(e) => handleCheckboxChange('distribucion_vivienda', opcion, e.target.checked)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{opcion}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Servicios Públicos</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['Agua', 'Energía Eléctrica', 'Alcantarillado', 'Teléfono fijo', 'Cable', 'Internet', 'Datos', 'Wifi'].map((opcion) => (
                    <label key={opcion} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.servicios_publicos.includes(opcion)}
                        onChange={(e) => handleCheckboxChange('servicios_publicos', opcion, e.target.checked)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{opcion}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Material de construcción</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {['Bloque', 'Ladrillo', 'Madera', 'Cartón', 'Otros'].map((opcion) => (
                    <label key={opcion} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="material_construccion"
                        value={opcion}
                        checked={formData.material_construccion === opcion}
                        onChange={(e) => setFormData(prev => ({ ...prev, material_construccion: e.target.value }))}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{opcion}</span>
                    </label>
                  ))}
                </div>
                {formData.material_construccion === 'Otros' && (
                  <input
                    type="text"
                    value={formData.material_construccion_otro}
                    onChange={(e) => setFormData(prev => ({ ...prev, material_construccion_otro: e.target.value }))}
                    placeholder="Especificar..."
                    className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Techo</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {['Concreto', 'Lamina de zinc', 'Lamina de aluzinc', 'Lámina de asbesto', 'Lámina de cartón', 'Otros'].map((opcion) => (
                    <label key={opcion} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="techo"
                        value={opcion}
                        checked={formData.techo === opcion}
                        onChange={(e) => setFormData(prev => ({ ...prev, techo: e.target.value }))}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{opcion}</span>
                    </label>
                  ))}
                </div>
                {formData.techo === 'Otros' && (
                  <input
                    type="text"
                    value={formData.techo_otro}
                    onChange={(e) => setFormData(prev => ({ ...prev, techo_otro: e.target.value }))}
                    placeholder="Especificar..."
                    className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pisos</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {['Mosaico', 'Cerámica', 'Plancha de cemento', 'Tierra apisonada', 'Madera', 'Otros'].map((opcion) => (
                    <label key={opcion} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="pisos"
                        value={opcion}
                        checked={formData.pisos === opcion}
                        onChange={(e) => setFormData(prev => ({ ...prev, pisos: e.target.value }))}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{opcion}</span>
                    </label>
                  ))}
                </div>
                {formData.pisos === 'Otros' && (
                  <input
                    type="text"
                    value={formData.pisos_otro}
                    onChange={(e) => setFormData(prev => ({ ...prev, pisos_otro: e.target.value }))}
                    placeholder="Especificar..."
                    className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mobiliario</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['Televisión', 'Estéreo', 'Computadora', 'Plancha', 'Estufa (Especifique)', 'Microondas', 'Lavadora', 'Refrigerador', 'Camas', 'Comedor', 'Silla', 'Sofás', 'Armario', 'Mesas', 'Otros'].map((opcion) => (
                    <label key={opcion} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.mobiliario.includes(opcion)}
                        onChange={(e) => handleCheckboxChange('mobiliario', opcion, e.target.checked)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{opcion}</span>
                    </label>
                  ))}
                </div>
                {formData.mobiliario.includes('Otros') && (
                  <input
                    type="text"
                    value={formData.mobiliario_otros}
                    onChange={(e) => setFormData(prev => ({ ...prev, mobiliario_otros: e.target.value }))}
                    placeholder="Especificar otros muebles..."
                    className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Observaciones</label>
                <textarea
                  value={formData.observaciones_vivienda}
                  onChange={(e) => setFormData(prev => ({ ...prev, observaciones_vivienda: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* SITUACIÓN ECONÓMICA FAMILIAR */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              SITUACIÓN ECONÓMICA FAMILIAR
            </h2>
            
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Estructura Familiar (Personas con las que convive actualmente)
                  </label>
                  <button
                    type="button"
                    onClick={addMiembroFamiliar}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Agregar Miembro
                  </button>
                </div>
                
                {formData.estructura_familiar.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">N°</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">Nombre</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">Edad</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">Parentesco</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">Escolaridad</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">Estado civil</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">Formación</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">Ocupación</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {formData.estructura_familiar.map((miembro, index) => (
                          <tr key={index}>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={miembro.nombre}
                                onChange={(e) => updateMiembroFamiliar(index, 'nombre', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={miembro.edad}
                                onChange={(e) => updateMiembroFamiliar(index, 'edad', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={miembro.parentesco}
                                onChange={(e) => updateMiembroFamiliar(index, 'parentesco', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={miembro.escolaridad}
                                onChange={(e) => updateMiembroFamiliar(index, 'escolaridad', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={miembro.estado_civil}
                                onChange={(e) => updateMiembroFamiliar(index, 'estado_civil', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={miembro.formacion}
                                onChange={(e) => updateMiembroFamiliar(index, 'formacion', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={miembro.ocupacion}
                                onChange={(e) => updateMiembroFamiliar(index, 'ocupacion', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <button
                                type="button"
                                onClick={() => removeMiembroFamiliar(index)}
                                className="p-1 text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dinámica Familiar - Organización y funcionamiento</label>
                <textarea
                  value={formData.dinamica_familiar}
                  onChange={(e) => setFormData(prev => ({ ...prev, dinamica_familiar: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ingreso familiar total</label>
                  <input
                    type="text"
                    value={formData.ingreso_familiar_total}
                    onChange={(e) => setFormData(prev => ({ ...prev, ingreso_familiar_total: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Otros Ingresos (Especifique)</label>
                  <input
                    type="text"
                    value={formData.otros_ingresos}
                    onChange={(e) => setFormData(prev => ({ ...prev, otros_ingresos: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Distribución de ingresos
                  </label>
                  <button
                    type="button"
                    onClick={addDistribucionIngreso}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Agregar
                  </button>
                </div>
                
                {formData.distribucion_ingresos.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">Parentesco</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">Cantidad</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">Frecuencia</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">Observación</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {formData.distribucion_ingresos.map((ingreso, index) => (
                          <tr key={index}>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={ingreso.parentesco}
                                onChange={(e) => updateDistribucionIngreso(index, 'parentesco', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={ingreso.cantidad}
                                onChange={(e) => updateDistribucionIngreso(index, 'cantidad', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={ingreso.frecuencia}
                                onChange={(e) => updateDistribucionIngreso(index, 'frecuencia', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={ingreso.observacion}
                                onChange={(e) => updateDistribucionIngreso(index, 'observacion', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <button
                                type="button"
                                onClick={() => removeDistribucionIngreso(index)}
                                className="p-1 text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Total, Egreso Familiar Mensual</label>
                <input
                  type="text"
                  value={formData.total_egreso_familiar}
                  onChange={(e) => setFormData(prev => ({ ...prev, total_egreso_familiar: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">Egresos Mensuales Familiares</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Alimentación</label>
                    <input
                      type="text"
                      value={formData.egresos.alimentacion}
                      onChange={(e) => updateEgreso('alimentacion', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Transporte</label>
                    <input
                      type="text"
                      value={formData.egresos.transporte}
                      onChange={(e) => updateEgreso('transporte', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Gas o combustible</label>
                    <input
                      type="text"
                      value={formData.egresos.gas_combustible}
                      onChange={(e) => updateEgreso('gas_combustible', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Educación</label>
                    <input
                      type="text"
                      value={formData.egresos.educacion}
                      onChange={(e) => updateEgreso('educacion', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Renta o alquiler</label>
                    <input
                      type="text"
                      value={formData.egresos.renta_alquiler}
                      onChange={(e) => updateEgreso('renta_alquiler', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Gastos médicos</label>
                    <input
                      type="text"
                      value={formData.egresos.gastos_medicos}
                      onChange={(e) => updateEgreso('gastos_medicos', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Agua</label>
                    <input
                      type="text"
                      value={formData.egresos.agua}
                      onChange={(e) => updateEgreso('agua', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Recreación</label>
                    <input
                      type="text"
                      value={formData.egresos.recreacion}
                      onChange={(e) => updateEgreso('recreacion', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Electricidad</label>
                    <input
                      type="text"
                      value={formData.egresos.electricidad}
                      onChange={(e) => updateEgreso('electricidad', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Ropa y Calzado</label>
                    <input
                      type="text"
                      value={formData.egresos.ropa_calzado}
                      onChange={(e) => updateEgreso('ropa_calzado', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Pago Créditos</label>
                    <input
                      type="text"
                      value={formData.egresos.pago_creditos}
                      onChange={(e) => updateEgreso('pago_creditos', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Fondo de ahorro</label>
                    <input
                      type="text"
                      value={formData.egresos.fondo_ahorro}
                      onChange={(e) => updateEgreso('fondo_ahorro', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Teléfono/Celular</label>
                    <input
                      type="text"
                      value={formData.egresos.telefono_celular}
                      onChange={(e) => updateEgreso('telefono_celular', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Cable/Internet</label>
                    <input
                      type="text"
                      value={formData.egresos.cable_internet}
                      onChange={(e) => updateEgreso('cable_internet', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Otros</label>
                    <input
                      type="text"
                      value={formData.egresos.otros}
                      onChange={(e) => updateEgreso('otros', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SITUACIÓN DE LA COMUNIDAD */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              SITUACIÓN DE LA COMUNIDAD
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nivel de riesgo en la comunidad</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['Grupos ilícitos', 'Venta de drogas', 'Expendios de bebidas alcohólicas'].map((opcion) => (
                    <label key={opcion} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.nivel_riesgo_comunidad.includes(opcion)}
                        onChange={(e) => handleCheckboxChange('nivel_riesgo_comunidad', opcion, e.target.checked)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{opcion}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Instituciones existentes en la comunidad</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['kínder', 'Centros de salud', 'escuelas', 'Postas policiales', 'colegios', 'Iglesias', 'Centro de Formación'].map((opcion) => (
                    <label key={opcion} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.instituciones_comunidad.includes(opcion)}
                        onChange={(e) => handleCheckboxChange('instituciones_comunidad', opcion, e.target.checked)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{opcion}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Acceso a la vivienda</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="acceso_vivienda"
                      value="Accesible"
                      checked={formData.acceso_vivienda === 'Accesible'}
                      onChange={(e) => setFormData(prev => ({ ...prev, acceso_vivienda: e.target.value }))}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Accesible</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="acceso_vivienda"
                      value="Inaccesible"
                      checked={formData.acceso_vivienda === 'Inaccesible'}
                      onChange={(e) => setFormData(prev => ({ ...prev, acceso_vivienda: e.target.value }))}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Inaccesible</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ambiente en la comunidad</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['Grafitis', 'Organizaciones de base', 'Lugares de recreación', 'Presencia de ONG'].map((opcion) => (
                    <label key={opcion} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.ambiente_comunidad.includes(opcion)}
                        onChange={(e) => handleCheckboxChange('ambiente_comunidad', opcion, e.target.checked)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{opcion}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Organizaciones de base</label>
                <input
                  type="text"
                  value={formData.organizaciones_base}
                  onChange={(e) => setFormData(prev => ({ ...prev, organizaciones_base: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Lugares de recreación</label>
                <input
                  type="text"
                  value={formData.lugares_recreacion}
                  onChange={(e) => setFormData(prev => ({ ...prev, lugares_recreacion: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Presencia de ONG (Especifique)</label>
                <input
                  type="text"
                  value={formData.presencia_ong}
                  onChange={(e) => setFormData(prev => ({ ...prev, presencia_ong: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Otros</label>
                <input
                  type="text"
                  value={formData.otros_ambiente_comunidad}
                  onChange={(e) => setFormData(prev => ({ ...prev, otros_ambiente_comunidad: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organizaciones o empresas que aportan en el sector económico de la comunidad
                </label>
                <textarea
                  value={formData.organizaciones_empresas_aportan}
                  onChange={(e) => setFormData(prev => ({ ...prev, organizaciones_empresas_aportan: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Identificación de Rubros (económicos) con mayor empleabilidad en la zona
                </label>
                <textarea
                  value={formData.rubros_empleabilidad}
                  onChange={(e) => setFormData(prev => ({ ...prev, rubros_empleabilidad: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Involucramiento familiar en organizaciones de base comunitaria, espacios y otros (Detalle)
                </label>
                <textarea
                  value={formData.involucramiento_familiar}
                  onChange={(e) => setFormData(prev => ({ ...prev, involucramiento_familiar: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* FIRMA */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre, Firma y sello Trabajador/a Social <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.trabajador_social}
                onChange={(e) => setFormData(prev => ({ ...prev, trabajador_social: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              {errors.trabajador_social && (
                <p className="mt-1 text-sm text-red-600">{errors.trabajador_social}</p>
              )}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center justify-end gap-4 bg-white rounded-lg shadow-sm p-6">
            <Link
              href="/dashboard/atenciones/formularios"
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="h-5 w-5" />
              {saving ? 'Guardando...' : 'Guardar Formulario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
