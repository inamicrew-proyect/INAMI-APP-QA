import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseRouteHandlerClient } from '@/lib/supabase-route-handler'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

async function requireAuth(_request: NextRequest) {
  const supabase = await createSupabaseRouteHandlerClient()
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

  return { supabase, session, isAdmin, userId: session.user.id } as const
}

export async function GET(request: NextRequest) {
  const authCheck = await requireAuth(request)
  if ('error' in authCheck) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status })
  }

  const { supabase, isAdmin } = authCheck

  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100') // Límite por defecto
    const offset = parseInt(searchParams.get('offset') || '0')
    
    // Intentar primero con el cliente con sesión
    let query = supabase
      .from('jovenes')
      .select('*, centros(*)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    let { data, error, count } = await query

    // Si hay un error de permisos y es admin, intentar con el cliente admin
    if (error && (error.code === 'PGRST301' || error.message?.includes('permission denied') || error.message?.includes('row-level security')) && isAdmin) {
      const { getSupabaseAdmin } = await import('@/lib/supabase-admin')
      const adminClient = getSupabaseAdmin()
      
      if (adminClient) {
        console.log('Cargando jóvenes con cliente admin (usuario es admin)')
        const adminQuery = adminClient
          .from('jovenes')
          .select('*, centros(*)', { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1)
        
        const adminResult = await adminQuery

        if (adminResult.error) {
          console.error('Error listing jovenes with admin client:', adminResult.error)
          return NextResponse.json({ error: 'No se pudieron cargar los jóvenes.' }, { status: 500 })
        }

        return NextResponse.json({ 
          success: true, 
          jovenes: adminResult.data ?? [],
          total: adminResult.count ?? 0,
          limit,
          offset
        })
      }
    }

    if (error) {
      console.error('Error listing jovenes:', error)
      return NextResponse.json({ error: 'No se pudieron cargar los jóvenes.' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      jovenes: data ?? [],
      total: count ?? 0,
      limit,
      offset
    })
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
    if (
      !body.nombres ||
      !body.apellidos ||
      !body.fecha_nacimiento ||
      !body.centro_id ||
      !body.fecha_ingreso ||
      !body.direccion ||
      !body.telefono ||
      !body.nombre_contacto_emergencia
    ) {
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

      // Registrar log de creación
      try {
        const ipAddress = request.headers.get('x-forwarded-for') || 
                         request.headers.get('x-real-ip') || 
                         'unknown'
        const userAgent = request.headers.get('user-agent') || 'unknown'

        await adminClient
          .from('system_logs')
          .insert({
            usuario_id: authCheck.session.user.id,
            accion: 'create_joven',
            entidad: 'jovenes',
            entidad_id: data.id,
            detalles: {
              nombres: data.nombres,
              apellidos: data.apellidos,
              identidad: data.identidad,
              created_by: authCheck.session.user.id,
            },
            ip_address: ipAddress,
            user_agent: userAgent,
          })
      } catch (logError) {
        console.error('Error registrando log de creación de joven:', logError)
        // No fallar la operación si el log falla
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

    // Registrar log de creación
    try {
      const adminClient = getSupabaseAdmin()
      if (adminClient) {
        const ipAddress = request.headers.get('x-forwarded-for') || 
                         request.headers.get('x-real-ip') || 
                         'unknown'
        const userAgent = request.headers.get('user-agent') || 'unknown'

        await adminClient
          .from('system_logs')
          .insert({
            usuario_id: authCheck.session.user.id,
            accion: 'create_joven',
            entidad: 'jovenes',
            entidad_id: data.id,
            detalles: {
              nombres: data.nombres,
              apellidos: data.apellidos,
              identidad: data.identidad,
              created_by: authCheck.session.user.id,
            },
            ip_address: ipAddress,
            user_agent: userAgent,
          })
      }
    } catch (logError) {
      console.error('Error registrando log de creación de joven:', logError)
      // No fallar la operación si el log falla
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