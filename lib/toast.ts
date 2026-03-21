export type ToastType = 'success' | 'error' | 'warning' | 'info'

export function showToast(type: ToastType, message: string, title?: string, duration = 4000) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent('app:toast', {
      detail: { type, title, message, duration },
    })
  )
}

export const toast = {
  success: (message: string, title = 'Éxito', duration?: number) => showToast('success', message, title, duration),
  error: (message: string, title = 'Error', duration?: number) => showToast('error', message, title, duration),
  warning: (message: string, title = 'Atención', duration?: number) => showToast('warning', message, title, duration),
  info: (message: string, title = 'Información', duration?: number) => showToast('info', message, title, duration),
}

export function actionSuccess(action: 'crear' | 'editar' | 'eliminar' | 'generar', entity: string) {
  const capital = action.charAt(0).toUpperCase() + action.slice(1)
  toast.success(`${capital} ${entity} correctamente.`)
}

export function actionError(action: 'crear' | 'editar' | 'eliminar' | 'generar', entity: string, detail?: string) {
  toast.error(`No se pudo ${action} ${entity}.${detail ? ' ' + detail : ''}`)
}
