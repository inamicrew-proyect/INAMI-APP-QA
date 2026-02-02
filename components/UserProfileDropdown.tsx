'use client'

import { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { User, Settings, Home, LogOut, ChevronDown } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { getSupabaseClient } from '@/lib/supabase-client'

const getRoleLabel = (role: string) => {
  const labels: Record<string, string> = {
    admin: 'Administrador',
    pedagogo: 'Pedagogo',
    abogado: 'Abogado',
    medico: 'Médico',
    psicologo: 'Psicólogo',
    trabajador_social: 'Trabajador Social',
    seguridad: 'Seguridad',
  }
  return labels[role] || role
}

export default function UserProfileDropdown() {
  const pathname = usePathname()
  const { profile } = useAuth()

  const isActive = (path: string) => {
    if (path === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(path)
  }
  const supabase = getSupabaseClient()
  const [isOpen, setIsOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSignOut = () => {
    if (isSigningOut) return
    
    setIsSigningOut(true)
    setIsOpen(false)
    
    // Redirigir INMEDIATAMENTE - no esperar a Supabase (evita que se cuelgue)
    const timestamp = new Date().getTime()
    window.location.href = `/login?logout=true&t=${timestamp}`
    
    // Limpiar sesión en segundo plano (no bloquea la redirección)
    setTimeout(() => {
      supabase.auth.signOut({ scope: 'global' }).catch(() => {
        supabase.auth.signOut().catch(() => {})
      })
      if (typeof window !== 'undefined') {
        try {
          const authKeys = Object.keys(localStorage).filter(key =>
            key.includes('supabase') || key.includes('auth') || key.includes('session')
          )
          authKeys.forEach(key => localStorage.removeItem(key))
          const sessionKeys = Object.keys(sessionStorage).filter(key =>
            key.includes('supabase') || key.includes('auth') || key.includes('session')
          )
          sessionKeys.forEach(key => sessionStorage.removeItem(key))
        } catch {
          // Ignorar errores de storage
        }
      }
    }, 0)
  }

  if (!profile) return null

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botón del perfil */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
        title="Ver mi perfil"
      >
        {profile.photo_url ? (
          <img 
            src={profile.photo_url} 
            alt={profile.full_name}
            className="w-10 h-10 rounded-full object-cover border-2 border-white/50 shadow-md"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/50 shadow-md">
            <User className="w-6 h-6 text-white" />
          </div>
        )}
        <div className="text-right hidden md:block">
          <p className="text-sm font-medium text-white">{profile.full_name}</p>
          <p className="text-xs text-sky-100">{getRoleLabel(profile.role)}</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-white transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 z-50 overflow-hidden">
          {/* Header del dropdown con info del usuario */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-600">
            <div className="flex items-center gap-3">
              {profile.photo_url ? (
                <img 
                  src={profile.photo_url} 
                  alt={profile.full_name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center border-2 border-gray-300 dark:border-gray-500">
                  <User className="w-6 h-6 text-gray-500 dark:text-gray-300" />
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{profile.full_name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{getRoleLabel(profile.role)}</p>
              </div>
            </div>
          </div>

          {/* Opciones del menú */}
          <div className="py-2">
            <Link
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                isActive('/dashboard')
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Home className="w-4 h-4" />
              Dashboard
            </Link>
            <Link
              href={`/dashboard/usuarios/${profile.id}`}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                isActive(`/dashboard/usuarios/${profile.id}`)
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <User className="w-4 h-4" />
              Ver Perfil
            </Link>
            <Link
              href="/dashboard/configuracion"
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                isActive('/dashboard/configuracion')
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Settings className="w-4 h-4" />
              Configuración
            </Link>
            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogOut className="w-4 h-4" />
              {isSigningOut ? 'Cerrando sesión...' : 'Cerrar Sesión'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
