import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { hashSecurityAnswer } from '@/lib/security-questions'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

// GET - Obtener preguntas del usuario (sin respuestas)
export async function GET(_request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies: () => cookies() })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('security_questions')
      .select('id, question, question_order, created_at')
      .eq('user_id', user.id)
      .order('question_order', { ascending: true })

    if (error) {
      console.error('Error fetching security questions:', error)
      return NextResponse.json({ error: 'Error al obtener preguntas' }, { status: 500 })
    }

    return NextResponse.json({ questions: data || [] })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Error inesperado' }, { status: 500 })
  }
}

// POST - Crear o actualizar preguntas secretas
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies: () => cookies() })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { questions } = body

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: 'Debe proporcionar al menos una pregunta' }, { status: 400 })
    }

    if (questions.length > 3) {
      return NextResponse.json({ error: 'Máximo 3 preguntas permitidas' }, { status: 400 })
    }

    // Validar y preparar preguntas
    const questionsToInsert = questions.map((q: any, index: number) => {
      if (!q.question || !q.answer) {
        throw new Error(`La pregunta ${index + 1} debe tener pregunta y respuesta`)
      }
      if (q.answer.trim().length < 3) {
        throw new Error(`La respuesta ${index + 1} debe tener al menos 3 caracteres`)
      }
      return {
        user_id: user.id,
        question: q.question.trim(),
        answer_hash: hashSecurityAnswer(q.answer),
        question_order: index + 1,
      }
    })

    const adminClient = getSupabaseAdmin()
    if (!adminClient) {
      return NextResponse.json({ error: 'Error de configuración del servidor' }, { status: 500 })
    }

    // Eliminar preguntas existentes del usuario
    await adminClient
      .from('security_questions')
      .delete()
      .eq('user_id', user.id)

    // Insertar nuevas preguntas
    const { data, error } = await adminClient
      .from('security_questions')
      .insert(questionsToInsert)
      .select('id, question, question_order')

    if (error) {
      console.error('Error saving security questions:', error)
      return NextResponse.json({ error: 'Error al guardar preguntas' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      questions: data,
      message: 'Preguntas secretas guardadas correctamente' 
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Error inesperado' 
    }, { status: 500 })
  }
}

