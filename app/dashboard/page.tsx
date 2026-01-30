'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { 
  Users, 
  FileText, 
  Calendar,
  TrendingUp,
  Building2,
  UserCheck,
  Activity,
  ArrowUpRight,
  Shield
} from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface Stats {
  totalJovenes: number
  jovenesActivos: number
  totalAtenciones: number
  atencionesPendientes: number
}

interface Centro {
  id: string
  nombre: string
  tipo: 'CPI' | 'PAMSPL'
  ubicacion: string
}

export default function DashboardPage() {
  const supabase = createClientComponentClient()

  const [stats, setStats] = useState<Stats>({
    totalJovenes: 0,
    jovenesActivos: 0,
    totalAtenciones: 0,
    atencionesPendientes: 0,
  })
  const [centros, setCentros] = useState<Centro[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasSecurityQuestions, setHasSecurityQuestions] = useState<boolean | null>(null)

  // Optimización: Cargar todas las estadísticas en paralelo con timeout y mejor manejo de errores
  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Función helper para agregar timeout a las consultas
      // Acepta PromiseLike para compatibilidad con Supabase
      const withTimeout = <T,>(promise: Promise<T> | PromiseLike<T>, timeoutMs: number, defaultValue: T): Promise<T> => {
        const promiseResolved = Promise.resolve(promise)
        return Promise.race([
          promiseResolved,
          new Promise<T>((resolve) => {
            setTimeout(() => resolve(defaultValue), timeoutMs)
          })
        ]).catch(() => defaultValue)
      }

      // Ejecutar consultas individuales con timeout y manejo de errores independiente
      // Esto permite que si una consulta falla, las otras puedan completarse
      const queries = await Promise.allSettled([
        // Consulta 1: Total de jóvenes (timeout 12s)
        withTimeout(
          supabase
            .from('jovenes')
            .select('id', { count: 'exact', head: true })
            .then(result => ({ type: 'totalJovenes', count: result.count || 0, error: result.error })),
          12000,
          { type: 'totalJovenes', count: 0, error: null }
        ),
        
        // Consulta 2: Jóvenes activos (timeout 12s)
        withTimeout(
          supabase
            .from('jovenes')
            .select('id', { count: 'exact', head: true })
            .eq('estado', 'activo')
            .then(result => ({ type: 'jovenesActivos', count: result.count || 0, error: result.error })),
          12000,
          { type: 'jovenesActivos', count: 0, error: null }
        ),
        
        // Consulta 3: Total de atenciones (timeout 12s)
        withTimeout(
          supabase
            .from('atenciones')
            .select('id', { count: 'exact', head: true })
            .then(result => ({ type: 'totalAtenciones', count: result.count || 0, error: result.error })),
          12000,
          { type: 'totalAtenciones', count: 0, error: null }
        ),
        
        // Consulta 4: Atenciones pendientes (timeout 12s)
        withTimeout(
          supabase
            .from('atenciones')
            .select('id', { count: 'exact', head: true })
            .in('estado', ['pendiente', 'en_proceso'])
            .then(result => ({ type: 'atencionesPendientes', count: result.count || 0, error: result.error })),
          12000,
          { type: 'atencionesPendientes', count: 0, error: null }
        ),
        
        // Consulta 5: Centros (timeout 8s)
        withTimeout(
          supabase
            .from('centros')
            .select('id, nombre, tipo, ubicacion')
            .order('nombre')
            .then(result => ({ type: 'centros', data: result.data || [], error: result.error })),
          8000,
          { type: 'centros', data: [], error: null }
        )
      ])

      // Procesar resultados
      let totalJovenes = 0
      let jovenesActivos = 0
      let totalAtenciones = 0
      let atencionesPendientes = 0
      let centrosData: Centro[] = []
      const errors: string[] = []

      // Type guards para ayudar a TypeScript
      type CountResult = { type: string; count: number; error: any }
      type DataResult = { type: string; data: Centro[]; error: any }

      queries.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const data = result.value
          if (data.error) {
            errors.push(`Error en ${data.type}: ${data.error.message || 'Error desconocido'}`)
          }
          
          switch (data.type) {
            case 'totalJovenes':
              totalJovenes = (data as CountResult).count
              break
            case 'jovenesActivos':
              jovenesActivos = (data as CountResult).count
              break
            case 'totalAtenciones':
              totalAtenciones = (data as CountResult).count
              break
            case 'atencionesPendientes':
              atencionesPendientes = (data as CountResult).count
              break
            case 'centros':
              centrosData = (data as DataResult).data
              break
          }
        } else {
          errors.push(`Error en consulta ${index + 1}: ${result.reason}`)
        }
      })

      // Si hay errores pero al menos algunas consultas funcionaron, solo loguear
      if (errors.length > 0) {
        console.warn('Algunas consultas fallaron:', errors)
        // Solo mostrar error si todas las consultas fallaron o si hay muchos errores
        if (errors.length === queries.length || errors.length >= 3) {
          setError('Algunos datos no pudieron cargarse. Los datos disponibles se muestran a continuación.')
        }
      }

      setStats({
        totalJovenes,
        jovenesActivos,
        totalAtenciones,
        atencionesPendientes,
      })

      setCentros(centrosData)
      
      // Verificar preguntas secretas de forma no bloqueante
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { count } = await supabase
            .from('security_questions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
          
          setHasSecurityQuestions((count ?? 0) > 0)
        }
      } catch (err) {
        // Ignorar errores de verificación de preguntas secretas
        console.warn('No se pudo verificar preguntas secretas:', err)
        setHasSecurityQuestions(null)
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar los datos del dashboard'
      setError(errorMessage)
      // Establecer valores por defecto para que la app no se quede bloqueada
      setStats({
        totalJovenes: 0,
        jovenesActivos: 0,
        totalAtenciones: 0,
        atencionesPendientes: 0,
      })
      setCentros([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Memoizar las tarjetas de estadísticas
  const statCards = useMemo(() => [
    {
      title: 'Total Jóvenes',
      value: stats.totalJovenes,
      icon: Users,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      textColor: 'text-blue-600 dark:text-blue-400',
      trend: null,
    },
    {
      title: 'Jóvenes Activos',
      value: stats.jovenesActivos,
      icon: UserCheck,
      color: 'bg-green-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      textColor: 'text-green-600 dark:text-green-400',
      trend: stats.totalJovenes > 0 ? ((stats.jovenesActivos / stats.totalJovenes) * 100).toFixed(1) : '0',
    },
    {
      title: 'Total Atenciones',
      value: stats.totalAtenciones,
      icon: FileText,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      textColor: 'text-purple-600 dark:text-purple-400',
      trend: null,
    },
    {
      title: 'Atenciones Pendientes',
      value: stats.atencionesPendientes,
      icon: Activity,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      textColor: 'text-orange-600 dark:text-orange-400',
      trend: stats.totalAtenciones > 0 ? ((stats.atencionesPendientes / stats.totalAtenciones) * 100).toFixed(1) : '0',
    },
  ], [stats])

  // Memoizar acciones rápidas
  const quickActions = useMemo(() => [
    {
      title: 'Registrar Joven',
      description: 'Agregar un nuevo menor al sistema',
      icon: Users,
      href: '/dashboard/jovenes/nuevo',
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      title: 'Nueva Atención',
      description: 'Registrar una atención a un joven',
      icon: FileText,
      href: '/dashboard/atenciones/nueva',
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
      title: 'Ver Jóvenes',
      description: 'Lista completa de jóvenes registrados',
      icon: UserCheck,
      href: '/dashboard/jovenes',
      color: 'bg-purple-500 hover:bg-purple-600',
    },
    {
      title: 'Ver Atenciones',
      description: 'Historial de atenciones realizadas',
      icon: Calendar,
      href: '/dashboard/atenciones',
      color: 'bg-orange-500 hover:bg-orange-600',
    },
  ], [])

  // Memoizar centros filtrados
  const centrosCPI = useMemo(() => 
    centros.filter(centro => centro.tipo === 'CPI'),
    [centros]
  )

  const centrosPAMSPL = useMemo(() => 
    centros.filter(centro => centro.tipo === 'PAMSPL'),
    [centros]
  )

  const tiposAtencion = useMemo(() => 
    ['Pedagógica', 'Legal', 'Médica', 'Psicológica', 'Trabajo Social', 'Seguridad'],
    []
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Inicio</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Bienvenido al Sistema de Gestión de Atenciones INAMI
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Security Questions Warning */}
      {hasSecurityQuestions === false && (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                Configuración de Seguridad Pendiente
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-2">
                Por favor, configura tus preguntas secretas para mayor seguridad de tu cuenta.
              </p>
              <Link 
                href="/dashboard/configuracion/preguntas-secretas"
                className="text-sm font-medium text-yellow-800 dark:text-yellow-200 hover:underline"
              >
                Configurar ahora →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <div 
              key={index} 
              className="card hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</p>
                <div className={`${stat.bgColor} p-2 rounded-lg`}>
                  <stat.icon className={`w-5 h-5 ${stat.textColor}`} />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                {stat.trend && (
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <span>{stat.trend}%</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              href={action.href}
              className="card hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer group"
            >
              <div className={`${action.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <action.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{action.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{action.description}</p>
              <div className="mt-4 flex items-center text-sm text-primary-600 dark:text-primary-400 group-hover:gap-2 transition-all">
                <span>Ir</span>
                <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Information Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Centros Info */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
              <Building2 className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Centros de Atención</h3>
          </div>
          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50/50 dark:bg-blue-900/10 rounded-r">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">CPI - Centros Pedagógicos</h4>
              {centrosCPI.length > 0 ? (
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  {centrosCPI.map((centro) => (
                    <li key={centro.id} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                      {centro.nombre} <span className="text-gray-400">({centro.ubicacion})</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No hay centros CPI registrados</p>
              )}
            </div>
            <div className="border-l-4 border-green-500 pl-4 py-2 bg-green-50/50 dark:bg-green-900/10 rounded-r">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">PAMSPL - Programas de Atención</h4>
              {centrosPAMSPL.length > 0 ? (
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  {centrosPAMSPL.map((centro) => (
                    <li key={centro.id} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                      {centro.nombre} <span className="text-gray-400">({centro.ubicacion})</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No hay centros PAMSPL registrados</p>
              )}
            </div>
          </div>
        </div>

        {/* Tipos de Atención */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
              <TrendingUp className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Tipos de Atención</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {tiposAtencion.map((tipo, i) => (
              <div 
                key={i} 
                className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-2 border-gray-300 dark:border-gray-600 shadow-sm"
              >
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{tipo}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
