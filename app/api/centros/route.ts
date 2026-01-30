// app/api/centros/route.ts
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

    const { supabase, isAdmin } = authCheck

    // Intentar cargar centros usando el cliente con sesión
    const { data, error } = await supabase
      .from('centros')
      .select('*')
      .order('nombre', { ascending: true })

    if (error) {
      console.error('Error loading centros:', error)
      
      // Si hay un error de permisos y es admin, intentar con el cliente admin
      if ((error.code === 'PGRST301' || error.message?.includes('permission denied') || error.message?.includes('row-level security')) && isAdmin) {
        const adminClient = getSupabaseAdmin()
        
        if (adminClient) {
          console.log('Intentando cargar centros con cliente admin...')
          const { data: adminData, error: adminError } = await adminClient
            .from('centros')
            .select('*')
            .order('nombre', { ascending: true })

          if (adminError) {
            console.error('Error loading with admin client:', adminError)
            return NextResponse.json({ 
              error: 'No se pudieron cargar los centros.',
              details: adminError.message 
            }, { status: 500 })
          }

          return NextResponse.json({ 
            centros: adminData || [],
            success: true 
          })
        }
      }

      // Si no es admin o no se pudo usar el cliente admin, retornar error
      return NextResponse.json({ 
        error: 'No se pudieron cargar los centros.',
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      centros: data || [],
      success: true 
    })
  } catch (error) {
    console.error('Error loading centros:', error)
    return NextResponse.json({ 
      error: 'Error al cargar los centros.',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

