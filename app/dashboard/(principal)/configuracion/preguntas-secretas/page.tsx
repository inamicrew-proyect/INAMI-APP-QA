'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@/lib/supabase-browser'
import { PREDEFINED_QUESTIONS } from '@/lib/security-questions'
import { Shield, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function SecurityQuestionsPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [questions, setQuestions] = useState([
    { question: '', answer: '', usePredefined: false },
    { question: '', answer: '', usePredefined: false },
    { question: '', answer: '', usePredefined: false },
  ])

  const [isRequired, setIsRequired] = useState(false)

  useEffect(() => {
    loadExistingQuestions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Reglas
  const MIN_Q = 5
  const MAX_Q = 150
  const MIN_A = 3
  const MAX_A = 30

  // ✅ Solo letras (con tildes/ñ) y espacios
  const SOLO_LETRAS_Y_ESPACIOS = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/

  const loadExistingQuestions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const checkResponse = await fetch('/api/security-questions/check')
      const checkResult = await checkResponse.json()

      setIsRequired(!checkResult.hasQuestions)

      const response = await fetch('/api/security-questions')
      const result = await response.json()

      if (response.ok && result.questions) {
        const existingQuestions = result.questions
        const newQuestions = [...questions]

        existingQuestions.forEach((q: any, index: number) => {
          if (newQuestions[index]) {
            newQuestions[index].question = q.question
          }
        })

        setQuestions(newQuestions)
      }
    } catch (error) {
      console.error('Error loading questions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleQuestionChange = (index: number, value: string) => {
    const newQuestions = [...questions]
    newQuestions[index].question = value
    newQuestions[index].usePredefined = false
    setQuestions(newQuestions)
  }

  const handlePredefinedQuestion = (index: number, question: string) => {
    const newQuestions = [...questions]
    newQuestions[index].question = question
    newQuestions[index].usePredefined = true
    setQuestions(newQuestions)
  }

  const handleAnswerChange = (index: number, value: string) => {
    const newQuestions = [...questions]
    newQuestions[index].answer = value
    setQuestions(newQuestions)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    // Normalizar y filtrar preguntas completas
    const validQuestions = questions
      .map(q => ({ question: q.question.trim(), answer: q.answer.trim() }))
      .filter(q => q.question && q.answer)

    // ✅ OBLIGATORIO: deben ser 3
    if (validQuestions.length !== 3) {
      setError('Debe configurar las 3 preguntas secretas para continuar')
      return
    }

    // Validar tamaños de preguntas
    if (validQuestions.some(q => q.question.length < MIN_Q || q.question.length > MAX_Q)) {
      setError(`Cada pregunta debe tener entre ${MIN_Q} y ${MAX_Q} caracteres`)
      return
    }

    // Validar tamaños de respuestas
    if (validQuestions.some(q => q.answer.length < MIN_A || q.answer.length > MAX_A)) {
      setError(`Cada respuesta debe tener entre ${MIN_A} y ${MAX_A} caracteres`)
      return
    }

    // ✅ Respuestas: solo letras y espacios (sin números ni símbolos)
    if (validQuestions.some(q => !SOLO_LETRAS_Y_ESPACIOS.test(q.answer))) {
      setError('Las respuestas solo pueden contener letras y espacios (sin números ni símbolos)')
      return
    }

    // No permitir preguntas duplicadas
    const normalizedQuestions = validQuestions.map(q => q.question.toLowerCase())
    if (new Set(normalizedQuestions).size !== normalizedQuestions.length) {
      setError('No puede repetir preguntas')
      return
    }

    // No permitir respuestas duplicadas
    const normalizedAnswers = validQuestions.map(q => q.answer.toLowerCase())
    if (new Set(normalizedAnswers).size !== normalizedAnswers.length) {
      setError('No puede repetir respuestas')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/security-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questions: validQuestions.map(q => ({
            question: q.question.trim(),
            answer: q.answer.trim(),
          })),
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Error al guardar preguntas')
        return
      }

      setSuccess('Preguntas secretas guardadas correctamente')
      setIsRequired(false)
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)
    } catch (error) {
      setError('Error inesperado al guardar')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="card text-center">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {!isRequired && (
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Dashboard
        </Link>
      )}

      <div className="card space-y-6">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary-100 rounded-lg">
            <Shield className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Preguntas Secretas</h1>
            {isRequired ? (
              <div className="mt-2">
                <p className="text-sm font-semibold text-red-600 mb-1">⚠️ Configuración Obligatoria</p>
                <p className="text-sm text-gray-600">
                  Debe configurar sus preguntas secretas antes de continuar. Estas preguntas le permitirán recuperar su contraseña de forma segura.
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-600 mt-1">
                Configure preguntas secretas para recuperar su contraseña de forma segura. Puede configurar hasta 3 preguntas.
              </p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {questions.map((q, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pregunta {index + 1} {index === 0 && '(Requerida)'}
                </label>
                <input
                  type="text"
                  value={q.question}
                  onChange={(e) => handleQuestionChange(index, e.target.value)}
                  className="input-field"
                  placeholder="Escriba su pregunta o seleccione una predefinida"
                  required
                  minLength={MIN_Q}
                  maxLength={MAX_Q}
                />
                <div className="mt-2">
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handlePredefinedQuestion(index, e.target.value)
                      }
                    }}
                    className="input-field text-sm"
                    value=""
                  >
                    <option value="">Seleccionar pregunta predefinida...</option>
                    {PREDEFINED_QUESTIONS.map((predefined, i) => (
                      <option key={i} value={predefined}>
                        {predefined}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Respuesta {index === 0 && '(Requerida)'}
                </label>
                <input
                  type="text"
                  value={q.answer}
                  onChange={(e) => handleAnswerChange(index, e.target.value)}
                  className="input-field"
                  placeholder="Su respuesta"
                  required
                  minLength={MIN_A}
                  maxLength={MAX_A}
                />
                <p className="text-xs text-gray-500 mt-1">La respuesta se guardará de forma segura (hasheada)</p>
              </div>
            </div>
          ))}

          {error && (
            <div className="p-4 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="p-4 rounded-lg border border-green-200 bg-green-50 text-sm text-green-700">
              {success}
            </div>
          )}

          <div className="flex justify-end gap-3">
            {!isRequired && (
              <Link href="/dashboard" className="btn-secondary">
                Cancelar
              </Link>
            )}
            <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
              {saving ? 'Guardando...' : isRequired ? 'Guardar y Continuar' : 'Guardar Preguntas'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

