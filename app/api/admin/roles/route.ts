import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

async function requireAdmin() {
  const supabase = createRouteHandlerClient({ cookies: () => cookies() })
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return { error: 'No autenticado', status: 401 } as const
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return { error: 'No autorizado', status: 403 } as const
  }

  return { supabase, userId: session.user.id } as const
}

// GET: Obtener todos los roles
export async function GET(_request: NextRequest) {
  try {
    const adminCheck = await requireAdmin()
    if ('error' in adminCheck) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status })
    }

    const { supabase } = adminCheck

    const { data: roles, error } = await supabase
      .from('roles')
      .select('*')
      .order('nombre', { ascending: true })

    if (error) {
      console.error('Error fetching roles:', error)
      return NextResponse.json({ error: 'Error al obtener roles' }, { status: 500 })
    }

    return NextResponse.json({ roles })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Error inesperado' }, { status: 500 })
  }
}

// POST: Crear un nuevo rol
export async function POST(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin()
    if ('error' in adminCheck) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status })
    }

    const body = await request.json()
    const { nombre, descripcion } = body

    if (!nombre) {
      return NextResponse.json({ error: 'El nombre del rol es requerido' }, { status: 400 })
    }

    const adminClient = getSupabaseAdmin()
    if (!adminClient) {
      return NextResponse.json({ error: 'Error de configuración del servidor' }, { status: 500 })
    }

    const { data: rol, error } = await adminClient
      .from('roles')
      .insert({
        nombre,
        descripcion: descripcion || null,
        activo: true,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating role:', error)
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Ya existe un rol con ese nombre' }, { status: 400 })
      }
      return NextResponse.json({ error: 'Error al crear rol' }, { status: 500 })
    }

    return NextResponse.json({ rol })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Error inesperado' }, { status: 500 })
  }
}

// PUT: Actualizar un rol
export async function PUT(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin()
    if ('error' in adminCheck) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status })
    }

    const body = await request.json()
    const { id, nombre, descripcion, activo } = body

    if (!id) {
      return NextResponse.json({ error: 'El ID del rol es requerido' }, { status: 400 })
    }

    const adminClient = getSupabaseAdmin()
    if (!adminClient) {
      return NextResponse.json({ error: 'Error de configuración del servidor' }, { status: 500 })
    }

    const updateData: any = {}
    if (nombre !== undefined) updateData.nombre = nombre
    if (descripcion !== undefined) updateData.descripcion = descripcion
    if (activo !== undefined) updateData.activo = activo

    const { data: rol, error } = await adminClient
      .from('roles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating role:', error)
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Ya existe un rol con ese nombre' }, { status: 400 })
      }
      return NextResponse.json({ error: 'Error al actualizar rol' }, { status: 500 })
    }

    return NextResponse.json({ rol })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Error inesperado' }, { status: 500 })
  }
}

// DELETE: Eliminar un rol
export async function DELETE(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin()
    if ('error' in adminCheck) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'El ID del rol es requerido' }, { status: 400 })
    }

    const adminClient = getSupabaseAdmin()
    if (!adminClient) {
      return NextResponse.json({ error: 'Error de configuración del servidor' }, { status: 500 })
    }

    // Verificar si hay usuarios con este rol asignado
    const { data: userRoles, error: checkError } = await adminClient
      .from('user_roles')
      .select('id')
      .eq('role_id', id)
      .limit(1)

    if (checkError) {
      console.error('Error checking user roles:', checkError)
      return NextResponse.json({ error: 'Error al verificar asignaciones de rol' }, { status: 500 })
    }

    if (userRoles && userRoles.length > 0) {
      return NextResponse.json({ 
        error: 'No se puede eliminar el rol porque hay usuarios asignados a él' 
      }, { status: 400 })
    }

    const { error } = await adminClient
      .from('roles')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting role:', error)
      return NextResponse.json({ error: 'Error al eliminar rol' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Error inesperado' }, { status: 500 })
  }
}

