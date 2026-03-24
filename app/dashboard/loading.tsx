/** UI de carga al cambiar de módulo / ruta bajo /dashboard (App Router) */
export default function DashboardSegmentLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[40vh]">
      <div className="animate-pulse space-y-6">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-48 max-w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          ))}
        </div>
        <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl" />
      </div>
      <p className="mt-8 text-sm text-center text-gray-500 dark:text-gray-400">Cargando…</p>
    </div>
  )
}
