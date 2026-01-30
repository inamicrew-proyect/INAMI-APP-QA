'use client'

import Link from 'next/link'
import { AlertTriangle, UserPlus, LogIn } from 'lucide-react'

export default function NoUsersWarning() {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md mx-4 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <AlertTriangle className="w-8 h-8 text-red-500" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Sistema Sin Usuarios
          </h2>
        </div>
        
        <div className="space-y-4 text-gray-700 dark:text-gray-300">
          <p className="font-semibold text-red-600 dark:text-red-400">
            🚨 ERROR CRÍTICO: No hay usuarios registrados en el sistema.
          </p>
          
          <p>
            El sistema necesita al menos un usuario registrado para funcionar correctamente.
          </p>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
              📋 Pasos para solucionar:
            </h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Ve a la página de registro</li>
              <li>Crea un usuario administrador</li>
              <li>Inicia sesión con las credenciales</li>
              <li>Vuelve a intentar la operación</li>
            </ol>
          </div>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
            <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
              👤 Usuario recomendado:
            </h3>
            <ul className="text-sm space-y-1">
              <li><strong>Email:</strong> admin@inami.hn</li>
              <li><strong>Contraseña:</strong> admin123</li>
              <li><strong>Rol:</strong> admin</li>
            </ul>
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <Link 
            href="/register" 
            className="btn-primary flex items-center gap-2 flex-1 justify-center"
          >
            <UserPlus className="w-4 h-4" />
            Crear Usuario
          </Link>
          <Link 
            href="/login" 
            className="btn-secondary flex items-center gap-2 flex-1 justify-center"
          >
            <LogIn className="w-4 h-4" />
            Iniciar Sesión
          </Link>
        </div>
        
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
          Una vez creado el usuario, este mensaje desaparecerá automáticamente
        </p>
      </div>
    </div>
  )
}
