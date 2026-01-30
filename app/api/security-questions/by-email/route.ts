import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

// GET - Obtener preguntas de un usuario por email (sin respuestas, para recuperación)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json({ error: 'Email es requerido' }, { status: 400 })
    }

    const adminClient = getSupabaseAdmin()
    if (!adminClient) {
      return NextResponse.json({ error: 'Error de configuración del servidor' }, { status: 500 })
    }

    // Buscar usuario por email
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle()

    if (profileError || !profile) {
      // Por seguridad, no revelamos si el email existe
      return NextResponse.json({ questions: [] })
    }

    // Obtener preguntas (sin respuestas)
    const { data: questions, error: questionsError } = await adminClient
      .from('security_questions')
      .select('question, question_order')
      .eq('user_id', profile.id)
      .order('question_order', { ascending: true })

    if (questionsError) {
      console.error('Error fetching questions:', questionsError)
      return NextResponse.json({ questions: [] })
    }

    return NextResponse.json({ questions: questions || [] })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ questions: [] })
  }
}

