import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

export async function GET(_request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies: () => cookies() })
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error || !session) {
      return NextResponse.json({ email: null, error: 'No hay sesión activa' }, { status: 401 })
    }

    // Obtener el email del usuario desde el perfil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', session.user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ email: session.user.email || null }, { status: 200 })
    }

    return NextResponse.json({ email: profile.email })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ email: null, error: 'Error inesperado' }, { status: 500 })
  }
}

