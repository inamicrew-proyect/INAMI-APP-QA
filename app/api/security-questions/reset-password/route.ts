import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { verifySecurityAnswer } from '@/lib/security-questions'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

// POST - Cambiar contraseña después de verificar preguntas secretas
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, answers, newPassword } = body

    if (!email || !answers || !newPassword) {
      return NextResponse.json({ error: 'Email, respuestas y nueva contraseña son requeridos' }, { status: 400 })
    }

    if (newPassword.length < 10) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 10 caracteres' }, { status: 400 })
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
      return NextResponse.json({ error: 'Email o respuestas incorrectas' }, { status: 401 })
    }

    // Obtener y verificar preguntas
    const { data: questions, error: questionsError } = await adminClient
      .from('security_questions')
      .select('id, question, answer_hash, question_order')
      .eq('user_id', profile.id)
      .order('question_order', { ascending: true })

    if (questionsError || !questions || questions.length === 0) {
      return NextResponse.json({ error: 'Preguntas secretas no configuradas' }, { status: 400 })
    }

    if (answers.length !== questions.length) {
      return NextResponse.json({ error: 'Debe responder todas las preguntas' }, { status: 400 })
    }

    // Verificar todas las respuestas
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i]
      const userAnswer = answers[i]?.answer || ''
      
      if (!verifySecurityAnswer(userAnswer, question.answer_hash)) {
        return NextResponse.json({ error: 'Una o más respuestas son incorrectas' }, { status: 401 })
      }
    }

    // Si todas las respuestas son correctas, cambiar la contraseña
    const { error: updateError } = await adminClient.auth.admin.updateUserById(
      profile.id,
      { password: newPassword }
    )

    if (updateError) {
      console.error('Error updating password:', updateError)
      return NextResponse.json({ error: 'Error al cambiar la contraseña' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Contraseña cambiada correctamente'
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Error inesperado' }, { status: 500 })
  }
}

