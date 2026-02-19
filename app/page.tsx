'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase-client'

function HomeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = getSupabaseClient()

  useEffect(() => {
    const checkAndRedirect = async () => {
      // Detectar si hay un código en la URL (viene de Supabase)
      const code = searchParams.get('code')
      const type = searchParams.get('type')
      
      const currentUrl = typeof window !== 'undefined' ? window.location.origin : ''

      // PRIORIDAD 0: Hash (Supabase puede enviar tokens, code o error en el fragmento)
      if (typeof window !== 'undefined' && window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
        const access_token = hashParams.get('access_token')
        const refresh_token = hashParams.get('refresh_token')
        const codeInHash = hashParams.get('code')
        const errorCode = hashParams.get('error_code')
        const errorDesc = hashParams.get('error_description') || ''
        // Enlace expirado o inválido -> login con mensaje
        if (errorCode === 'otp_expired' || (hashParams.get('error') === 'access_denied' && (errorDesc.includes('expired') || errorDesc.includes('invalid')))) {
          window.location.replace(currentUrl + '/login?recovery_expired=1')
          return
        }
        if (access_token && refresh_token) {
          window.location.replace(currentUrl + '/auth/callback' + window.location.hash)
          return
        }
        if (codeInHash) {
          window.location.replace(currentUrl + '/auth/callback?code=' + encodeURIComponent(codeInHash) + '&type=recovery&next=/reset-password')
          return
        }
      }

      // PRIORIDAD 1: Código en la URL (solo llega aquí desde el enlace del correo) -> callback en el mismo origen (full load para que las cookies se guarden)
      if (code) {
        window.location.replace(currentUrl + '/auth/callback?code=' + encodeURIComponent(code) + '&type=recovery&next=/reset-password')
        return
      }
      
      // Comportamiento normal: verificar sesión
      const checkUser = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          router.push('/dashboard')
        } else {
          router.push('/login')
        }
      }

      checkUser()
    }

    checkAndRedirect()
  }, [router, supabase, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
    </div>
  )
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  )
}

