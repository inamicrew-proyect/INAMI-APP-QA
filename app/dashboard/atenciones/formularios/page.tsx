'use client'

import Link from 'next/link'
import {
  Brain,
  Users,
  GraduationCap,
  Heart,
  Shield,
  Scale,
  FileText,
  ArrowLeft,
  Plus,
  BookOpen,
  Activity,
  UserCheck,
  ClipboardList,
  Gavel,
  Stethoscope,
  AlertTriangle,
  Briefcase,
  Home
} from 'lucide-react'

const formularios = [
  {
    area: 'Psicología',
    icon: Brain,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    subsecciones: [
      {
        nombre: 'PMSPL',
        formularios: [
        {
          nombre: 'Entrevista Inicial - Adolescente/Joven',
          descripcion: 'Entrevista psicológica inicial dirigida a adolescentes o jóvenes.',
          ruta: '/dashboard/atenciones/formularios/psicologia/pmspl/entrevista-inicial-adolescente',
          icon: UserCheck
        },
        {
          nombre: 'Entrevista Psicológica - Adolescentes y Jóvenes',
          descripcion: 'Entrevista psicológica a adolescentes y jóvenes.',
          ruta: '/dashboard/atenciones/formularios/psicologia/pmspl/entrevista-psicologica-adolescentes-jovenes',
          icon: Users
        },
        {
          nombre: 'Entrevista Psicológica Final - Adolescente/Joven',
          descripcion: 'Entrevista psicológica final para adolescentes y jóvenes.',
          ruta: '/dashboard/atenciones/formularios/psicologia/pmspl/entrevista-final-adolescente',
          icon: ClipboardList
        },
        {
          nombre: 'Ficha de Remisión a Instituciones o Servicios Externos',
          descripcion: 'Ficha para registrar remisión a instituciones o servicios externos.',
          ruta: '/dashboard/atenciones/formularios/psicologia/pmspl/remision-instituciones',
          icon: ArrowLeft
        },
        {
          nombre: 'Fichas de Seguimiento Psicológico',
          descripcion: 'Registros de seguimiento psicológico.',
          ruta: '/dashboard/atenciones/formularios/psicologia/pmspl/seguimiento-psicologico',
          icon: ClipboardList
        },
        {
          nombre: 'Informe Psicodiagnóstico',
          descripcion: 'Informe de psicodiagnóstico.',
          ruta: '/dashboard/atenciones/formularios/psicologia/pmspl/informe-psicodiagnostico',
          icon: FileText
        },
        {
          nombre: 'Informe Psicológico de Seguimiento',
          descripcion: 'Informe psicológico de seguimiento del paciente.',
          ruta: '/dashboard/atenciones/formularios/psicologia/pmspl/informe-seguimiento',
          icon: FileText
        },
        {
          nombre: 'Informe Psicológico Final',
          descripcion: 'Informe psicológico final del proceso.',
          ruta: '/dashboard/atenciones/formularios/psicologia/pmspl/informe-final',
          icon: FileText
        }
        ]
      },
      {
        nombre: 'CPI',
        formularios: [
          {
            nombre: 'Entrevista psicológica de seguimiento (madres, padres, o familiar de referencia)',
            descripcion: 'Entrevista de seguimiento dirigida a madres, padres o referentes familiares',
            ruta: '/dashboard/atenciones/formularios/psicologia/cpi/entrevista-seguimiento-familia',
            icon: ClipboardList
          },
          {
            nombre: 'Entrevista psicológica inicial adolescente-jóvenes',
            descripcion: 'Entrevista psicológica inicial para adolescentes y jóvenes',
            ruta: '/dashboard/atenciones/formularios/psicologia/cpi/entrevista-inicial-adolescente',
            icon: UserCheck
          },
          {
            nombre: 'Entrevista psicológica inicial madres, padres u otros familiares de referencia',
            descripcion: 'Entrevista inicial dirigida a madres, padres u otros referentes familiares',
            ruta: '/dashboard/atenciones/formularios/psicologia/cpi/entrevista-inicial-familia',
            icon: UserCheck
          },
          {
            nombre: 'Ficha de intervención en crisis',
            descripcion: 'Registro para la intervención en situaciones de crisis',
            ruta: '/dashboard/atenciones/formularios/psicologia/cpi/intervencion-crisis',
            icon: AlertTriangle
          },
          {
            nombre: 'Ficha de Remisión',
            descripcion: 'Registro de remisión a otros programas o instituciones',
            ruta: '/dashboard/atenciones/formularios/psicologia/cpi/remision',
            icon: ArrowLeft
          },
          {
            nombre: 'Ficha de seguimiento terapéutico familiar',
            descripcion: 'Seguimiento terapéutico familiar',
            ruta: '/dashboard/atenciones/formularios/psicologia/cpi/seguimiento-terapeutico-familiar',
            icon: ClipboardList
          },
          {
            nombre: 'Ficha de seguimiento terapéutico grupal adolescente y jóvenes',
            descripcion: 'Seguimiento terapéutico grupal de adolescentes y jóvenes',
            ruta: '/dashboard/atenciones/formularios/psicologia/cpi/seguimiento-terapeutico-grupal-adolescentes',
            icon: ClipboardList
          },
          {
            nombre: 'Ficha de seguimiento terapéutico grupal madres, padres y encargados',
            descripcion: 'Seguimiento terapéutico grupal para padres, madres y encargados',
            ruta: '/dashboard/atenciones/formularios/psicologia/cpi/seguimiento-terapeutico-grupal-padres',
            icon: ClipboardList
          },
          {
            nombre: 'Ficha de seguimiento terapéutico individual adolescentes y jóvenes',
            descripcion: 'Seguimiento terapéutico individual de adolescentes y jóvenes',
            ruta: '/dashboard/atenciones/formularios/psicologia/cpi/seguimiento-terapeutico-individual-adolescentes',
            icon: ClipboardList
          },
          {
            nombre: 'Ficha de remisión interna',
            descripcion: 'Registro de remisión interna',
            ruta: '/dashboard/atenciones/formularios/psicologia/cpi/remision-interna',
            icon: ArrowLeft
          },
          {
            nombre: 'Informe Psicodiagnóstico',
            descripcion: 'Informe de psicodiagnóstico del NNAJ',
            ruta: '/dashboard/atenciones/formularios/psicologia/cpi/informe-psicodiagnostico',
            icon: FileText
          },
          {
            nombre: 'Informe Psicológico Final',
            descripcion: 'Informe psicológico final del proceso',
            ruta: '/dashboard/atenciones/formularios/psicologia/cpi/informe-final',
            icon: FileText
          },
          {
            nombre: 'Informe psicológico para la realización de seguimiento post sanción',
            descripcion: 'Informe psicológico para seguimiento luego de la sanción',
            ruta: '/dashboard/atenciones/formularios/psicologia/cpi/informe-seguimiento-post-sancion',
            icon: FileText
          },
          {
            nombre: 'Informe Psicológico Preliminar',
            descripcion: 'Informe psicológico preliminar del caso',
            ruta: '/dashboard/atenciones/formularios/psicologia/cpi/informe-preliminar',
            icon: FileText
          },
          {
            nombre: 'Entrevista preeliminar',
            descripcion: 'Entrevista e informe psicólogico preeliminar',
            ruta: '/dashboard/atenciones/formularios/psicologia/cpi/entrevista-preeliminar',
            icon: FileText
          }
        ]
      }
    ]
  },
  {
    area: 'Trabajo Social',
    icon: Users,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    subsecciones: [
      {
        nombre: 'PMSPL',
        formularios: [
          {
            nombre: 'Ficha Social',
            descripcion: 'Evaluación social integral del joven',
            ruta: '/dashboard/atenciones/formularios/trabajo-social/ficha-social',
            icon: FileText
          },
          {
            nombre: 'Entrevista Familiar',
            descripcion: 'Evaluación de la situación familiar',
            ruta: '/dashboard/atenciones/formularios/trabajo-social/entrevista-familiar',
            icon: Users
          },
          {
            nombre: 'Estudio Socioeconómico',
            descripcion: 'Análisis de la situación socioeconómica',
            ruta: '/dashboard/atenciones/formularios/trabajo-social/estudio-socioeconomico',
            icon: BookOpen
          },
          {
            nombre: 'Ficha de Intervención',
            descripcion: 'Registro de intervenciones sociales',
            ruta: '/dashboard/atenciones/formularios/trabajo-social/ficha-intervencion',
            icon: ClipboardList
          },
          {
            nombre: 'Entrevista Social de Evaluación y Seguimiento',
            descripcion: 'Evaluación y seguimiento social del NNAJ',
            ruta: '/dashboard/atenciones/formularios/trabajo-social/entrevista-evaluacion-seguimiento',
            icon: FileText
          },
          {
            nombre: 'Ficha de Incidencias',
            descripcion: 'Registro de incidencias y situaciones presentadas',
            ruta: '/dashboard/atenciones/formularios/trabajo-social/ficha-incidencias',
            icon: AlertTriangle
          },
          {
            nombre: 'Informe Social - Servicio Comunitario',
            descripcion: 'Informe de servicio comunitario del NNAJ',
            ruta: '/dashboard/atenciones/formularios/trabajo-social/informe-servicio-comunitario',
            icon: Briefcase
          },
          {
            nombre: 'Plan de Atención Individual (PLATIN)',
            descripcion: 'Plan de atención individual para el NNAJ',
            ruta: '/dashboard/atenciones/formularios/trabajo-social/plan-atencion-individual',
            icon: ClipboardList
          },
          {
            nombre: 'Informe Social - Inicial',
            descripcion: 'Informe social inicial del NNAJ',
            ruta: '/dashboard/atenciones/formularios/trabajo-social/informe-social-inicial',
            icon: FileText
          },
          {
            nombre: 'Informe Social de Egreso/Cierre',
            descripcion: 'Informe social de egreso y cierre del NNAJ',
            ruta: '/dashboard/atenciones/formularios/trabajo-social/informe-social-egreso-cierre',
            icon: FileText
          },
          {
            nombre: 'Informe Social de Evaluación y Seguimiento',
            descripcion: 'Informe social de evaluación y seguimiento del NNAJ',
            ruta: '/dashboard/atenciones/formularios/trabajo-social/informe-social-evaluacion-seguimiento',
            icon: FileText
          },
          {
            nombre: 'Informe Socio-Económico',
            descripcion: 'Informe socio-económico del NNAJ y su familia',
            ruta: '/dashboard/atenciones/formularios/trabajo-social/informe-socioeconomico',
            icon: FileText
          },
          {
            nombre: 'Ficha Social - Área de Trabajo Social',
            descripcion: 'Ficha social completa del NNAJ',
            ruta: '/dashboard/atenciones/formularios/trabajo-social/ficha-social-area-trabajo-social',
            icon: FileText
          },
          {
            nombre: 'Ficha Entrevista Final Cierre',
            descripcion: 'Entrevista final de cierre del NNAJ',
            ruta: '/dashboard/atenciones/formularios/trabajo-social/ficha-entrevista-final-cierre',
            icon: FileText
          },
          {
            nombre: 'Visita Domiciliaria',
            descripcion: 'Registro de visitas domiciliarias',
            ruta: '/dashboard/atenciones/formularios/trabajo-social/visita-domiciliaria',
            icon: Activity
          },
          {
            nombre: 'Informe de Incidencias',
            descripcion: 'Registro de incidencias sociales',
            ruta: '/dashboard/atenciones/formularios/trabajo-social/informe-incidencias',
            icon: FileText
          }
        ]
      },
      {
        nombre: 'CPI',
        formularios: [
          {
            nombre: '01 - Ficha Social Fase de Ingreso',
            descripcion: 'Ficha social de fase de ingreso al CPI',
            ruta: '/dashboard/atenciones/formularios/trabajo-social/ficha-social-fase-ingreso',
            icon: FileText
          },
          {
            nombre: 'Ficha Social Fase de Diagnóstico',
            descripcion: 'Ficha social de fase de diagnóstico al CPI',
            ruta: '/dashboard/atenciones/formularios/trabajo-social/ficha-social-fase-diagnostico',
            icon: FileText
          },
          {
            nombre: 'Formato Informe Social Fase Diagnóstico',
            descripcion: 'Informe social de fase de diagnóstico al CPI',
            ruta: '/dashboard/atenciones/formularios/trabajo-social/informe-social-fase-diagnostico',
            icon: FileText
          },
          {
            nombre: 'Ficha de Visita Domiciliaria',
            descripcion: 'Ficha de visita domiciliaria al CPI',
            ruta: '/dashboard/atenciones/formularios/trabajo-social/ficha-visita-domiciliaria-cpi',
            icon: Home
          },
          {
            nombre: 'Entrevista de Evaluación y Seguimiento',
            descripcion: 'Entrevista de evaluación y seguimiento al CPI',
            ruta: '/dashboard/atenciones/formularios/trabajo-social/entrevista-evaluacion-seguimiento-cpi',
            icon: FileText
          },
          {
            nombre: 'Informe de Evaluación y Seguimiento CPI',
            descripcion: 'Informe social de evaluación y seguimiento al CPI',
            ruta: '/dashboard/atenciones/formularios/trabajo-social/informe-evaluacion-seguimiento-cpi',
            icon: FileText
          },
          {
            nombre: 'Ficha Entrevista de Egreso CPI',
            descripcion: 'Ficha de entrevista final de cierre o egreso al CPI',
            ruta: '/dashboard/atenciones/formularios/trabajo-social/ficha-entrevista-egreso-cpi',
            icon: FileText
          },
          {
            nombre: 'Formato Informe Social de Egreso',
            descripcion: 'Informe social de egreso al CPI',
            ruta: '/dashboard/atenciones/formularios/trabajo-social/informe-social-egreso-cpi',
            icon: FileText
          },
          {
            nombre: 'Ficha de Intervención Trabajo Social CPI',
            descripcion: 'Ficha de intervención de trabajo social al CPI',
            ruta: '/dashboard/atenciones/formularios/trabajo-social/ficha-intervencion-cpi',
            icon: FileText
          },
          {
            nombre: 'Ficha Entrevista Familiar CPI',
            descripcion: 'Entrevista familiar al CPI',
            ruta: '/dashboard/atenciones/formularios/trabajo-social/entrevista-familiar-cpi',
            icon: Users
          },
          {
            nombre: 'Ficha de Remisión Interna CPI',
            descripcion: 'Ficha de remisión interna al CPI',
            ruta: '/dashboard/atenciones/formularios/trabajo-social/ficha-remision-interna-cpi',
            icon: FileText
          },
          {
            nombre: 'Formato Plan de Atención Cautelar (CPI)',
            descripcion: 'Plan de atención cautelar para CPI',
            ruta: '/dashboard/atenciones/formularios/trabajo-social/plan-atencion-cautelar-cpi',
            icon: FileText
          },
          {
            nombre: 'Formato PLATIN (CPI)',
            descripcion: 'Plan de atención individual para CPI',
            ruta: '/dashboard/atenciones/formularios/trabajo-social/platin-cpi',
            icon: FileText
          }
        ]
      }
    ]
  },
  {
    area: 'Educación',
    icon: GraduationCap,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    formularios: [
      {
        nombre: 'Informe Inicial Educativo',
        descripcion: 'Evaluación educativa inicial',
        ruta: '/dashboard/atenciones/formularios/educacion/informe-inicial',
        icon: BookOpen
      },
      {
        nombre: 'Plan de Actividades',
        descripcion: 'Planificación de actividades educativas',
        ruta: '/dashboard/atenciones/formularios/educacion/plan-actividades',
        icon: ClipboardList
      },
      {
        nombre: 'Informe de Seguimiento',
        descripcion: 'Seguimiento del progreso educativo',
        ruta: '/dashboard/atenciones/formularios/educacion/informe-seguimiento',
        icon: Activity
      },
      {
        nombre: 'Informe Final',
        descripcion: 'Evaluación final del proceso educativo',
        ruta: '/dashboard/atenciones/formularios/educacion/informe-final',
        icon: FileText
      },
      {
        nombre: 'Informe Especial',
        descripcion: 'Informes especiales educativos',
        ruta: '/dashboard/atenciones/formularios/educacion/informe-especial',
        icon: GraduationCap
      },
      {
        nombre: 'Cierre Educativo',
        descripcion: 'Proceso de cierre educativo',
        ruta: '/dashboard/atenciones/formularios/educacion/cierre',
        icon: BookOpen
      }
    ]
  },
  {
    area: 'Salud',
    icon: Heart,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    formularios: [
      {
        nombre: 'Examen Físico',
        descripcion: 'Examen físico médico completo',
        ruta: '/dashboard/atenciones/formularios/medicos/examen-fisico',
        icon: Stethoscope
      },
      {
        nombre: 'Historia Clínica',
        descripcion: 'Historia clínica del paciente',
        ruta: '/dashboard/atenciones/formularios/medicos/historia-clinica',
        icon: FileText
      },
      {
        nombre: 'Hoja de Egreso',
        descripcion: 'Registro de egreso médico',
        ruta: '/dashboard/atenciones/formularios/medicos/hoja-egreso',
        icon: ClipboardList
      },
      {
        nombre: 'Informe de Seguimiento',
        descripcion: 'Seguimiento médico del paciente',
        ruta: '/dashboard/atenciones/formularios/medicos/informe-seguimiento',
        icon: Activity
      }
    ]
  },
  {
    area: 'Seguridad',
    icon: Shield,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    formularios: [
      {
        nombre: 'Ficha de Ingreso',
        descripcion: 'Registro de ingreso al centro',
        ruta: '/dashboard/atenciones/formularios/seguridad/ficha-ingreso',
        icon: Shield
      },
    ]
  },
  {
    area: 'Legal',
    icon: Scale,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    formularios: [
      {
        nombre: 'Datos Judiciales',
        descripcion: 'Registro de datos judiciales',
        ruta: '/dashboard/atenciones/formularios/legal/datos-judiciales',
        icon: Gavel
      },
      {
        nombre: 'Asesoría Legal',
        descripcion: 'Registro de asesorías legales',
        ruta: '/dashboard/atenciones/formularios/legal/asesoria-legal',
        icon: Scale
      },
      {
        nombre: 'Resumen de Causas',
        descripcion: 'Resumen de causas judiciales',
        ruta: '/dashboard/atenciones/formularios/legal/resumen-causas',
        icon: FileText
      }
    ]
  }
]

export default function FormulariosPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/atenciones" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Formularios de Atención
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Selecciona el área y formulario que deseas completar
          </p>
        </div>
      </div>

      {/* Formularios por Área */}
      <div className="space-y-8">
        {formularios.map((area) => {
          const IconComponent = area.icon
          const totalFormularios = area.subsecciones
            ? area.subsecciones.reduce((total: number, sub: any) => total + sub.formularios.length, 0)
            : area.formularios?.length || 0

          return (
            <div key={area.area} className="card">
              <div className="flex items-center gap-3 mb-6">
                <div className={`p-3 rounded-lg ${area.bgColor} ${area.borderColor} border`}>
                  <IconComponent className={`w-6 h-6 ${area.color}`} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {area.area}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300">
                    {totalFormularios} formularios disponibles
                  </p>
                </div>
              </div>

              {/* Si tiene subsecciones (Trabajo Social) */}
              {area.subsecciones ? (
                <div className="space-y-6">
                  {area.subsecciones.map((subseccion: any) => (
                    <div key={subseccion.nombre}>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                        {subseccion.nombre}
                      </h3>
                      {subseccion.formularios.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {subseccion.formularios.map((formulario: any) => {
                            const FormIcon = formulario.icon
                            return (
                              <Link
                                key={formulario.nombre}
                                href={formulario.ruta}
                                className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md transition-all duration-200 group"
                              >
                                <div className="flex items-start gap-3">
                                  <div className={`p-2 rounded-lg ${area.bgColor} group-hover:scale-110 transition-transform duration-200`}>
                                    <FormIcon className={`w-5 h-5 ${area.color}`} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-gray-700 dark:group-hover:text-gray-300">
                                      {formulario.nombre}
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                      {formulario.descripcion}
                                    </p>
                                  </div>
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <Plus className="w-4 h-4 text-gray-400" />
                                  </div>
                                </div>
                              </Link>
                            )
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                          No hay formularios disponibles en esta sección aún.
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                /* Sin subsecciones (otras áreas) */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {area.formularios?.map((formulario: any) => {
                    const FormIcon = formulario.icon
                    return (
                      <Link
                        key={formulario.nombre}
                        href={formulario.ruta}
                        className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md transition-all duration-200 group"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${area.bgColor} group-hover:scale-110 transition-transform duration-200`}>
                            <FormIcon className={`w-5 h-5 ${area.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-gray-700 dark:group-hover:text-gray-300">
                              {formulario.nombre}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {formulario.descripcion}
                            </p>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <Plus className="w-4 h-4 text-gray-400" />
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Estadísticas */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <div className="text-2xl font-bold text-purple-600">
            {formularios[0].formularios?.length || 0}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">Psicología</p>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-blue-600">
            {formularios[1].subsecciones
              ? formularios[1].subsecciones.reduce((total: number, sub: any) => total + sub.formularios.length, 0)
              : formularios[1].formularios?.length || 0}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">Trabajo Social</p>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-600">
            {formularios[2].formularios?.length || 0}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">Educación</p>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-red-600">
            {formularios[3].formularios?.length || 0 || 0}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">Salud</p>
        </div>
      </div>
    </div>
  )
}