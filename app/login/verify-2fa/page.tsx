// app/login/verify-2fa/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { Shield } from 'lucide-react'

export default function VerifyMfaPage() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const [factorId, setFactorId] = useState<string | null>(null)

  // 1. OBTENER EL FACTOR ID CUANDO LA PÁGINA CARGA
  useEffect(() => {
    const getFactor = async () => {
      setInitializing(true)
      setError(null)
      
      try {
        // Primero verificar si el usuario ya tiene 2FA verificado en esta sesión
        const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (aal && aal.currentLevel === 'aal2') {
          // Ya está verificado, redirigir al dashboard
          console.log('Usuario ya tiene 2FA verificado, redirigiendo al dashboard');
          router.push('/dashboard');
          return;
        }

        const { data: factors, error: factorError } = await supabase.auth.mfa.listFactors();
        
        if (factorError) {
          console.error('Error cargando factores MFA:', factorError);
          setError("Error cargando factores MFA: " + factorError.message);
          setInitializing(false);
          return;
        }

        if (!factors || !factors.all || factors.all.length === 0) {
          console.warn('No se encontraron factores MFA.');
          setError('Error: No tienes un factor 2FA (TOTP) configurado. Por favor, activa 2FA desde la página de seguridad.');
          setInitializing(false);
          return;
        }

        // Buscar cualquier factor TOTP (verificado o no)
        // Un usuario nuevo puede tener un factor 'unverified' que necesita verificar
        const totpFactor = factors.all.find(f => f.factor_type === 'totp');
        
        if (!totpFactor) {
          console.warn('No se encontró un factor TOTP.');
          setError('Error: No tienes un factor 2FA (TOTP) configurado. Por favor, activa 2FA desde la página de seguridad.');
          setInitializing(false);
          return;
        }

        // Si el factor está 'unverified', aún podemos usarlo para verificar
        // El estado 'verified' significa que ya fue verificado previamente
        if (totpFactor.status === 'unverified') {
          console.log('Factor TOTP encontrado pero no verificado. El usuario necesita verificar el código.');
        }
        
        setFactorId(totpFactor.id); // Guardamos el factor ID
        setInitializing(false);
      } catch (err) {
        console.error('Error inesperado obteniendo factores:', err);
        setError('Error inesperado. Por favor, intenta recargar la página.');
        setInitializing(false);
      }
    }
    
    getFactor();
  }, [supabase, router]);


  const handleVerifyCode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const code = e.currentTarget.code.value.trim()
    
    if (!code || code.length !== 6) {
      setError("Por favor, ingresa un código de 6 dígitos.");
      setLoading(false);
      return;
    }
    
    if (!factorId) {
      setError("Error: No se pudo encontrar el factor MFA. Por favor, recarga la página.");
      setLoading(false);
      return;
    }

    try {
      // 2. Creamos un "challenge"
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (challengeError) {
        console.error('Error al crear el desafío:', challengeError);
        setError('Error al crear el desafío: ' + challengeError.message);
        setLoading(false);
        return;
      }

      if (!challenge || !challenge.id) {
        setError('Error: No se recibió un challenge válido.');
        setLoading(false);
        return;
      }

      // 3. Verificamos usando el challengeId que acabamos de obtener
      const { data: verifyData, error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        code,
        challengeId: challenge.id,
      });

      if (verifyError) {
        console.error('Error verificando código:', verifyError);
        setError('Código incorrecto. Inténtalo de nuevo.');
        setLoading(false);
        return;
      }

      // Verificar que la verificación fue exitosa
      if (!verifyData) {
        console.error('No se recibió respuesta de verificación');
        setError('Error al verificar el código. Por favor, intenta de nuevo.');
        setLoading(false);
        return;
      }

      // Esperar un momento para que la sesión se actualice
      await new Promise(resolve => setTimeout(resolve, 500));

      // Verificar que la sesión se actualizó correctamente
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('No hay sesión después de verificar');
        setError('Error: No se pudo actualizar la sesión. Por favor, intenta iniciar sesión de nuevo.');
        setLoading(false);
        return;
      }

      // Verificar el nivel AAL
      try {
        const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        console.log('Nivel AAL después de verificar:', aal);
      } catch (aalError) {
        console.warn('No se pudo verificar AAL, pero continuamos:', aalError);
      }

      // ¡Éxito! La sesión ahora es 'aal2'
      setLoading(false);
      
      // Usar window.location para forzar una recarga completa y asegurar que la sesión se actualice
      window.location.href = '/dashboard';
    } catch (err) {
      console.error('Error inesperado verificando código:', err);
      setError('Error inesperado. Por favor, intenta de nuevo.');
      setLoading(false);
    }
  }

  // ... (El resto de tu JSX del 'return' está perfecto)
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-white p-4 rounded-full shadow-lg">
              <Shield className="w-12 h-12 text-primary-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Verificación de 2 Pasos</h1>
          <p className="text-primary-100">Ingresa el código de tu app de autenticación</p>
        </div>

        {/* Formulario de Verificación */}
        <div className="card">
          {initializing ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
              <p className="text-gray-600">Cargando configuración de 2FA...</p>
            </div>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
              
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                  Código de 6 dígitos
                </label>
                <input
                  id="code"
                  name="code"
                  type="text"
                  maxLength={6}
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  className="input-field text-center tracking-[0.5em]"
                  placeholder="••••••"
                  required
                  disabled={loading || !factorId}
                />
              </div>

              <button
                type="submit"
                disabled={loading || !factorId}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verificando...' : 'Verificar e Ingresar'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
};