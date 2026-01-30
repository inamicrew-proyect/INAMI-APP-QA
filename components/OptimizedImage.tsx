'use client'

import Image from 'next/image'
import { useState } from 'react'
import { User } from 'lucide-react'

interface OptimizedImageProps {
  src: string | null | undefined
  alt: string
  width?: number
  height?: number
  className?: string
  fallback?: React.ReactNode
  priority?: boolean
  sizes?: string
}

/**
 * Componente de imagen optimizado que usa next/image
 * con fallback automático para compatibilidad
 */
export default function OptimizedImage({
  src,
  alt,
  width = 128,
  height = 128,
  className = '',
  fallback,
  priority = false,
  sizes,
}: OptimizedImageProps) {
  const [error, setError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Si no hay src o hay error, mostrar fallback
  if (!src || error) {
    return (
      <div className={`flex items-center justify-center bg-gray-200 dark:bg-gray-700 ${className}`}>
        {fallback || <User className="w-1/2 h-1/2 text-gray-400" />}
      </div>
    )
  }

  // Verificar si es una URL externa de Supabase
  const isExternal = src.startsWith('http://') || src.startsWith('https://')
  const imageSrc = isExternal ? src : src

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Image
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        className="object-cover"
        onError={() => setError(true)}
        onLoad={() => setIsLoading(false)}
        priority={priority}
        sizes={sizes}
        unoptimized={isExternal && !src.includes('supabase')}
        style={{
          opacity: isLoading ? 0 : 1,
          transition: 'opacity 0.3s ease-in-out',
        }}
      />
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
      )}
    </div>
  )
}

