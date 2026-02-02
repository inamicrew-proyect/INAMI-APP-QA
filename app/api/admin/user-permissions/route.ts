import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { supabaseCache } from '@/lib/optimization'

// Cache de permisos en memoria (5 minutos)
const PERMISSIONS_CACHE_TTL = 5 * 60 * 1000

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

// GET: Obtener permisos de un usuario basándose en sus roles
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies: () => cookies() })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || session.user.id

    // Verificar caché primero
    const cacheKey = `permissions_${userId}`
    const cached = supabaseCache.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    // Si el usuario solicita permisos de otro usuario, debe ser admin
    if (userId !== session.user.id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (!profile || profile.role !== 'admin') {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }
    }

    const adminClient = getSupabaseAdmin()
    if (!adminClient) {
      return NextResponse.json({ error: 'Error de configuración del servidor' }, { status: 500 })
    }

    // Obtener los roles asignados al usuario
    const { data: userRoles, error: userRolesError } = await adminClient
      .from('user_roles')
      .select('role_id')
      .eq('user_id', userId)

    if (userRolesError) {
      console.error('Error fetching user roles:', userRolesError)
      return NextResponse.json({ error: 'Error al obtener roles del usuario' }, { status: 500 })
    }

    // Si no tiene roles asignados, retornar permisos vacíos
    if (!userRoles || userRoles.length === 0) {
      return NextResponse.json({ permisos: [] })
    }

    const roleIds = userRoles.map(ur => ur.role_id)

    // Obtener permisos de módulos para todos los roles del usuario
    const { data: permisos, error: permisosError } = await adminClient
      .from('role_module_permissions')
      .select(`
        *,
        modulos (
          id,
          nombre,
          descripcion,
          ruta,
          icono
        )
      `)
      .in('role_id', roleIds)

    if (permisosError) {
      console.error('Error fetching permissions:', permisosError)
      return NextResponse.json({ error: 'Error al obtener permisos' }, { status: 500 })
    }

    // Log para depuración
    console.log('User permissions API:', {
      userId,
      roleIds,
      permisosCount: permisos?.length || 0,
      permisos: permisos?.map((p: any) => ({
        modulo: p.modulos?.nombre,
        ruta: p.modulos?.ruta,
        puede_ver: p.puede_ver,
        puede_crear: p.puede_crear,
        puede_editar: p.puede_editar,
        puede_eliminar: p.puede_eliminar,
      }))
    })

    // Agrupar permisos por módulo (si un usuario tiene múltiples roles, usar OR lógico)
    const permisosPorModulo: Record<string, any> = {}
    
    permisos?.forEach((permiso: any) => {
      const moduloId = permiso.modulo_id
      if (!permisosPorModulo[moduloId]) {
        permisosPorModulo[moduloId] = {
          modulo_id: moduloId,
          modulo: permiso.modulos,
          puede_ver: false,
          puede_crear: false,
          puede_editar: false,
          puede_eliminar: false,
        }
      }
      
      // Usar OR lógico: si cualquier rol tiene el permiso, el usuario lo tiene
      permisosPorModulo[moduloId].puede_ver = permisosPorModulo[moduloId].puede_ver || permiso.puede_ver
      permisosPorModulo[moduloId].puede_crear = permisosPorModulo[moduloId].puede_crear || permiso.puede_crear
      permisosPorModulo[moduloId].puede_editar = permisosPorModulo[moduloId].puede_editar || permiso.puede_editar
      permisosPorModulo[moduloId].puede_eliminar = permisosPorModulo[moduloId].puede_eliminar || permiso.puede_eliminar
    })

    const result = { 
      permisos: Object.values(permisosPorModulo),
      roles: roleIds 
    }
    
    // Guardar en caché
    supabaseCache.set(cacheKey, result, PERMISSIONS_CACHE_TTL)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Error inesperado' }, { status: 500 })
  }
}

