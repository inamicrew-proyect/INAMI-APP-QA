/**
 * Señal de abort por tiempo. Preferir `AbortSignal.timeout` (motivo estándar, sin avisos en consola).
 */
export function fetchTimeoutSignal(ms: number, label = 'request'): AbortSignal {
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
    return AbortSignal.timeout(ms)
  }
  const controller = new AbortController()
  setTimeout(() => {
    controller.abort(new DOMException(`Timeout ${ms}ms: ${label}`, 'TimeoutError'))
  }, ms)
  return controller.signal
}
