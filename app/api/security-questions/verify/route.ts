import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { verifySecurityAnswer } from '@/lib/security-questions'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

// POST - Verificar respuestas de preguntas secretas (para recuperación)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, answers } = body

    if (!email || !answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: 'Email y respuestas son requeridos' }, { status: 400 })
    }

    const adminClient = getSupabaseAdmin()
    if (!adminClient) {
      return NextResponse.json({ error: 'Error de configuración del servidor' }, { status: 500 })
    }

    // Buscar usuario por email
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('id, email')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle()

    if (profileError || !profile) {
      // Por seguridad, no revelamos si el email existe o no
      return NextResponse.json({ error: 'Email o respuestas incorrectas' }, { status: 401 })
    }

    // Obtener preguntas del usuario
    const { data: questions, error: questionsError } = await adminClient
      .from('security_questions')
      .select('id, question, answer_hash, question_order')
      .eq('user_id', profile.id)
      .order('question_order', { ascending: true })

    if (questionsError || !questions || questions.length === 0) {
      return NextResponse.json({ 
        error: 'Este usuario no tiene preguntas secretas configuradas. Use el método de recuperación por email.' 
      }, { status: 400 })
    }

    if (answers.length !== questions.length) {
      return NextResponse.json({ error: 'Debe responder todas las preguntas' }, { status: 400 })
    }

    // Verificar cada respuesta
    let correctAnswers = 0
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i]
      const userAnswer = answers[i]?.answer || ''
      
      if (verifySecurityAnswer(userAnswer, question.answer_hash)) {
        correctAnswers++
      }
    }

    // Requerir que todas las respuestas sean correctas
    if (correctAnswers !== questions.length) {
      return NextResponse.json({ error: 'Una o más respuestas son incorrectas' }, { status: 401 })
    }

    // Si todas las respuestas son correctas, retornar éxito
    return NextResponse.json({ 
      success: true,
      userId: profile.id,
      message: 'Respuestas verificadas correctamente. Puede proceder a cambiar su contraseña.'
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Error inesperado' }, { status: 500 })
  }
}

