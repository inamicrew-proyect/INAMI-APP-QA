// app/dashboard/layout.tsx

import Navbar from '@/components/Navbar'
import { DashboardNavigationLoading } from '@/components/DashboardNavigationLoading'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardNavigationLoading>
        <Navbar />
        <main className="relative" aria-live="polite">
          {children}
        </main>
      </DashboardNavigationLoading>
    </div>
  )
}