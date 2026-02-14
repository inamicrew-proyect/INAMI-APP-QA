import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { hashSecurityAnswer } from '@/lib/security-questions'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

// Reglas (ajusta si tu licenciada dio otros valores)
const MIN_Q = 5
const MAX_Q = 150
const MIN_A = 3
const MAX_A = 30

const normalize = (s: unknown) => (typeof s === 'string' ? s.trim() : '')

const hasDuplicates = (arr: string[]) => {
  const clean = arr.filter(Boolean)
  return new Set(clean).size !== clean.length
}

// ✅ Solo letras (con tildes/ñ) y espacios
const SOLO_LETRAS_Y_ESPACIOS = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/

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
      return NextResponse.json({ error: 'Debe proporcionar las 3 preguntas secretas' }, { status: 400 })
    }

    // ✅ Deben ser exactamente 3
    if (questions.length !== 3) {
      return NextResponse.json({ error: 'Debe configurar las 3 preguntas secretas' }, { status: 400 })
    }

    // Normalizar
    const normalizedQuestions = questions.map((q: any) => ({
      question: normalize(q?.question),
      answer: normalize(q?.answer),
    }))

    // Validar existencia
    if (normalizedQuestions.some(q => !q.question || !q.answer)) {
      return NextResponse.json(
        { error: 'Cada pregunta debe tener pregunta y respuesta' },
        { status: 400 }
      )
    }

    // Validar tamaños de preguntas
    if (normalizedQuestions.some(q => q.question.length < MIN_Q || q.question.length > MAX_Q)) {
      return NextResponse.json(
        { error: `Cada pregunta debe tener entre ${MIN_Q} y ${MAX_Q} caracteres` },
        { status: 400 }
      )
    }

    // Validar tamaños de respuestas
    if (normalizedQuestions.some(q => q.answer.length < MIN_A || q.answer.length > MAX_A)) {
      return NextResponse.json(
        { error: `Cada respuesta debe tener entre ${MIN_A} y ${MAX_A} caracteres` },
        { status: 400 }
      )
    }

    // ✅ Respuestas: solo letras y espacios (sin números ni símbolos)
    if (normalizedQuestions.some(q => !SOLO_LETRAS_Y_ESPACIOS.test(q.answer))) {
      return NextResponse.json(
        { error: 'Las respuestas solo pueden contener letras y espacios (sin números ni símbolos)' },
        { status: 400 }
      )
    }

    // No permitir preguntas duplicadas
    const questionKeys = normalizedQuestions.map(q => q.question.toLowerCase())
    if (hasDuplicates(questionKeys)) {
      return NextResponse.json({ error: 'No puede repetir preguntas' }, { status: 400 })
    }

    // No permitir respuestas duplicadas
    const answerKeys = normalizedQuestions.map(q => q.answer.toLowerCase())
    if (hasDuplicates(answerKeys)) {
      return NextResponse.json({ error: 'No puede repetir respuestas' }, { status: 400 })
    }

    // Preparar preguntas (MISMA lógica que ya tenías)
    const questionsToInsert = normalizedQuestions.map((q, index: number) => {
      return {
        user_id: user.id,
        question: q.question,
        answer_hash: hashSecurityAnswer(q.answer),
        question_order: index + 1,
      }
    })

    const adminClient = getSupabaseAdmin()
    if (!adminClient) {
      return NextResponse.json({ error: 'Error de configuración del servidor' }, { status: 500 })
    }

    // Eliminar preguntas existentes del usuario
    const { error: deleteError } = await adminClient
      .from('security_questions')
      .delete()
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error deleting security questions:', deleteError)
      return NextResponse.json({ error: 'Error al actualizar preguntas' }, { status: 500 })
    }

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
