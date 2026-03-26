'use client'

import { useState, useEffect, memo } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { LogOut, Menu, X, User } from 'lucide-react'

// --- 1. ¡LOS ÚNICOS IMPORTS DE AUTH QUE NECESITAS! ---
import { useAuth } from '@/lib/auth' 
import { getSupabaseClient } from '@/lib/supabase-client'
// ---

import NotificationCenter from './NotificationCenter'
import NotificationSettings from './NotificationSettings'
import UserProfileDropdown from './UserProfileDropdown'
import { useTheme } from '@/lib/useTheme'
import { Routes } from '@/lib/routes'

function Navbar() {
  // TODOS LOS HOOKS DEBEN ESTAR AQUÍ AL INICIO, ANTES DE CUALQUIER LÓGICA
  const pathname = usePathname()
  const supabase = getSupabaseClient()
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  // 3. REEMPLAZAMOS toda la lógica de 'useState', 'useCallback' y 'useEffect'
  //    con nuestro nuevo hook 'useAuth'.
  const { profile } = useAuth()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  // Evitar error de hidratación
  useEffect(() => {
    if (typeof window !== 'undefined') {
      queueMicrotask(() => setMounted(true))
    }
  }, [])

  // 4. AHORA TODOS LOS HOOKS ESTÁN AL INICIO, NO HAY EARLY RETURNS
  
  const handleSignOut = async () => {
	if (isSigningOut) return // Evitar múltiples clics
	
	setIsSigningOut(true)
	
	// Redirigir inmediatamente sin esperar - la limpieza se hará en segundo plano
	// Esto hace que la experiencia sea mucho más rápida
	const timestamp = new Date().getTime()
	window.location.href = `${Routes.LOGIN}?logout=true&t=${timestamp}`
	
	// Limpiar en segundo plano (no bloquea la redirección)
	setTimeout(async () => {
	  try {
		// Cerrar sesión en Supabase (no esperamos respuesta)
		supabase.auth.signOut({ scope: 'global' }).catch(() => {
		  // Si falla, intentar sin scope
		  supabase.auth.signOut().catch(() => {})
		})
		
		// Limpiar storage (solo datos de auth, no todo)
		if (typeof window !== 'undefined') {
		  try {
			// Solo limpiar claves relacionadas con auth, no todo el storage
			const authKeys = Object.keys(localStorage).filter(key => 
			  key.includes('supabase') || key.includes('auth') || key.includes('session')
			)
			authKeys.forEach(key => localStorage.removeItem(key))
			
			const sessionKeys = Object.keys(sessionStorage).filter(key => 
			  key.includes('supabase') || key.includes('auth') || key.includes('session')
			)
			sessionKeys.forEach(key => sessionStorage.removeItem(key))
		  } catch (storageError) {
			// Ignorar errores de storage
		  }
		}
	  } catch (error) {
		// Ignorar errores en segundo plano
	  }
	}, 0)
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
    if (path === Routes.DASHBOARD) {
      return pathname === Routes.DASHBOARD
    }
    return pathname.startsWith(path)
  }

        // Clase base para los botones de navegación - Mejorada (modo oscuro: tabs más integrados al header)
        const getNavButtonClass = (path: string) => {
          const baseClass = `px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 text-base whitespace-nowrap border-2 relative overflow-hidden group`
          const activeClass = isActive(path)
            ? "bg-white text-sky-600 shadow-lg font-bold border-sky-600 scale-105"
            : isDark
              ? "bg-white/20 hover:bg-white/35 text-white hover:text-white border-white/30 hover:border-white/50 hover:shadow-lg hover:scale-105 hover:-translate-y-0.5"
              : "bg-white/90 hover:bg-white text-sky-700 hover:text-sky-800 hover:shadow-lg border-white/60 hover:border-white hover:scale-105 hover:-translate-y-0.5"
          return `${baseClass} ${activeClass}`
        }
        const getMobileNavButtonClass = (path: string) => {
          const active = isActive(path)
          if (active) return "bg-white text-sky-600 shadow-md font-semibold border-sky-600"
          return isDark
            ? "bg-white/20 hover:bg-white/35 text-white border-white/30 hover:border-white/50"
            : "bg-white/80 hover:bg-white text-sky-700 hover:text-sky-800 border-white/50 hover:border-white"
        }

  // 7. Tu JSX original (menús, links, etc.)
  // Renderizado condicional dentro del JSX, no early return

  // No renderizar hasta que el componente esté montado en el cliente
  if (typeof window === 'undefined' || !mounted) {
    return (
      <nav className="bg-gradient-to-r from-sky-500 via-sky-400 to-blue-500 shadow-lg w-full sticky top-0 z-50 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-white/30 rounded-full animate-pulse"></div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-24 h-8 bg-white/30 rounded-xl animate-pulse"></div>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  return (
	<nav className="bg-gradient-to-r from-sky-500 via-sky-400 to-blue-500 shadow-lg w-full sticky top-0 z-50 backdrop-blur-sm border-b border-white/20">
	  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
		<div className="flex justify-between items-center h-16">
  		  <div className="flex items-center">
  			<Link href={Routes.DASHBOARD} className="flex items-center gap-3 group hover:scale-105 transition-transform duration-300">
  			  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg overflow-hidden group-hover:shadow-xl group-hover:rotate-6 transition-all duration-300 ring-2 ring-white/50 group-hover:ring-white">
				<img
					src="/inami.png"
					alt="Logo INAMI"
					width={48}
					height={48}
					className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
					style={{ display: 'block' }}
					loading="eager"
				/>
				</div>
  			  <div>
  				<h1 className="text-xl font-bold text-white drop-shadow-md group-hover:drop-shadow-lg transition-all duration-300">INAMI</h1>
  				<p className="text-xs text-sky-100 font-medium">Sistema de Gestión</p>
  			  </div>
  			</Link>
  		  </div>

		  {/* Desktop menu */}
		  <div className="hidden md:flex items-center gap-2">
			<Link href={Routes.DASHBOARD} className={getNavButtonClass(Routes.DASHBOARD)}>
			  Inicio
			</Link>
			<Link href={Routes.JOVENES} className={getNavButtonClass(Routes.JOVENES)}>
			  Jóvenes
			</Link>
          <Link href={Routes.ATENCIONES} className={getNavButtonClass(Routes.ATENCIONES)}>
            Atenciones
          </Link>
          <Link href={Routes.SEGURIDAD} className={getNavButtonClass(Routes.SEGURIDAD)}>
            Seguridad
          </Link>
          <Link href={Routes.NOTIFICACIONES} className={getNavButtonClass(Routes.NOTIFICACIONES)}>
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
				href={Routes.usuarioId(profile.id)}
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
			  href={Routes.DASHBOARD} 
			  className={`block px-4 py-2.5 rounded-lg font-medium text-base transition-all border-2 ${getMobileNavButtonClass(Routes.DASHBOARD)}`}
			  onClick={() => setIsOpen(false)}
			>
			  Inicio
			</Link>
			<Link 
			  href={Routes.JOVENES} 
			  className={`block px-4 py-2.5 rounded-lg font-medium text-base transition-all border-2 ${getMobileNavButtonClass(Routes.JOVENES)}`}
			  onClick={() => setIsOpen(false)}
			>
			  Jóvenes
			</Link>
          <Link 
            href={Routes.ATENCIONES} 
            className={`block px-4 py-2.5 rounded-lg font-medium text-base transition-all border-2 ${getMobileNavButtonClass(Routes.ATENCIONES)}`}
            onClick={() => setIsOpen(false)}
          >
            Atenciones
          </Link>
          <Link
            href={Routes.SEGURIDAD}
            className={`block px-4 py-2.5 rounded-lg font-medium text-base transition-all border-2 ${getMobileNavButtonClass(Routes.SEGURIDAD)}`}
            onClick={() => setIsOpen(false)}
          >
            Seguridad
          </Link>
<Link 
			  href={Routes.NOTIFICACIONES} 
			  className={`block px-4 py-2.5 rounded-lg font-medium text-base transition-all border-2 ${getMobileNavButtonClass(Routes.NOTIFICACIONES)}`}
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

// Memoizar el componente para evitar re-renders innecesarios
export default memo(Navbar)