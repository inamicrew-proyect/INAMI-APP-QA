'use client'

import Link from 'next/link'
import { Shield } from 'lucide-react'

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center text-white space-y-6">
        <div className="flex justify-center">
          <div className="bg-white p-4 rounded-full shadow-lg">
            <Shield className="w-12 h-12 text-primary-600" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">INAMI</h1>
          <p className="text-primary-100">Instituto Nacional para la Atención de Menores Infractores</p>
        </div>
        <div className="card bg-white text-gray-900">
          <h2 className="text-2xl font-bold mb-4">Registro restringido</h2>
          <p className="text-sm text-gray-600">
            El alta de usuarios se gestiona exclusivamente por el equipo administrador de la institución.
            Si necesitas acceso, contacta con el responsable designado para que cree tu cuenta desde el panel
            interno.
          </p>
          <Link href="/login" className="btn-primary mt-6 inline-flex items-center justify-center">
            Ir al inicio de sesión
          </Link>
        </div>
        <div className="text-primary-100 text-sm">
          <p>Gobierno de Honduras © {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  )
}
