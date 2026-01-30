'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

function HomeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const checkAndRedirect = async () => {
      // Detectar si hay un código en la URL (viene de Supabase)
      const code = searchParams.get('code')
      const type = searchParams.get('type')
      
      // URL de producción
      const productionUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://31.220.20.232:3000'
      const currentUrl = typeof window !== 'undefined' ? window.location.origin : ''
      const currentHost = typeof window !== 'undefined' ? window.location.host : ''
      
      // PRIORIDAD 1: Si hay código y estamos en localhost, redirigir INMEDIATAMENTE
      if (code && (currentHost.includes('localhost') || currentUrl.includes('localhost'))) {
        // Redirigir a la URL de producción con el código - usar replace para no dejar rastro
        if (type === 'recovery') {
          window.location.replace(`${productionUrl}/auth/callback?code=${code}&type=recovery&next=/reset-password`)
        } else {
          window.location.replace(`${productionUrl}/auth/callback?code=${code}`)
        }
        return
      }
      
      // PRIORIDAD 2: Si hay código pero la URL no coincide con producción
      if (code && currentUrl && currentUrl !== productionUrl && !currentUrl.includes('localhost')) {
        if (type === 'recovery') {
          window.location.replace(`${productionUrl}/auth/callback?code=${code}&type=recovery&next=/reset-password`)
        } else {
          window.location.replace(`${productionUrl}/auth/callback?code=${code}`)
        }
        return
      }
      
      // PRIORIDAD 3: Si hay código y ya estamos en la URL correcta, manejar normalmente
      if (code) {
        // Redirigir al callback para procesar el código
        if (type === 'recovery') {
          router.push(`/auth/callback?code=${code}&type=recovery&next=/reset-password`)
        } else {
          router.push(`/auth/callback?code=${code}`)
        }
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

