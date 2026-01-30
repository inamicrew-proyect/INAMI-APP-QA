// app/dashboard/layout.tsx

// 1. YA NO ES UN CLIENT COMPONENT
// 2. No necesitamos 'useEffect', 'useState', 'router' ni 'supabase'
import Navbar from '@/components/Navbar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {

  // 3. ¡Toda la lógica de 'useEffect' y 'loading' se fue!
  // El 'middleware.ts' ya protege esta ruta.
  // El 'Navbar' (que es 'use client') maneja su propio estado de carga
  // con el hook 'useAuth'.

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <main>{children}</main>
    </div>
  )
}