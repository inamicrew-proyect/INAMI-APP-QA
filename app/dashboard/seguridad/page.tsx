// app/dashboard/seguridad/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, ShieldAlert, Shield } from 'lucide-react'

export default function SeguridadPage() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [factorId, setFactorId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [mfaEnabled, setMfaEnabled] = useState(false)
  const [checkingStatus, setCheckingStatus] = useState(true)

  // Verificar el estado de 2FA al cargar la página
  useEffect(() => {
    const checkMfaStatus = async () => {
      try {
        setCheckingStatus(true)
        const { data: factors, error: factorError } = await supabase.auth.mfa.listFactors()
        
        if (factorError) {
          console.error('Error verificando estado de 2FA:', factorError)
          setCheckingStatus(false)
          return
        }

        // Verificar si hay un factor TOTP verificado
        const hasVerifiedTotp = factors?.all?.some(
          (factor) => factor.factor_type === 'totp' && factor.status === 'verified'
        ) ?? false

        setMfaEnabled(hasVerifiedTotp)
      } catch (err) {
        console.error('Error inesperado verificando 2FA:', err)
      } finally {
        setCheckingStatus(false)
      }
    }

    checkMfaStatus()
  }, [supabase])

  // 1. Iniciar el "Enrollment" (Generar el QR)
  const handleEnableMFA = async () => {
    setError(null)
    setSuccess(null)
    setLoading(true)

    // --- ¡ESTA ES LA CORRECCIÓN IMPORTANTE! ---
    // Le decimos a Supabase que queremos un factor de tipo 'totp'
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
    });
    // --- FIN DE LA CORRECCIÓN ---
    
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }

    // Verificamos que sea 'totp'
    if (data.type === 'totp') {
      setFactorId(data.id) // Guardamos el ID del factor
      setQrCode(data.totp.qr_code) // Guardamos el QR (que es un string SVG)
    } else {
      setError('Error: Se recibió un tipo de factor inesperado: ' + data.type)
    }
  }

  // 2. Verificar el código
  const handleVerifyMFA = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    const code = e.currentTarget.code.value
    if (!factorId || !code) {
      setLoading(false)
      return
    }

    // Esta función verifica el código y activa MFA para el usuario
    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code,
    })

    setLoading(false)
    if (error) {
      setError("Código inválido. Inténtalo de nuevo.")
    } else {
      setSuccess('¡Autenticación de 2 Factores activada exitosamente!')
      setQrCode(null) // Ocultar el formulario
      setFactorId(null)
      setMfaEnabled(true) // Actualizar el estado
      // Refrescar después de un breve delay para que el usuario vea el mensaje
      setTimeout(() => {
        router.refresh()
      }, 2000)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-4">
        <ArrowLeft className="w-4 h-4" />
        Volver al Dashboard
      </Link>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Seguridad</h1>
      
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Autenticación de Dos Factores (2FA)
        </h2>
        
        {checkingStatus ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Verificando estado de 2FA...</p>
          </div>
        ) : mfaEnabled ? (
          // Usuario ya tiene 2FA activado
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-green-800 mb-1">2FA Activado</p>
                <p className="text-sm text-green-700">
                  Tu cuenta está protegida con autenticación de dos factores. Se te pedirá un código cada vez que inicies sesión.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Mensaje de éxito */}
            {success && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-800">{success}</p>
              </div>
            )}

            {/* Mensaje de error */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Botón para activar */}
            {!qrCode && !success && (
              <>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Protege tu cuenta añadiendo una capa adicional de seguridad. Se te pedirá un código de tu app de autenticación (como Google Authenticator) cada vez que inicies sesión.
                </p>
                <button 
                  onClick={handleEnableMFA} 
                  disabled={loading}
                  className="btn-primary disabled:opacity-50"
                >
                  {loading ? 'Generando...' : 'Activar 2FA'}
                </button>
              </>
            )}
          </>
        )}

        {/* Formulario para verificar el QR */}
        {qrCode && (
          <div className="mt-4">
            <p className="mb-2 font-semibold">1. Escanea este código QR con tu app de autenticación:</p>
            
            <div 
              className="p-4 bg-white rounded-lg inline-block border border-gray-200"
              dangerouslySetInnerHTML={{ __html: qrCode }} 
            />
            
            <p className="mt-4 mb-2 font-semibold">2. Ingresa el código de 6 dígitos que genera tu app:</p>
            
            <form onSubmit={handleVerifyMFA} className="flex flex-col sm:flex-row gap-2">
              <input 
                type="text" 
                id="code" 
                name="code" 
                maxLength={6} 
                required 
                className="input-field flex-1 text-center tracking-[0.2em]"
                placeholder="123456"
                inputMode="numeric"
                pattern="[0-9]{6}"
              />
              <button 
                type="submit" 
                disabled={loading} 
                className="btn-secondary"
              >
                {loading ? 'Verificando...' : 'Verificar y Activar'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}