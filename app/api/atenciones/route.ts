// app/api/atenciones/route.ts
import { NextResponse, type NextRequest } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

async function requireAuth(_request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies: () => cookies() })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { error: 'No autenticado', status: 401 } as const
  }

  const userId = session.user.id

  // Verificar el perfil del usuario
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', userId)
    .single()

  if (profileError || !profile) {
    return { error: 'Perfil no encontrado', status: 401 } as const
  }

  return { supabase, profile, userId, isAdmin: profile.role === 'admin' } as const
}

export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireAuth(request)
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status })
    }

    // Usar cliente admin para evitar problemas con RLS al cargar perfiles de otros usuarios
    const adminClient = getSupabaseAdmin()
    if (!adminClient) {
      return NextResponse.json({ 
        error: 'Error de configuración del servidor.',
        details: 'No se pudo obtener el cliente admin.'
      }, { status: 500 })
    }

    // Cargar atenciones con el cliente admin para evitar problemas de RLS
    // Especificar explícitamente la relación profesional_id para evitar ambigüedad
    const { data, error } = await adminClient
      .from('atenciones')
      .select(`
        *,
        jovenes (nombres, apellidos),
        tipos_atencion (nombre),
        profesional:profiles!atenciones_profesional_id_fkey (full_name, role)
      `)
      .order('fecha_atencion', { ascending: false })

    // Debug: verificar datos cargados
    if (data && data.length > 0) {
      console.log('Ejemplo de datos cargados:', {
        id: data[0].id,
        profesional_id: data[0].profesional_id,
        profesional: data[0].profesional
      })
    }

    if (error) {
      console.error('Error loading atenciones:', error)
      
      // Si es el error PGRST201, dar un mensaje más específico
      if (error.code === 'PGRST201') {
        console.error('Error PGRST201: Relación ambigua con profiles. Asegúrate de especificar la relación explícitamente.')
        return NextResponse.json({ 
          error: 'Error de configuración en la consulta de atenciones.',
          details: 'Por favor, contacta al administrador. Código: PGRST201',
          code: 'PGRST201'
        }, { status: 500 })
      }
      
      return NextResponse.json({ 
        error: 'No se pudieron cargar las atenciones.',
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      atenciones: data || [],
      success: true 
    })
  } catch (error) {
    console.error('Error loading atenciones:', error)
    return NextResponse.json({ 
      error: 'Error al cargar las atenciones.',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

