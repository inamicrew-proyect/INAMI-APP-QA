import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseRouteHandlerClient } from '@/lib/supabase-route-handler'

export const dynamic = 'force-dynamic'

/**
 * Establece la sesión en cookies a partir de access_token y refresh_token.
 * Usado cuando el enlace de recuperación trae los tokens en el hash (el servidor no los ve)
 * y la página de callback los envía aquí para persistirlos en cookies.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const access_token = body?.access_token
    const refresh_token = body?.refresh_token

    if (!access_token || !refresh_token) {
      return NextResponse.json(
        { error: 'Faltan access_token o refresh_token' },
        { status: 400 }
      )
    }

    const supabase = await createSupabaseRouteHandlerClient()
    const { error } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    })

    if (error) {
      console.error('[set-session] Error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[set-session] Unexpected error:', e)
    return NextResponse.json({ error: 'Error inesperado' }, { status: 500 })
  }
}
