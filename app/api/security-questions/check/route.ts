import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

// GET - Verificar si el usuario tiene preguntas secretas configuradas
export async function GET(_request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies: () => cookies() })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ hasQuestions: false, error: 'No autenticado' }, { status: 401 })
    }

    const { error, count } = await supabase
      .from('security_questions')
      .select('id', { count: 'exact', head: false })
      .eq('user_id', user.id)

    if (error) {
      console.error('Error checking security questions:', error)
      // Si hay error, asumir que no tiene preguntas (más seguro)
      return NextResponse.json({ hasQuestions: false })
    }

    const hasQuestions = (count ?? 0) > 0

    return NextResponse.json({ hasQuestions })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ hasQuestions: false })
  }
}

