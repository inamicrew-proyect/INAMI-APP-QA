'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Shield, Lock, CheckCircle } from 'lucide-react'

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''

  const [step, setStep] = useState<'questions' | 'reset'>('questions')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [hasSession, setHasSession] = useState(false)
  const [userEmail, setUserEmail] = useState<string>('')
  
  // Estado para preguntas
  const [userQuestions, setUserQuestions] = useState<{question: string, order: number}[]>([])
  const [answers, setAnswers] = useState<string[]>([])
  
  // Estado para nueva contraseña
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    // Si hay email en la URL, usarlo
    if (email) {
      setUserEmail(email)
      if (step === 'questions') {
        fetchUserQuestions()
      }
    } else {
      // Si no hay email, verificar si tiene sesión (viene del callback)
      checkSessionAndGetEmail()
    }
  }, [email, step])

  const checkSessionAndGetEmail = async () => {
    try {
      // Verificar si hay sesión activa (viene del callback)
      const response = await fetch('/api/auth/session')
      const result = await response.json()
      
      if (response.ok && result.email) {
        setHasSession(true)
        setUserEmail(result.email)
        
        // Si tiene sesión, verificar si tiene preguntas secretas
        const questionsResponse = await fetch(`/api/security-questions/by-email?email=${encodeURIComponent(result.email)}`)
        const questionsResult = await questionsResponse.json()

        if (questionsResponse.ok && questionsResult.questions && questionsResult.questions.length > 0) {
          // Tiene preguntas secretas, mostrar formulario de preguntas
          setUserQuestions(questionsResult.questions)
          setAnswers(new Array(questionsResult.questions.length).fill(''))
          setStep('questions')
        } else {
          // No tiene preguntas secretas, ir directo a cambiar contraseña (ya tiene sesión)
          setStep('reset')
        }
      } else {
        // No hay sesión, mostrar error
        setError('Sesión no válida. Por favor, solicite un nuevo enlace de recuperación.')
      }
    } catch (error) {
      console.error('Error checking session:', error)
      setError('Error al verificar sesión')
    }
  }

  const fetchUserQuestions = async () => {
    try {
      const response = await fetch(`/api/security-questions/by-email?email=${encodeURIComponent(email)}`)
      const result = await response.json()

      if (response.ok && result.questions && result.questions.length > 0) {
        setUserQuestions(result.questions)
        setAnswers(new Array(result.questions.length).fill(''))
      } else {
        setError('Este usuario no tiene preguntas secretas configuradas. Use el método de recuperación por email.')
      }
    } catch (error) {
      setError('Error al cargar preguntas')
    }
  }

  const handleAnswerChange = (index: number, value: string) => {
    const newAnswers = [...answers]
    newAnswers[index] = value
    setAnswers(newAnswers)
  }

  const handleVerifyAnswers = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (answers.some(a => !a.trim())) {
      setError('Por favor responda todas las preguntas')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/security-questions/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          answers: answers.map(answer => ({ answer }))
        })
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Error al verificar respuestas')
        setLoading(false)
        return
      }

      setStep('reset')
      setSuccess('Respuestas correctas. Ahora puede cambiar su contraseña.')
    } catch (error) {
      setError('Error inesperado')
      setLoading(false)
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (newPassword.length < 10) {
      setError('La contraseña debe tener al menos 10 caracteres')
      return
    }

    if (!/[A-Z]/.test(newPassword)) {
      setError('La contraseña debe incluir al menos una letra mayúscula')
      return
    }

    if (!/[a-z]/.test(newPassword)) {
      setError('La contraseña debe incluir al menos una letra minúscula')
      return
    }

    if (!/\d/.test(newPassword)) {
      setError('La contraseña debe incluir al menos un número')
      return
    }

    if (!/[^A-Za-z0-9]/.test(newPassword)) {
      setError('La contraseña debe incluir al menos un caracter especial')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    setLoading(true)

    try {
      let response
      
      // Si tiene sesión (viene del callback), usar el método directo
      if (hasSession) {
        response = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newPassword })
        })
      } else {
        // Si no tiene sesión, usar el método con preguntas secretas
        if (!userEmail) {
          setError('Email no disponible')
          setLoading(false)
          return
        }
        
        response = await fetch('/api/security-questions/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: userEmail,
            answers: answers.map(answer => ({ answer })),
            newPassword
          })
        })
      }

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Error al cambiar la contraseña')
        setLoading(false)
        return
      }

      setSuccess('Contraseña cambiada correctamente. Redirigiendo al dashboard...')
      
      // Redirigir al dashboard después de un breve delay
      // No cerramos la sesión porque el usuario ya está autenticado
      setTimeout(() => {
        router.push('/dashboard')
        router.refresh() // Forzar actualización para asegurar que todo esté actualizado
      }, 2000)
    } catch (error) {
      setError('Error inesperado')
      setLoading(false)
    } finally {
      setLoading(false)
    }
  }

  // Si no hay email ni sesión, mostrar error
  if (!userEmail && !hasSession && error && error.includes('Sesión no válida')) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card max-w-md w-full text-center">
          <p className="text-red-600">{error}</p>
          <button onClick={() => router.push('/login')} className="btn-primary mt-4">
            Volver al Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="max-w-md w-full">
        <div className="card space-y-6">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-primary-100 p-3 rounded-full">
                <Shield className="w-8 h-8 text-primary-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              {step === 'questions' ? 'Verificar Identidad' : 'Cambiar Contraseña'}
            </h1>
            <p className="text-sm text-gray-600 mt-2">
              {step === 'questions' 
                ? 'Responda sus preguntas secretas para continuar'
                : 'Ingrese su nueva contraseña'}
            </p>
          </div>

          {error && (
            <div className="p-4 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="p-4 rounded-lg border border-green-200 bg-green-50 text-sm text-green-700 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              {success}
            </div>
          )}

          {step === 'questions' ? (
            <form onSubmit={handleVerifyAnswers} className="space-y-4">
              {userQuestions.map((q, index) => (
                <div key={index}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {q.question}
                  </label>
                  <input
                    type="text"
                    value={answers[index] || ''}
                    onChange={(e) => handleAnswerChange(index, e.target.value)}
                    className="input-field"
                    placeholder="Su respuesta"
                    required
                  />
                </div>
              ))}

              <button
                type="submit"
                disabled={loading || userQuestions.length === 0}
                className="w-full btn-primary disabled:opacity-60"
              >
                {loading ? 'Verificando...' : 'Verificar Respuestas'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input-field pl-10"
                    placeholder="Mínimo 10 caracteres"
                    required
                    minLength={10}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-field pl-10"
                    placeholder="Repita la contraseña"
                    required
                    minLength={10}
                  />
                </div>
              </div>

              <div className="text-xs text-gray-500 space-y-1">
                <p>La contraseña debe tener:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Al menos 10 caracteres</li>
                  <li>Una letra mayúscula</li>
                  <li>Una letra minúscula</li>
                  <li>Un número</li>
                  <li>Un caracter especial</li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary disabled:opacity-60"
              >
                {loading ? 'Cambiando contraseña...' : 'Cambiar Contraseña'}
              </button>
            </form>
          )}

          <div className="text-center">
            <button
              onClick={() => router.push('/login')}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Volver al Login
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="max-w-md w-full">
          <div className="card text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando...</p>
          </div>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}

