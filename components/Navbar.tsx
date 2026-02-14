'use client'

import { useState, useEffect, memo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { LogOut, Menu, X, User } from 'lucide-react'

// --- 1. ¡LOS ÚNICOS IMPORTS DE AUTH QUE NECESITAS! ---
import { useAuth } from '@/lib/auth' 
import { getSupabaseClient } from '@/lib/supabase-client'
import { usePermissions } from '@/lib/hooks/usePermissions'
// ---

import NotificationCenter from './NotificationCenter'
import NotificationSettings from './NotificationSettings'
import UserProfileDropdown from './UserProfileDropdown'
import { useTheme } from '@/lib/useTheme'

function Navbar() {
  // TODOS LOS HOOKS DEBEN ESTAR AQUÍ AL INICIO, ANTES DE CUALQUIER LÓGICA
  const router = useRouter()
  const pathname = usePathname()
  const supabase = getSupabaseClient()
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  // 3. REEMPLAZAMOS toda la lógica de 'useState', 'useCallback' y 'useEffect'
  //    con nuestro nuevo hook 'useAuth'.
  const { profile, loading, user } = useAuth()
  const { canView, loading: permissionsLoading, permissions } = usePermissions()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  
  // Estado adicional para verificar el rol directamente desde la sesión si el perfil no está disponible
  const [directRole, setDirectRole] = useState<string | null>(null)
  
  useEffect(() => {
    // Si el perfil no se carga pero hay un usuario, intentar obtener el rol directamente
    if (!profile && user && !loading) {
      const checkRoleDirectly = async () => {
        try {
          const response = await fetch('/api/auth/profile', { cache: 'no-store' })
          if (response.ok) {
            const result = await response.json()
            if (result.profile?.role) {
              console.log('✅ [Navbar] Rol obtenido directamente desde API:', result.profile.role)
              setDirectRole(result.profile.role)
            }
          }
        } catch (error) {
          console.error('Error obteniendo rol directamente:', error)
        }
      }
      checkRoleDirectly()
    } else if (profile) {
      setDirectRole(null) // Limpiar si el perfil se carga
    }
  }, [profile, user, loading])

  // Log inmediato cuando el perfil se carga
  useEffect(() => {
    if (profile) {
      console.log('✅ PERFIL CARGADO:', {
        id: profile.id,
        email: profile.email,
        role: profile.role,
        isAdmin: profile.role === 'admin',
        shouldShowAdmin: profile.role === 'admin'
      })
    } else if (!loading) {
      console.warn('⚠️ PERFIL NO CARGADO después de que loading es false')
    }
  }, [profile, loading])

  // Debug: Log para verificar por qué no aparece el panel admin
  useEffect(() => {
    if (mounted) {
      const isAdmin = profile?.role === 'admin'
      const canViewAdmin = !permissionsLoading && canView('/dashboard/admin')
      const shouldShow = isAdmin || canViewAdmin
      
      console.log('🔍 Navbar Debug - Panel Admin:', {
        mounted,
        loading,
        permissionsLoading,
        profile: profile ? { id: profile.id, email: profile.email, role: profile.role } : null,
        profileRole: profile?.role,
        isAdmin,
        canViewAdmin,
        permissionsCount: permissions.length,
        hasAdminPermission: permissions.some(p => p.modulo.ruta === '/dashboard/admin'),
        shouldShow,
        condition1: profile?.role === 'admin',
        condition2: !permissionsLoading && canView('/dashboard/admin'),
        willShow: shouldShow
      })
      
      // Log adicional si el perfil existe pero no es admin
      if (profile && profile.role !== 'admin') {
        console.warn('⚠️ Usuario NO es admin:', { role: profile.role, email: profile.email })
      }
      
      // Log adicional si es admin pero no se muestra
      if (isAdmin && !shouldShow) {
        console.error('❌ ERROR: Usuario ES admin pero el panel NO se mostrará!', {
          isAdmin,
          shouldShow,
          permissionsLoading,
          mounted
        })
      }
    }
  }, [mounted, loading, permissionsLoading, profile, canView, permissions])

  // Evitar error de hidratación
  useEffect(() => {
    // Solo marcar como montado en el cliente
    if (typeof window !== 'undefined') {
      setMounted(true)
    }
  }, [])

  // 4. AHORA TODOS LOS HOOKS ESTÁN AL INICIO, NO HAY EARLY RETURNS
  
  const handleSignOut = async () => {
	if (isSigningOut) return // Evitar múltiples clics
	
	setIsSigningOut(true)
	
	// Redirigir inmediatamente sin esperar - la limpieza se hará en segundo plano
	// Esto hace que la experiencia sea mucho más rápida
	const timestamp = new Date().getTime()
	window.location.href = `/login?logout=true&t=${timestamp}`
	
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
    if (path === '/dashboard') {
      return pathname === '/dashboard'
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

  // Mostrar navbar incluso si está cargando, pero sin el panel admin hasta que se cargue
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

  // Debug: Verificar estado antes de renderizar
  // Usar directRole como respaldo si el perfil no está disponible
  const effectiveRole = profile?.role || directRole
  const isAdminUser = effectiveRole === 'admin'
  const hasAdminPermission = !permissionsLoading && canView('/dashboard/admin')
  const shouldShowAdminPanel = isAdminUser || hasAdminPermission
  
  console.log('🔍 Navbar Render - Estado del Panel Admin:', {
    profile: profile ? { id: profile.id, email: profile.email, role: profile.role } : 'NO CARGADO',
    directRole,
    effectiveRole,
    isAdminUser,
    hasAdminPermission,
    shouldShowAdminPanel,
    loading,
    permissionsLoading,
    mounted
  })

  return (
	<nav className="bg-gradient-to-r from-sky-500 via-sky-400 to-blue-500 shadow-lg w-full sticky top-0 z-50 backdrop-blur-sm border-b border-white/20">
	  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
		<div className="flex justify-between items-center h-16">
  		  <div className="flex items-center">
  			<Link href="/dashboard" className="flex items-center gap-3 group hover:scale-105 transition-transform duration-300">
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
			<Link href="/dashboard" className={getNavButtonClass('/dashboard')}>
			  Inicio
			</Link>
			<Link href="/dashboard/jovenes" className={getNavButtonClass('/dashboard/jovenes')}>
			  Jóvenes
			</Link>
          <Link href="/dashboard/atenciones" className={getNavButtonClass('/dashboard/atenciones')}>
            Atenciones
          </Link>
          {/* Panel Admin - Mostrar si es admin (inmediato, sin esperar permisos) */}
          {/* FORZAR VISIBILIDAD: Si profile existe y role es 'admin', mostrar SIEMPRE */}
          {(() => {
            // Usar effectiveRole (profile.role o directRole) para verificar admin
            const effectiveRole = profile?.role || directRole
            const showAdmin = effectiveRole === 'admin' || (!permissionsLoading && canView('/dashboard/admin'))
            
            // Log siempre (no solo en desarrollo) para debug
            console.log('🔍 [NAVBAR] Evaluando Panel Admin (Desktop):', {
              profile: profile ? { id: profile.id, email: profile.email, role: profile.role } : 'NULL',
              directRole,
              effectiveRole,
              profileRole: profile?.role,
              profileExists: !!profile,
              showAdmin,
              condition1: effectiveRole === 'admin',
              condition2: !permissionsLoading && canView('/dashboard/admin'),
              loading,
              permissionsLoading
            })
            
            return showAdmin
          })() && (
            <button
              onClick={() => {
                console.log('Panel Admin clicked:', { 
                  profileRole: profile?.role, 
                  isAdmin: profile?.role === 'admin',
                  profileExists: !!profile
                })
                router.push('/dashboard/admin')
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
			  className={`block px-4 py-2.5 rounded-lg font-medium text-base transition-all border-2 ${getMobileNavButtonClass('/dashboard')}`}
			  onClick={() => setIsOpen(false)}
			>
			  Inicio
			</Link>
			<Link 
			  href="/dashboard/jovenes" 
			  className={`block px-4 py-2.5 rounded-lg font-medium text-base transition-all border-2 ${getMobileNavButtonClass('/dashboard/jovenes')}`}
			  onClick={() => setIsOpen(false)}
			>
			  Jóvenes
			</Link>
          <Link 
            href="/dashboard/atenciones" 
            className={`block px-4 py-2.5 rounded-lg font-medium text-base transition-all border-2 ${getMobileNavButtonClass('/dashboard/atenciones')}`}
            onClick={() => setIsOpen(false)}
          >
            Atenciones
          </Link>
          {/* Panel Admin - Mostrar si es admin (inmediato, sin esperar permisos) */}
          {(() => {
            const effectiveRole = profile?.role || directRole
            return effectiveRole === 'admin' || (!permissionsLoading && canView('/dashboard/admin'))
          })() && (
            <button
              onClick={() => {
                setIsOpen(false)
                const effectiveRole = profile?.role || directRole
                const isAdmin = effectiveRole === 'admin'
                const hasPermission = canView('/dashboard/admin')
                console.log('Panel Admin clicked (mobile):', { 
                  profileRole: profile?.role,
                  directRole,
                  effectiveRole,
                  isAdmin, 
                  hasPermission,
                  profileExists: !!profile
                })
                if (isAdmin || hasPermission) {
                  router.push('/dashboard/admin')
                }
              }}
              className={`block w-full text-left px-4 py-2.5 rounded-lg font-medium text-base transition-all border-2 ${getMobileNavButtonClass('/dashboard/admin')}`}
            >
              Panel Admin
            </button>
          )}
<Link 
			  href="/dashboard/notificaciones" 
			  className={`block px-4 py-2.5 rounded-lg font-medium text-base transition-all border-2 ${getMobileNavButtonClass('/dashboard/notificaciones')}`}
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