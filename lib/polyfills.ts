/**
 * Polyfills y utilidades de compatibilidad para navegadores
 * Asegura que las funcionalidades modernas funcionen en navegadores antiguos
 */

// Polyfill para Object.assign (IE11)
if (typeof Object.assign !== 'function') {
  Object.assign = function(target: any, ...sources: any[]) {
    if (target == null) {
      throw new TypeError('Cannot convert undefined or null to object')
    }
    const to = Object(target)
    for (let index = 0; index < sources.length; index++) {
      const nextSource = sources[index]
      if (nextSource != null) {
        for (const nextKey in nextSource) {
          if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
            to[nextKey] = nextSource[nextKey]
          }
        }
      }
    }
    return to
  }
}

// Polyfill para Array.from (IE11)
if (!Array.from) {
  Array.from = function<T>(arrayLike: ArrayLike<T> | Iterable<T>): T[] {
    if (arrayLike == null) {
      throw new TypeError('Array.from requires an array-like object - not null or undefined')
    }
    const items = Object(arrayLike)
    if (typeof items[Symbol.iterator] !== 'function') {
      throw new TypeError('Array.from requires an array-like object or iterable')
    }
    const A = typeof this === 'function' ? Object(new this()) : []
    let k = 0
    const iterator = items[Symbol.iterator]()
    let next
    while (!(next = iterator.next()).done) {
      A[k] = next.value
      k += 1
    }
    A.length = k
    return A
  }
}

// Polyfill para Promise.finally (IE11, Safari < 11.1)
if (typeof Promise.prototype.finally === 'undefined') {
  Promise.prototype.finally = function<T>(onFinally?: () => void | Promise<void>): Promise<T> {
    return this.then(
      (value: T) => Promise.resolve(onFinally?.()).then(() => value),
      (reason: any) => Promise.resolve(onFinally?.()).then(() => Promise.reject(reason))
    )
  }
}

// Polyfill para String.includes (IE11)
if (!String.prototype.includes) {
  String.prototype.includes = function(search: string, start?: number): boolean {
    if (typeof start !== 'number') {
      start = 0
    }
    if (start + search.length > this.length) {
      return false
    } else {
      return this.indexOf(search, start) !== -1
    }
  }
}

// Polyfill para Array.includes (IE11)
if (!Array.prototype.includes) {
  Array.prototype.includes = function<T>(searchElement: T, fromIndex?: number): boolean {
    if (this == null) {
      throw new TypeError('"this" is null or not defined')
    }
    const o = Object(this)
    const len = parseInt(String(o.length), 10) || 0
    if (len === 0) {
      return false
    }
    const n = parseInt(String(fromIndex), 10) || 0
    let k = n >= 0 ? n : Math.max(len - Math.abs(n), 0)
    function sameValueZero(x: T, y: T): boolean {
      return x === y || (typeof x === 'number' && typeof y === 'number' && isNaN(x) && isNaN(y))
    }
    for (; k < len; k++) {
      if (sameValueZero(o[k], searchElement)) {
        return true
      }
    }
    return false
  }
}

// Polyfill para fetch (IE11, Safari < 10.1)
if (typeof window !== 'undefined' && !window.fetch) {
  // Nota: En producción, considera usar un polyfill completo como 'whatwg-fetch'
  console.warn('Fetch API no está disponible. Considera usar un polyfill.')
}

// Detectar y advertir sobre características faltantes
if (typeof window !== 'undefined') {
  // Verificar soporte para características modernas
  const checks = {
    fetch: typeof fetch !== 'undefined',
    promises: typeof Promise !== 'undefined',
    localStorage: typeof Storage !== 'undefined',
    sessionStorage: typeof sessionStorage !== 'undefined',
    intersectionObserver: typeof IntersectionObserver !== 'undefined',
    resizeObserver: typeof ResizeObserver !== 'undefined',
  }

  // Solo advertir en desarrollo
  if (process.env.NODE_ENV === 'development') {
    const missing = Object.entries(checks)
      .filter(([, supported]) => !supported)
      .map(([feature]) => feature)
    
    if (missing.length > 0) {
      console.warn('Características no soportadas:', missing.join(', '))
    }
  }
}

// Exportar utilidades de compatibilidad
export const browserSupport = {
  isModern: typeof window !== 'undefined' && 
    'fetch' in window && 
    'Promise' in window &&
    'IntersectionObserver' in window,
  
  supportsIntersectionObserver: typeof window !== 'undefined' && 
    'IntersectionObserver' in window,
  
  supportsResizeObserver: typeof window !== 'undefined' && 
    'ResizeObserver' in window,
  
  supportsWebP: (): Promise<boolean> => {
    if (typeof window === 'undefined') return Promise.resolve(false)
    
    return new Promise((resolve) => {
      const webP = new Image()
      webP.onload = webP.onerror = () => {
        resolve(webP.height === 2)
      }
      webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA'
    })
  },
}

