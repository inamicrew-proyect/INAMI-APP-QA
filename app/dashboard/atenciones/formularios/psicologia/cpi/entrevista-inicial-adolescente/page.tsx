'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import JovenSearchInput from '@/components/JovenSearchInput'

interface NucleoConvivencia {
  nombre: string
  parentesco: string
  edad: string
  estado_civil: string
  ocupacion: string
  observaciones: string
}

interface ConsumoAdiccion {
  sustancia: string
  diario: string
  semanal: string
  mensual: string
  edad_inicio: string
}

export default function EntrevistaInicialAdolescenteCPIPage() {
  const router = useRouter()
  const params = useParams()
  const jovenId = params.jovenId as string

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const [nucleoConvivencia, setNucleoConvivencia] = useState<NucleoConvivencia[]>([
    { nombre: '', parentesco: '', edad: '', estado_civil: '', ocupacion: '', observaciones: '' },
    { nombre: '', parentesco: '', edad: '', estado_civil: '', ocupacion: '', observaciones: '' },
    { nombre: '', parentesco: '', edad: '', estado_civil: '', ocupacion: '', observaciones: '' },
    { nombre: '', parentesco: '', edad: '', estado_civil: '', ocupacion: '', observaciones: '' }
  ])

  const [consumoAdicciones, setConsumoAdicciones] = useState<ConsumoAdiccion[]>([
    { sustancia: 'Cerveza', diario: '', semanal: '', mensual: '', edad_inicio: '' },
    { sustancia: 'Alcohol', diario: '', semanal: '', mensual: '', edad_inicio: '' },
    { sustancia: 'Tabaco', diario: '', semanal: '', mensual: '', edad_inicio: '' },
    { sustancia: 'Marihuana', diario: '', semanal: '', mensual: '', edad_inicio: '' },
    { sustancia: 'Cocaína', diario: '', semanal: '', mensual: '', edad_inicio: '' },
    { sustancia: 'Crack', diario: '', semanal: '', mensual: '', edad_inicio: '' },
    { sustancia: 'Heroína', diario: '', semanal: '', mensual: '', edad_inicio: '' },
    { sustancia: 'Resistol', diario: '', semanal: '', mensual: '', edad_inicio: '' },
    { sustancia: 'Pastillas', diario: '', semanal: '', mensual: '', edad_inicio: '' },
    { sustancia: '(Especificar)', diario: '', semanal: '', mensual: '', edad_inicio: '' },
    { sustancia: 'Otros', diario: '', semanal: '', mensual: '', edad_inicio: '' }
  ])

  const [formData, setFormData] = useState({
    // Header Section
    nombre_cpi: '',
    direccion_cpi: '',
    psicologo_entrevista: '',
    fecha_entrevista: '',
    
    // I. Datos Identificativos Personales, Judiciales y Familiares
    nombre_apellidos: '',
    numero_partida_nacimiento: '',
    lugar_fecha_nacimiento: '',
    edad: '',
    genero: '',
    estado_civil: '',
    direccion: '',
    fecha_ingreso_reingreso_cpi: '',
    juzgado_juez_remitente: '',
    numero_expediente_judicial: '',
    numero_expediente_administrativo: '',
    motivo_ingreso_reingreso: '',
    medida_judicial_impuesta: '',
    familiares_adultos_referencia: '',
    direcciones_referencia: '',
    telefonos_referencia: '',
    otros_familiares_significativos: '',
    
    // II. Antecedentes y Estado Clínico Actual
    padece_enfermedad_tratamiento: '',
    familia_enfermedad_tratamiento: '',
    consumo_drogas_familia: '',
    
    // III. Ámbito Educativo y/o Formativo-Laboral
    nivel_educativo_formativo: '',
    desempeno_escolar_academico: '',
    ha_reprobado_grados: '',
    ha_habido_desercion_escolar: '',
    problemas_escuela_colegio: '',
    ocupacion_oficio: '',
    le_gusta_estudiar_trabajar: '',
    tiene_metas_academicas_laborales: '',
    
    // IV. Historia Familiar
    describa_familia: '',
    
    // V. Características Personales, Gustos, Intereses y Metas de Vida
    como_era_caracter_nino: '',
    como_describe_caracter_actualmente: '',
    aspectos_positivos_habilidades: '',
    cosas_alegre_feliz: '',
    cosas_triste: '',
    cosas_molestan_enojan: '',
    cree_tener_defectos: '',
    le_gustaria_mejorar_cambiar: '',
    tiene_pasatiempo_aficion: '',
    metas_alcanzar_vida: '',
    
    // VI. Desarrollo y Relaciones Afectivo-Sexuales
    como_se_describe_personalmente: '',
    ha_tenido_tiene_pareja: '',
    ha_tenido_relaciones_sexuales: '',
    
    // VII. Problemas y Preocupaciones Actuales
    tiene_problema_preocupacion_actual: '',
    cuenta_personas_ayuden_apoyen: '',
    
    // VII. Relaciones Sociales
    de_nino_tenia_amigos: '',
    actualmente_tiene_amigos: '',
    donde_se_relaciona_amigos: '',
    describa_relaciones_amistad: '',
    que_piensan_padres_relaciones_amistad: '',
    le_gustaria_cambiar_relaciones_amistad: '',
    tiene_interes_conocer_gente_nueva: '',
    tiene_amigos_dentro_cpi: '',
    ha_tenido_dificultad_trato_cpi: '',
    
    // IX. Entorno Comunitario
    le_gusta_barrio_colonia: '',
    
    // X. Trayectoria de Vida
    eventos_positivos: '',
    eventos_negativos: '',
    
    // XI. Antecedentes y Situación Jurídica Actual
    vivencia_emocional_infraccion: '',
    otros_familiares_problemas_justicia: '',
    como_ocurrieron_hechos: '',
    que_causo_influido_conducta_infractora: '',
    cree_podria_haber_ocurrido_algo: '',
    como_reaccionaron_personas_cercanas: '',
    que_piensa_siente_ahora: '',
    considera_puede_aportar_medida_judicial: '',
    
    // XII. Observaciones
    observaciones: '',
    
    // XIII. Conclusiones
    conclusiones: '',
    
    // Firma
    nombre_firma_psicologo: '',
    colegiacion: ''
  })

  useEffect(() => {
    if (jovenId) {
      loadJovenData()
    }
  }, [jovenId])

  const loadJovenData = async () => {
    try {
      setLoading(true)
      const { data: jovenData, error } = await supabase
        .from('jovenes')
        .select(`
          *,
          centros!inner(nombre)
        `)
        .eq('id', jovenId)
        .single()

      if (error) throw error

      if (jovenData) {
        setFormData(prev => ({
          ...prev,
          nombre_apellidos: `${jovenData.nombres} ${jovenData.apellidos}`,
          fecha_entrevista: new Date().toISOString().slice(0, 10),
          edad: jovenData.edad?.toString() || '',
          lugar_fecha_nacimiento: jovenData.fecha_nacimiento 
            ? `${jovenData.lugar_nacimiento || ''}, ${new Date(jovenData.fecha_nacimiento).toLocaleDateString('es-HN')}`
            : '',
          direccion: jovenData.direccion || '',
          fecha_ingreso_reingreso_cpi: jovenData.fecha_ingreso || '',
          numero_expediente_judicial: jovenData.numero_expediente_judicial || ''
        }))
      }
    } catch (error) {
      console.error('Error loading joven:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleNucleoChange = (index: number, field: keyof NucleoConvivencia, value: string) => {
    const updated = [...nucleoConvivencia]
    updated[index] = { ...updated[index], [field]: value }
    setNucleoConvivencia(updated)
  }

  const handleConsumoChange = (index: number, field: keyof ConsumoAdiccion, value: string) => {
    const updated = [...consumoAdicciones]
    updated[index] = { ...updated[index], [field]: value }
    setConsumoAdicciones(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      const { error } = await supabase
        .from('formularios_psicologicos')
        .insert([{
          joven_id: jovenId,
          tipo_formulario: 'entrevista_inicial_adolescente_cpi',
          datos_json: {
            ...formData,
            nucleo_convivencia: nucleoConvivencia,
            consumo_adicciones: consumoAdicciones
          },
          fecha_creacion: new Date().toISOString()
        }])
      if (error) throw error
      alert('Formulario guardado exitosamente')
      router.push(`/dashboard/jovenes/${jovenId}/expediente`)
    } catch (error) {
      console.error('Error saving form:', error)
      alert('Error al guardar el formulario')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="btn-secondary p-2"
            title="Volver"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="text-center flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              ENTREVISTA PSICOLÓGICA INICIAL: ADOLESCENTES/JÓVENES
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              CENTRO PEDAGÓGICO DE INTERNAMIENTO (CPI)
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Header Section */}
          <div className="card">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre del CPI
                </label>
                <input
                  type="text"
                  name="nombre_cpi"
                  value={formData.nombre_cpi}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Dirección del CPI
                </label>
                <input
                  type="text"
                  name="direccion_cpi"
                  value={formData.direccion_cpi}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Psicólogo/a que realiza la Entrevista *
                </label>
                <input
                  type="text"
                  name="psicologo_entrevista"
                  value={formData.psicologo_entrevista}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha de la Entrevista *
                </label>
                <input
                  type="date"
                  name="fecha_entrevista"
                  value={formData.fecha_entrevista}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>
            </div>
          </div>

          {/* I. Datos Identificativos Personales, Judiciales y Familiares */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 -mx-4 -mt-4 rounded-t-lg">
              I. Datos Identificativos Personales, Judiciales y Familiares
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <JovenSearchInput
                  value={formData.nombre_apellidos}
                  onChange={(value) => setFormData(prev => ({ ...prev, nombre_apellidos: value }))}
                  onJovenSelect={(joven) => {
                    if (joven.id) {
                      setFormData(prev => ({
                        ...prev,
                        nombre_apellidos: `${joven.nombres} ${joven.apellidos}`,
                        edad: joven.edad?.toString() || prev.edad
                      }))
                    }
                  }}
                  label="Nombre y apellidos"
                  required
                  placeholder="Buscar joven por nombre..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  N.º Partida de Nacimiento
                </label>
                <input
                  type="text"
                  name="numero_partida_nacimiento"
                  value={formData.numero_partida_nacimiento}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Lugar y fecha de nacimiento
                </label>
                <input
                  type="text"
                  name="lugar_fecha_nacimiento"
                  value={formData.lugar_fecha_nacimiento}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Ej: Tegucigalpa, 15/03/2005"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Edad
                </label>
                <input
                  type="number"
                  name="edad"
                  value={formData.edad}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Género
                </label>
                <select
                  name="genero"
                  value={formData.genero}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">Seleccione...</option>
                  <option value="masculino">Masculino</option>
                  <option value="femenino">Femenino</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Estado Civil
                </label>
                <select
                  name="estado_civil"
                  value={formData.estado_civil}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">Seleccione...</option>
                  <option value="soltero">Soltero/a</option>
                  <option value="casado">Casado/a</option>
                  <option value="union_libre">Unión Libre</option>
                  <option value="divorciado">Divorciado/a</option>
                  <option value="viudo">Viudo/a</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Dirección
                </label>
                <input
                  type="text"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha del Ingreso/Reingreso en el CPI
                </label>
                <input
                  type="date"
                  name="fecha_ingreso_reingreso_cpi"
                  value={formData.fecha_ingreso_reingreso_cpi}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Juzgado y/o Juez Remitente
                </label>
                <input
                  type="text"
                  name="juzgado_juez_remitente"
                  value={formData.juzgado_juez_remitente}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nº de Expediente
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                      JUDICIAL
                    </label>
                    <input
                      type="text"
                      name="numero_expediente_judicial"
                      value={formData.numero_expediente_judicial}
                      onChange={handleChange}
                      className="input-field text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                      ADMINISTRATIVO
                    </label>
                    <input
                      type="text"
                      name="numero_expediente_administrativo"
                      value={formData.numero_expediente_administrativo}
                      onChange={handleChange}
                      className="input-field text-sm"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Motivo del ingreso /reingreso
                </label>
                <input
                  type="text"
                  name="motivo_ingreso_reingreso"
                  value={formData.motivo_ingreso_reingreso}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Medida Judicial Impuesta
                </label>
                <input
                  type="text"
                  name="medida_judicial_impuesta"
                  value={formData.medida_judicial_impuesta}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Familiar/es o Adultos/as de Referencia a su cargo
                </label>
                <input
                  type="text"
                  name="familiares_adultos_referencia"
                  value={formData.familiares_adultos_referencia}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Dirección/es
                </label>
                <input
                  type="text"
                  name="direcciones_referencia"
                  value={formData.direcciones_referencia}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Teléfono/s
                </label>
                <input
                  type="text"
                  name="telefonos_referencia"
                  value={formData.telefonos_referencia}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* Núcleo de convivencia */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Núcleo de convivencia (anterior al ingreso en el CPI)
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      NOMBRE
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      PARENTESCO
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      EDAD
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      ESTADO CIVIL
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      OCUPACIÓN
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      OBSERVACIONES
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {nucleoConvivencia.map((persona, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={persona.nombre}
                          onChange={(e) => handleNucleoChange(index, 'nombre', e.target.value)}
                          className="input-field text-sm"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={persona.parentesco}
                          onChange={(e) => handleNucleoChange(index, 'parentesco', e.target.value)}
                          className="input-field text-sm"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={persona.edad}
                          onChange={(e) => handleNucleoChange(index, 'edad', e.target.value)}
                          className="input-field text-sm"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={persona.estado_civil}
                          onChange={(e) => handleNucleoChange(index, 'estado_civil', e.target.value)}
                          className="input-field text-sm"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={persona.ocupacion}
                          onChange={(e) => handleNucleoChange(index, 'ocupacion', e.target.value)}
                          className="input-field text-sm"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={persona.observaciones}
                          onChange={(e) => handleNucleoChange(index, 'observaciones', e.target.value)}
                          className="input-field text-sm"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Otros Familiares Significativos */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Otros Familiares Significativos y tipo de relación
            </h3>
            <textarea
              name="otros_familiares_significativos"
              value={formData.otros_familiares_significativos}
              onChange={handleChange}
              className="input-field"
              rows={6}
              placeholder="Describa otros familiares significativos y el tipo de relación..."
            />
          </div>

          {/* II. Antecedentes y Estado Clínico Actual */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 -mx-4 -mt-4 rounded-t-lg">
              II. Antecedentes y Estado Clínico Actual
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Padece o ha padecido de alguna enfermedad física, mental, problemas emocionales, del estado de ánimo o del comportamiento? ¿O ha tenido algún otro tipo de problema médico o de salud? ¿Ha recibido o recibe algún tipo de tratamiento médico (farmacológico), psicológico o psiquiátrico por ello? (en caso de ser así, describa brevemente):
                </label>
                <textarea
                  name="padece_enfermedad_tratamiento"
                  value={formData.padece_enfermedad_tratamiento}
                  onChange={handleChange}
                  className="input-field"
                  rows={6}
                  placeholder="Describa las enfermedades y tratamientos..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Algún miembro de su familia ha padecido o padece de alguna enfermedad física, mental, problemas emocionales, del estado de ánimo o del comportamiento? De ser así, indique cual/es y si recibe o ha recibido algún tipo de tratamiento por ello.
                </label>
                <textarea
                  name="familia_enfermedad_tratamiento"
                  value={formData.familia_enfermedad_tratamiento}
                  onChange={handleChange}
                  className="input-field"
                  rows={6}
                  placeholder="Describa las enfermedades familiares..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Usted o algún miembro de su familia consume o ha consumido algún tipo de sustancia tóxica o drogas?, ¿Reciben/recibe o ha/han recibido algún tipo de ayuda o tratamiento médico (farmacológico), psicológico o psiquiátrico por ello? ¿De qué tipo?, le/les ha sido de ayuda.
                </label>
                <textarea
                  name="consumo_drogas_familia"
                  value={formData.consumo_drogas_familia}
                  onChange={handleChange}
                  className="input-field"
                  rows={6}
                  placeholder="Describa el consumo de drogas..."
                />
              </div>
            </div>
          </div>

          {/* Cuadro de Consumos/Adicciones Personales */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Cuadro de Consumos/Adicciones Personales
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Sustancia
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Diario
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Semanal
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Mensual
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Edad de inicio
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {consumoAdicciones.map((consumo, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={consumo.sustancia}
                          onChange={(e) => handleConsumoChange(index, 'sustancia', e.target.value)}
                          className="input-field text-sm"
                          readOnly={index < 10}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={consumo.diario}
                          onChange={(e) => handleConsumoChange(index, 'diario', e.target.value)}
                          className="input-field text-sm"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={consumo.semanal}
                          onChange={(e) => handleConsumoChange(index, 'semanal', e.target.value)}
                          className="input-field text-sm"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={consumo.mensual}
                          onChange={(e) => handleConsumoChange(index, 'mensual', e.target.value)}
                          className="input-field text-sm"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={consumo.edad_inicio}
                          onChange={(e) => handleConsumoChange(index, 'edad_inicio', e.target.value)}
                          className="input-field text-sm"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* III. Ámbito Educativo y/o Formativo-Laboral */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 -mx-4 -mt-4 rounded-t-lg">
              III. Ámbito Educativo y/o Formativo-Laboral
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nivel educativo o formativo (analfabetismo, último curso escolar aprobado o que se encuentra cursando y en qué Institución):
                </label>
                <textarea
                  name="nivel_educativo_formativo"
                  value={formData.nivel_educativo_formativo}
                  onChange={handleChange}
                  className="input-field"
                  rows={5}
                  placeholder="Describa el nivel educativo..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Cómo es/era su desempeño escolar o académico?
                </label>
                <textarea
                  name="desempeno_escolar_academico"
                  value={formData.desempeno_escolar_academico}
                  onChange={handleChange}
                  className="input-field"
                  rows={5}
                  placeholder="Describa el desempeño escolar..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Ha reprobado grados o cursos escolares?, (motivos)
                </label>
                <textarea
                  name="ha_reprobado_grados"
                  value={formData.ha_reprobado_grados}
                  onChange={handleChange}
                  className="input-field"
                  rows={5}
                  placeholder="Describa si ha reprobado y los motivos..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Ha habido deserción escolar?
                </label>
                <textarea
                  name="ha_habido_desercion_escolar"
                  value={formData.ha_habido_desercion_escolar}
                  onChange={handleChange}
                  className="input-field"
                  rows={3}
                  placeholder="Describa si ha habido deserción escolar..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Ha presentado o experimentado algún tipo de problemas en la escuela o colegio? ¿De qué tipo?
                </label>
                <textarea
                  name="problemas_escuela_colegio"
                  value={formData.problemas_escuela_colegio}
                  onChange={handleChange}
                  className="input-field"
                  rows={6}
                  placeholder="Describa los problemas en la escuela..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  - Ocupación u oficio:
                </label>
                <textarea
                  name="ocupacion_oficio"
                  value={formData.ocupacion_oficio}
                  onChange={handleChange}
                  className="input-field"
                  rows={2}
                  placeholder="Describa la ocupación u oficio..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  - ¿Le gusta lo que estudias o en lo que trabaja actualmente?, (Motivos)
                </label>
                <textarea
                  name="le_gusta_estudiar_trabajar"
                  value={formData.le_gusta_estudiar_trabajar}
                  onChange={handleChange}
                  className="input-field"
                  rows={6}
                  placeholder="Describa si le gusta estudiar o trabajar..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  - ¿Tiene metas académicas y/o laborales?, indique cuáles son.
                </label>
                <textarea
                  name="tiene_metas_academicas_laborales"
                  value={formData.tiene_metas_academicas_laborales}
                  onChange={handleChange}
                  className="input-field"
                  rows={6}
                  placeholder="Describa las metas académicas y/o laborales..."
                />
              </div>
            </div>
          </div>

          {/* IV. Historia Familiar */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 -mx-4 -mt-4 rounded-t-lg">
              IV. Historia Familiar
            </h3>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              -Describa brevemente a su familia, ¿Por quién está conformada?, ¿cómo es la relación con su familia (cercana, distante, buena, mala) ¿con quién se lleva mejor?, ¿con quién se lleva menos bien o peor?, ¿tiene o ha tenido problemas familiares?, ¿de qué tipo?, si tiene hijo/s indique número de hijo/s, edades, relación que mantiene con ellos/as, etc.
            </label>
            <textarea
              name="describa_familia"
              value={formData.describa_familia}
              onChange={handleChange}
              className="input-field"
              rows={8}
              placeholder="Describa la familia..."
            />
          </div>

          {/* V. Características Personales, Gustos, Intereses y Metas de Vida */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 -mx-4 -mt-4 rounded-t-lg">
              V. Características Personales, Gustos, Intereses y Metas de Vida
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Cómo recuerda que era tu carácter y manera de ser de niño/a?
                </label>
                <textarea
                  name="como_era_caracter_nino"
                  value={formData.como_era_caracter_nino}
                  onChange={handleChange}
                  className="input-field"
                  rows={7}
                  placeholder="Describa su carácter de niño..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Cómo describe su carácter y manera de ser actualmente?
                </label>
                <textarea
                  name="como_describe_caracter_actualmente"
                  value={formData.como_describe_caracter_actualmente}
                  onChange={handleChange}
                  className="input-field"
                  rows={7}
                  placeholder="Describa su carácter actual..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mencione algunos aspectos positivos. (Habilidades)
                </label>
                <textarea
                  name="aspectos_positivos_habilidades"
                  value={formData.aspectos_positivos_habilidades}
                  onChange={handleChange}
                  className="input-field"
                  rows={7}
                  placeholder="Mencione aspectos positivos y habilidades..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Qué cosas le hacen sentir alegre o feliz?
                </label>
                <textarea
                  name="cosas_alegre_feliz"
                  value={formData.cosas_alegre_feliz}
                  onChange={handleChange}
                  className="input-field"
                  rows={7}
                  placeholder="Describa qué cosas le hacen sentir alegre..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Qué cosas le hacen sentir triste?
                </label>
                <textarea
                  name="cosas_triste"
                  value={formData.cosas_triste}
                  onChange={handleChange}
                  className="input-field"
                  rows={7}
                  placeholder="Describa qué cosas le hacen sentir triste..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  - ¿Qué cosas le molestan o enojan?
                </label>
                <textarea
                  name="cosas_molestan_enojan"
                  value={formData.cosas_molestan_enojan}
                  onChange={handleChange}
                  className="input-field"
                  rows={6}
                  placeholder="Describa qué cosas le molestan o enojan..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  - ¿Cree tener algún/os defecto/s?, si es así, mencione alguno/s de ellos.
                </label>
                <textarea
                  name="cree_tener_defectos"
                  value={formData.cree_tener_defectos}
                  onChange={handleChange}
                  className="input-field"
                  rows={6}
                  placeholder="Mencione los defectos que cree tener..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  - ¿Le gustaría mejorar o cambiar algo de sí mismo/a?
                </label>
                <textarea
                  name="le_gustaria_mejorar_cambiar"
                  value={formData.le_gustaria_mejorar_cambiar}
                  onChange={handleChange}
                  className="input-field"
                  rows={6}
                  placeholder="Describa qué le gustaría mejorar o cambiar..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  - ¿Tiene algún pasatiempo o afición actual o que le gustaría practicar en un futuro?
                </label>
                <textarea
                  name="tiene_pasatiempo_aficion"
                  value={formData.tiene_pasatiempo_aficion}
                  onChange={handleChange}
                  className="input-field"
                  rows={6}
                  placeholder="Describa sus pasatiempos o aficiones..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  -Mencione algunas de sus metas que le gustaría alcanzar en la vida.
                </label>
                <textarea
                  name="metas_alcanzar_vida"
                  value={formData.metas_alcanzar_vida}
                  onChange={handleChange}
                  className="input-field"
                  rows={6}
                  placeholder="Mencione sus metas de vida..."
                />
              </div>
            </div>
          </div>

          {/* VI. Desarrollo y Relaciones Afectivo-Sexuales */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 -mx-4 -mt-4 rounded-t-lg">
              VI. Desarrollo y Relaciones Afectivo-Sexuales
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Cómo se describe personalmente?
                </label>
                <textarea
                  name="como_se_describe_personalmente"
                  value={formData.como_se_describe_personalmente}
                  onChange={handleChange}
                  className="input-field"
                  rows={3}
                  placeholder="Describa cómo se describe personalmente..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Ha tenido o tiene actualmente una pareja sentimental?, describa el tipo de relación.
                </label>
                <textarea
                  name="ha_tenido_tiene_pareja"
                  value={formData.ha_tenido_tiene_pareja}
                  onChange={handleChange}
                  className="input-field"
                  rows={5}
                  placeholder="Describa sus relaciones sentimentales..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ha tenido relaciones sexuales (edad de inicio) (de forma voluntaria y consentida o ha sufrido o cometido algún abuso o violación):
                </label>
                <textarea
                  name="ha_tenido_relaciones_sexuales"
                  value={formData.ha_tenido_relaciones_sexuales}
                  onChange={handleChange}
                  className="input-field"
                  rows={5}
                  placeholder="Describa sus relaciones sexuales..."
                />
              </div>
            </div>
          </div>

          {/* VII. Problemas y Preocupaciones Actuales */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 -mx-4 -mt-4 rounded-t-lg">
              VII. Problemas y Preocupaciones Actuales
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Tiene algún problema o preocupación actual? (personal, familiar, escolar o laboral, social, etc.). Si es así, descríbelo/s brevemente.
                </label>
                <textarea
                  name="tiene_problema_preocupacion_actual"
                  value={formData.tiene_problema_preocupacion_actual}
                  onChange={handleChange}
                  className="input-field"
                  rows={5}
                  placeholder="Describa los problemas o preocupaciones actuales..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Cuenta con personas que le ayuden o apoyen cuando atraviesa por dificultades o problemas?, de ser así, indique quiénes son.
                </label>
                <textarea
                  name="cuenta_personas_ayuden_apoyen"
                  value={formData.cuenta_personas_ayuden_apoyen}
                  onChange={handleChange}
                  className="input-field"
                  rows={5}
                  placeholder="Describa las personas que le apoyan..."
                />
              </div>
            </div>
          </div>

          {/* VII. Relaciones Sociales */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 -mx-4 -mt-4 rounded-t-lg">
              VII. Relaciones Sociales
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿De niño/a tenía muchos/as o pocos/as amigos/as?
                </label>
                <textarea
                  name="de_nino_tenia_amigos"
                  value={formData.de_nino_tenia_amigos}
                  onChange={handleChange}
                  className="input-field"
                  rows={3}
                  placeholder="Describa sus amigos de niño..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Actualmente tiene muchos/as o pocos/as amigos/as?
                </label>
                <textarea
                  name="actualmente_tiene_amigos"
                  value={formData.actualmente_tiene_amigos}
                  onChange={handleChange}
                  className="input-field"
                  rows={5}
                  placeholder="Describa sus amigos actuales..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Dónde se relaciona con ellos/as?: en el colegio, trabajo, el barrio o colonia, etc.
                </label>
                <textarea
                  name="donde_se_relaciona_amigos"
                  value={formData.donde_se_relaciona_amigos}
                  onChange={handleChange}
                  className="input-field"
                  rows={5}
                  placeholder="Describa dónde se relaciona con sus amigos..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  - Describa cómo son sus relaciones de amistad (¿qué le gusta de ellas?, ¿hay algo que no le guste?, explorar si pertenece o no a grupos o asociaciones ilícitas, etc.).
                </label>
                <textarea
                  name="describa_relaciones_amistad"
                  value={formData.describa_relaciones_amistad}
                  onChange={handleChange}
                  className="input-field"
                  rows={7}
                  placeholder="Describa sus relaciones de amistad..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  -¿Qué piensan sus padres o responsables de sus relaciones de amistad?
                </label>
                <textarea
                  name="que_piensan_padres_relaciones_amistad"
                  value={formData.que_piensan_padres_relaciones_amistad}
                  onChange={handleChange}
                  className="input-field"
                  rows={5}
                  placeholder="Describa qué piensan sus padres..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  -¿Le gustaría cambiar sus relaciones de amistad?, si es así, indique por qué.
                </label>
                <textarea
                  name="le_gustaria_cambiar_relaciones_amistad"
                  value={formData.le_gustaria_cambiar_relaciones_amistad}
                  onChange={handleChange}
                  className="input-field"
                  rows={5}
                  placeholder="Describa si le gustaría cambiar sus relaciones..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Tiene interés por conocer gente nueva y hacer nuevos/as amigos/as?
                </label>
                <textarea
                  name="tiene_interes_conocer_gente_nueva"
                  value={formData.tiene_interes_conocer_gente_nueva}
                  onChange={handleChange}
                  className="input-field"
                  rows={5}
                  placeholder="Describa su interés por conocer gente nueva..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Tiene amigos/as dentro del CPI?, ¿qué le gusta de su relación con ellos/as?
                </label>
                <textarea
                  name="tiene_amigos_dentro_cpi"
                  value={formData.tiene_amigos_dentro_cpi}
                  onChange={handleChange}
                  className="input-field"
                  rows={5}
                  placeholder="Describa sus amigos dentro del CPI..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Ha tenido alguna dificultad de trato o relación con algún/a adolescente o joven del CPI?, ¿por qué motivo ha sido?, ¿se ha podido resolver lo ocurrido?
                </label>
                <textarea
                  name="ha_tenido_dificultad_trato_cpi"
                  value={formData.ha_tenido_dificultad_trato_cpi}
                  onChange={handleChange}
                  className="input-field"
                  rows={5}
                  placeholder="Describa las dificultades en el CPI..."
                />
              </div>
            </div>
          </div>

          {/* IX. Entorno Comunitario */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 -mx-4 -mt-4 rounded-t-lg">
              IX. Entorno Comunitario
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Le gusta el barrio o colonia en la que vive?, ¿Qué es lo que más le gusta y lo que menos le gusta de su entorno?
              </label>
              <textarea
                name="le_gusta_barrio_colonia"
                value={formData.le_gusta_barrio_colonia}
                onChange={handleChange}
                className="input-field"
                rows={5}
                placeholder="Describa su entorno comunitario..."
              />
            </div>
          </div>

          {/* X. Trayectoria de Vida */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 -mx-4 -mt-4 rounded-t-lg">
              X. Trayectoria de Vida
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              En cuanto a su trayectoria de vida, indique qué eventos o situaciones han marcado su vida desde la niñez hasta el momento actual:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Positivos
                </label>
                <textarea
                  name="eventos_positivos"
                  value={formData.eventos_positivos}
                  onChange={handleChange}
                  className="input-field"
                  rows={8}
                  placeholder="Describa eventos positivos..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Negativos
                </label>
                <textarea
                  name="eventos_negativos"
                  value={formData.eventos_negativos}
                  onChange={handleChange}
                  className="input-field"
                  rows={8}
                  placeholder="Describa eventos negativos..."
                />
              </div>
            </div>
          </div>

          {/* XI. Antecedentes y Situación Jurídica Actual */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 -mx-4 -mt-4 rounded-t-lg">
              XI. Antecedentes y Situación Jurídica Actual
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Vivencia emocional en relación a la infracción cometida y la medida judicial impuesta (en caso de ser necesario, proporcionar el apoyo psicológico requerido):
                </label>
                <textarea
                  name="vivencia_emocional_infraccion"
                  value={formData.vivencia_emocional_infraccion}
                  onChange={handleChange}
                  className="input-field"
                  rows={6}
                  placeholder="Describa la vivencia emocional..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  - ¿Algún otro miembro de su familia, amistades o conocidos ha/n tenido problemas con la justicia?, ¿de qué tipo?
                </label>
                <textarea
                  name="otros_familiares_problemas_justicia"
                  value={formData.otros_familiares_problemas_justicia}
                  onChange={handleChange}
                  className="input-field"
                  rows={6}
                  placeholder="Describa problemas con la justicia de otros..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Cómo ocurrieron los hechos?
                </label>
                <textarea
                  name="como_ocurrieron_hechos"
                  value={formData.como_ocurrieron_hechos}
                  onChange={handleChange}
                  className="input-field"
                  rows={6}
                  placeholder="Describa cómo ocurrieron los hechos..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Qué considera que ha causado o influido en la conducta o presunta conducta infractora que le ha llevado a ingresar al CPI?
                </label>
                <textarea
                  name="que_causo_influido_conducta_infractora"
                  value={formData.que_causo_influido_conducta_infractora}
                  onChange={handleChange}
                  className="input-field"
                  rows={6}
                  placeholder="Describa qué causó o influyó en la conducta..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  - ¿Cree que podría haber ocurrido algo que impidiera que se dieran los hechos? Describa brevemente.
                </label>
                <textarea
                  name="cree_podria_haber_ocurrido_algo"
                  value={formData.cree_podria_haber_ocurrido_algo}
                  onChange={handleChange}
                  className="input-field"
                  rows={5}
                  placeholder="Describa qué podría haber impedido los hechos..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Cómo reaccionaron las personas cercanas a usted (familia, amistades, etc.) al conocer los hechos y su ingreso en el CPI?, ¿tiene importancia para usted lo que piensan y sienten?, ¿en qué sentido?
                </label>
                <textarea
                  name="como_reaccionaron_personas_cercanas"
                  value={formData.como_reaccionaron_personas_cercanas}
                  onChange={handleChange}
                  className="input-field"
                  rows={5}
                  placeholder="Describa cómo reaccionaron las personas cercanas..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Una vez pasados los hechos ¿qué piensa y siente ahora en relación a lo ocurrido?
                </label>
                <textarea
                  name="que_piensa_siente_ahora"
                  value={formData.que_piensa_siente_ahora}
                  onChange={handleChange}
                  className="input-field"
                  rows={5}
                  placeholder="Describa qué piensa y siente ahora..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Considera que puede aportarle algo positivo cumplir una medida judicial y la intervención psicológica que va a recibir?, ¿en qué crees qué puede serle de ayuda?
                </label>
                <textarea
                  name="considera_puede_aportar_medida_judicial"
                  value={formData.considera_puede_aportar_medida_judicial}
                  onChange={handleChange}
                  className="input-field"
                  rows={5}
                  placeholder="Describa qué puede aportarle la medida judicial..."
                />
              </div>
            </div>
          </div>

          {/* XII. Observaciones */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 -mx-4 -mt-4 rounded-t-lg">
              XII. Observaciones
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              (Conducta observada, estado emocional, físico, conductual, perspectivas de cambio, demanda o no demanda de intervención, etc.).
            </p>
            <textarea
              name="observaciones"
              value={formData.observaciones}
              onChange={handleChange}
              className="input-field"
              rows={5}
              placeholder="Describa las observaciones..."
            />
          </div>

          {/* XIII. Conclusiones */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 -mx-4 -mt-4 rounded-t-lg">
              XIII. Conclusiones
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              (Conclusiones de la entrevista inicial, impresión diagnóstica: detección de posibles factores desencadenantes, de riesgo y protección ante el comportamiento infractor o delictivo de el/la adolescente o joven, sospecha o determinación del padecimiento de enfermedades mentales o trastornos de personalidad, conducta, estado de ánimo, etc.).
            </p>
            <textarea
              name="conclusiones"
              value={formData.conclusiones}
              onChange={handleChange}
              className="input-field"
              rows={5}
              placeholder="Describa las conclusiones..."
            />
          </div>

          {/* Firma */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Firma y Sello</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Firma y sello de el/la Psicólogo/a
                </label>
                <input
                  type="text"
                  name="nombre_firma_psicologo"
                  value={formData.nombre_firma_psicologo}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Colegiación #
                </label>
                <input
                  type="text"
                  name="colegiacion"
                  value={formData.colegiacion}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Guardando...' : 'Guardar Formulario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

