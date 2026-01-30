'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function JovenDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const jovenId = params.id as string

  useEffect(() => {
    // Redirigir al expediente del joven
    router.replace(`/dashboard/jovenes/${jovenId}/expediente`)
  }, [router, jovenId])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
    </div>
  )
}
