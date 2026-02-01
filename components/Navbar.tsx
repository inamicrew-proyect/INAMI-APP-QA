'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { LogOut, Menu, X, User } from 'lucide-react'

// --- 1. ¡LOS ÚNICOS IMPORTS DE AUTH QUE NECESITAS! ---
import { useAuth } from '@/lib/auth' 
import { getSupabaseClient } from '@/lib/supabase-client'
import { usePermissions } from '@/lib/hooks/usePermissions'
// ---

import NotificationCenter from './NotificationCenter'
import NotificationSettings from './NotificationSettings'
import UserProfileDropdown from './UserProfileDropdown'

export default function Navbar() {
  // TODOS LOS HOOKS DEBEN ESTAR AQUÍ AL INICIO, ANTES DE CUALQUIER LÓGICA
  const router = useRouter()
  const pathname = usePathname()
  const supabase = getSupabaseClient()
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  // 3. REEMPLAZAMOS toda la lógica de 'useState', 'useCallback' y 'useEffect'
  //    con nuestro nuevo hook 'useAuth'.
  const { profile, loading } = useAuth()
  const { canView, loading: permissionsLoading } = usePermissions()

  // Evitar error de hidratación
  useEffect(() => {
    setMounted(true)
  }, [])

  // 4. AHORA TODOS LOS HOOKS ESTÁN AL INICIO, NO HAY EARLY RETURNS
  
  const handleSignOut = async () => {
	if (isSigningOut) return // Evitar múltiples clics
	
	setIsSigningOut(true)
	
	try {
	  // 1. Cerrar sesión en Supabase PRIMERO (esperar a que complete)
	  await supabase.auth.signOut({ scope: 'global' }).catch(() => {
		// Si falla con scope global, intentar sin scope
		return supabase.auth.signOut()
	  })
	  
	  // 2. Limpiar storage COMPLETAMENTE antes de redirigir
	  if (typeof window !== 'undefined') {
		try {
		  // Limpiar todas las claves relacionadas con auth
		  const authKeys = Object.keys(localStorage).filter(key => 
			key.includes('supabase') || key.includes('auth') || key.includes('session')
		  )
		  authKeys.forEach(key => localStorage.removeItem(key))
		  
		  const sessionKeys = Object.keys(sessionStorage).filter(key => 
			key.includes('supabase') || key.includes('auth') || key.includes('session')
		  )
		  sessionKeys.forEach(key => sessionStorage.removeItem(key))
		  
		  // Limpiar también cookies relacionadas con auth
		  document.cookie.split(";").forEach((c) => {
			const eqPos = c.indexOf("=")
			const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim()
			if (name.includes('supabase') || name.includes('auth') || name.includes('session')) {
			  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
			  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`
			}
		  })
		} catch (storageError) {
		  console.error('Error limpiando storage:', storageError)
		}
	  }
	  
	  // 3. Esperar un momento para asegurar que todo se limpió
	  await new Promise(resolve => setTimeout(resolve, 100))
	  
	  // 4. Redirigir a login con timestamp para evitar cache
	  const timestamp = new Date().getTime()
	  // Usar window.location.replace para evitar que el usuario pueda volver atrás
	  window.location.replace(`/login?logout=true&t=${timestamp}`)
	} catch (error) {
	  console.error('Error durante logout:', error)
	  // Aún así redirigir a login
	  const timestamp = new Date().getTime()
	  window.location.replace(`/login?logout=true&t=${timestamp}`)
	}
  }

  // 6. Tu función helper (estaba perfecta)
  const getRoleLabel = (role: string) => {
  	const roles: Record<string, string> = {
  	  admin: 'Administrador',
  	  pedagogo: 'Pedagogo',
  	  abogado: 'Abogado',
  	  medico: 'Médico',
  	  psicologo: 'Psicólogo',
  	  trabajador_social: 'Trabajador Social',
  	  seguridad: 'Seguridad'
  	}
  	return roles[role] || role
  }

  // Función para verificar si una ruta está activa
  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(path)
  }

  // Clase base para los botones de navegación
  const getNavButtonClass = (path: string) => {
    const baseClass = `px-4 py-2.5 rounded-lg font-medium transition-all duration-200 text-base whitespace-nowrap border-2`
    const activeClass = isActive(path)
      ? "bg-white text-sky-600 shadow-md font-semibold border-sky-600"
      : "bg-white/80 hover:bg-white text-sky-700 hover:text-sky-800 hover:shadow-sm border-white/50 hover:border-white"
    return `${baseClass} ${activeClass}`
  }

  // 7. Tu JSX original (menús, links, etc.)
  // Renderizado condicional dentro del JSX, no early return
  // Agregar timeout para evitar que se quede bloqueado indefinidamente
  const [showFallback, setShowFallback] = useState(false)
  
  useEffect(() => {
    // Si la carga tarda más de 2 segundos, mostrar el navbar de todos modos
    const timeout = setTimeout(() => {
      if (loading || permissionsLoading) {
        console.warn('Navbar: Timeout en carga, mostrando navbar sin esperar')
        setShowFallback(true)
      }
    }, 2000)

    return () => clearTimeout(timeout)
  }, [loading, permissionsLoading])

  // Si es admin, mostrar el navbar inmediatamente sin esperar permisos
  const isAdmin = profile?.role === 'admin'
  const shouldShowLoading = !mounted || ((loading || permissionsLoading) && !showFallback && !isAdmin)

  if (shouldShowLoading) {
    return (
      <nav className="bg-sky-400 shadow-md w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-white/30 rounded animate-pulse"></div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-20 h-8 bg-white/30 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  return (
	<nav className="bg-sky-400 shadow-md w-full">
	  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
		<div className="flex justify-between items-center h-16">
  		  <div className="flex items-center">
  			<Link href="/dashboard" className="flex items-center gap-3">
  			  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-md overflow-hidden">
				<Image
					src="/inami.png"
					alt="Logo INAMI"
					width={40}
					height={40}
					className="w-full h-full object-cover"
					style={{ width: 'auto', height: 'auto' }}
					priority
				/>
				</div>
  			  <div>
  				<h1 className="text-xl font-bold text-white">INAMI</h1>
  				<p className="text-xs text-sky-100">Sistema de Gestión</p>
  			  </div>
  			</Link>
  		  </div>

		  {/* Desktop menu */}
		  <div className="hidden md:flex items-center gap-2">
			<Link href="/dashboard" className={getNavButtonClass('/dashboard')}>
			  Inicio
			</Link>
			<Link href="/dashboard/jovenes" className={getNavButtonClass('/dashboard/jovenes')}>
			  Jóvenes
			</Link>
          <Link href="/dashboard/atenciones" className={getNavButtonClass('/dashboard/atenciones')}>
            Atenciones
          </Link>
          {/* Mostrar botón admin inmediatamente si es admin, o si tiene permisos */}
          {(isAdmin || (!permissionsLoading && canView('/dashboard/admin'))) && (
            <button
              onClick={() => {
                const hasPermission = !permissionsLoading && canView('/dashboard/admin')
                console.log('Panel Admin clicked:', { hasPermission, isAdmin, profileRole: profile?.role })
                if (hasPermission || isAdmin) {
                  router.push('/dashboard/admin')
                } else {
                  console.warn('Acceso denegado al panel admin')
                }
              }}
              className={getNavButtonClass('/dashboard/admin')}
            >
              Panel Admin
            </button>
          )}
          <Link href="/dashboard/notificaciones" className={getNavButtonClass('/dashboard/notificaciones')}>
            Notificaciones
          </Link>
  			
  			<div className="flex items-center gap-3 ml-4 pl-4 border-l border-white/30">
  			  <NotificationCenter />
  			  <NotificationSettings />
  			  <UserProfileDropdown />
  			</div>
  		  </div>

  		  {/* Mobile menu button */}
  		  <div className="md:hidden flex items-center">
  			<button
  			  onClick={() => setIsOpen(!isOpen)}
  			  className="p-2 rounded-lg text-white hover:bg-white/20 transition-colors"
  			>
  			  {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
  			</button>
  		  </div>
  		</div>
  	  </div>

	  {/* Mobile menu */}
	  {isOpen && (
		<div className="md:hidden border-t border-white/30 bg-sky-500">
		  <div className="px-4 py-3 space-y-2">
			{profile && (
			  <Link 
				href={`/dashboard/usuarios/${profile.id}`}
				onClick={() => setIsOpen(false)}
				className="flex items-center gap-3 pb-3 border-b border-white/30 hover:opacity-80 transition-opacity cursor-pointer"
				title="Ver mi perfil"
			  >
				{profile.photo_url ? (
				  <img 
					src={profile.photo_url} 
					alt={profile.full_name}
					className="w-10 h-10 rounded-full object-cover border-2 border-white/50 shadow-md"
				  />
				) : (
				  <div className="bg-white/20 p-2 rounded-full border-2 border-white/50 shadow-md">
					<User className="w-5 h-5 text-white" />
				  </div>
				)}
				<div>
				  <p className="text-sm font-medium text-white">{profile.full_name}</p>
				  <p className="text-xs text-sky-100">{getRoleLabel(profile.role)}</p>
				</div>
			  </Link>
			)}
			
			<Link 
			  href="/dashboard" 
			  className={`block px-4 py-2.5 rounded-lg font-medium text-base transition-all border-2 ${isActive('/dashboard') ? 'bg-white text-sky-600 shadow-md font-semibold border-sky-600' : 'bg-white/80 hover:bg-white text-sky-700 hover:text-sky-800 border-white/50 hover:border-white'}`}
			  onClick={() => setIsOpen(false)}
			>
			  Inicio
			</Link>
			<Link 
			  href="/dashboard/jovenes" 
			  className={`block px-4 py-2.5 rounded-lg font-medium text-base transition-all border-2 ${isActive('/dashboard/jovenes') ? 'bg-white text-sky-600 shadow-md font-semibold border-sky-600' : 'bg-white/80 hover:bg-white text-sky-700 hover:text-sky-800 border-white/50 hover:border-white'}`}
			  onClick={() => setIsOpen(false)}
			>
			  Jóvenes
			</Link>
          <Link 
            href="/dashboard/atenciones" 
            className={`block px-4 py-2.5 rounded-lg font-medium text-base transition-all border-2 ${isActive('/dashboard/atenciones') ? 'bg-white text-sky-600 shadow-md font-semibold border-sky-600' : 'bg-white/80 hover:bg-white text-sky-700 hover:text-sky-800 border-white/50 hover:border-white'}`}
            onClick={() => setIsOpen(false)}
          >
            Atenciones
          </Link>
          {/* Mostrar botón admin inmediatamente si es admin, o si tiene permisos */}
          {(isAdmin || (!permissionsLoading && canView('/dashboard/admin'))) && (
            <button
              onClick={() => {
                setIsOpen(false)
                const hasPermission = !permissionsLoading && canView('/dashboard/admin')
                console.log('Panel Admin clicked (mobile):', { hasPermission, isAdmin, profileRole: profile?.role })
                if (hasPermission || isAdmin) {
                  router.push('/dashboard/admin')
                } else {
                  console.warn('Acceso denegado al panel admin')
                }
              }}
              className={`block w-full text-left px-4 py-2.5 rounded-lg font-medium text-base transition-all border-2 ${isActive('/dashboard/admin') ? 'bg-white text-sky-600 shadow-md font-semibold border-sky-600' : 'bg-white/80 hover:bg-white text-sky-700 hover:text-sky-800 border-white/50 hover:border-white'}`}
            >
              Panel Admin
            </button>
          )}
          <Link 
            href="/dashboard/notificaciones" 
            className={`block px-4 py-2.5 rounded-lg font-medium text-base transition-all border-2 ${isActive('/dashboard/notificaciones') ? 'bg-white text-sky-600 shadow-md font-semibold border-sky-600' : 'bg-white/80 hover:bg-white text-sky-700 hover:text-sky-800 border-white/50 hover:border-white'}`}
            onClick={() => setIsOpen(false)}
          >
            Notificaciones
          </Link>
			<button
			  onClick={handleSignOut}
			  data-signout-button
			  disabled={isSigningOut}
			  className="w-full text-left px-4 py-2 rounded-lg text-white hover:bg-white/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
			>
			  <LogOut className="w-4 h-4" />
			  {isSigningOut ? 'Cerrando sesión...' : 'Cerrar Sesión'}
			</button>
		  </div>
		</div>
	  )}
  	</nav>
  )
}