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

  // Verificar si es admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', session.user.id)
    .single()

  const isAdmin = profile?.role === 'admin'

  return { supabase, session, isAdmin } as const
}

export async function GET(request: NextRequest) {
  const authCheck = await requireAuth(request)
  if ('error' in authCheck) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status })
  }

  const { supabase, isAdmin } = authCheck

  try {
    // Intentar primero con el cliente con sesión
    let { data, error } = await supabase
      .from('jovenes')
      .select('*, centros(*)')
      .order('created_at', { ascending: false })

    // Si hay un error de permisos y es admin, intentar con el cliente admin
    if (error && (error.code === 'PGRST301' || error.message?.includes('permission denied') || error.message?.includes('row-level security')) && isAdmin) {
      const { getSupabaseAdmin } = await import('@/lib/supabase-admin')
      const adminClient = getSupabaseAdmin()
      
      if (adminClient) {
        console.log('Cargando jóvenes con cliente admin (usuario es admin)')
        const adminResult = await adminClient
          .from('jovenes')
          .select('*, centros(*)')
          .order('created_at', { ascending: false })

        if (adminResult.error) {
          console.error('Error listing jovenes with admin client:', adminResult.error)
          return NextResponse.json({ error: 'No se pudieron cargar los jóvenes.' }, { status: 500 })
        }

        return NextResponse.json({ success: true, jovenes: adminResult.data ?? [] })
      }
    }

    if (error) {
      console.error('Error listing jovenes:', error)
      return NextResponse.json({ error: 'No se pudieron cargar los jóvenes.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, jovenes: data ?? [] })
  } catch (error) {
    console.error('Unexpected error fetching jovenes:', error)
    return NextResponse.json({ error: 'Error inesperado al obtener los jóvenes.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireAuth(request)
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status })
    }

    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }

    const { supabase } = authCheck

    // Validar que los campos requeridos estén presentes
    if (!body.nombres || !body.apellidos || !body.fecha_nacimiento || !body.centro_id || !body.fecha_ingreso) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    // Calcular edad
    const fechaNacimiento = new Date(body.fecha_nacimiento)
    const hoy = new Date()
    let edad = hoy.getFullYear() - fechaNacimiento.getFullYear()
    const mes = hoy.getMonth() - fechaNacimiento.getMonth()
    if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNacimiento.getDate())) {
      edad--
    }

    // Usar cliente admin si está disponible para evitar problemas de RLS
    const adminClient = getSupabaseAdmin()
    
    const insertData = {
      nombres: body.nombres,
      apellidos: body.apellidos,
      fecha_nacimiento: body.fecha_nacimiento,
      edad,
      identidad: body.identidad || null,
      sexo: body.sexo || 'Masculino',
      direccion: body.direccion || null,
      telefono: body.telefono || null,
      nombre_contacto_emergencia: body.nombre_contacto_emergencia || null,
      telefono_emergencia: body.telefono_emergencia || null,
      centro_id: body.centro_id,
      fecha_ingreso: body.fecha_ingreso,
      medida_aplicada: body.medida_aplicada || null,
      delito_infraccion: body.delito_infraccion || null,
      observaciones: body.observaciones || null,
      estado: body.estado || 'activo'
    }

    if (adminClient) {
      console.log('Creando joven con cliente admin')
      const { data, error } = await adminClient
        .from('jovenes')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        console.error('Error creating joven with admin client:', error)
        return NextResponse.json({ 
          error: 'No se pudo crear el joven.',
          details: error.message 
        }, { status: 500 })
      }

      return NextResponse.json({ success: true, data })
    }

    // Si no hay cliente admin, usar el cliente con sesión
    const { data, error } = await supabase
      .from('jovenes')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Error creating joven:', error)
      return NextResponse.json({ 
        error: 'No se pudo crear el joven.',
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error creating joven:', error)
    return NextResponse.json({ 
      error: 'Error al crear el joven.',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}