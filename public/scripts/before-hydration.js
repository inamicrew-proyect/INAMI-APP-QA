/**
 * Ejecutado antes de la hidratación (cargado vía next/script beforeInteractive).
 * URL pública de producción: data-production-url en <html> (inyectada en el servidor).
 */
;(function () {
  var productionUrl = ''
  try {
    productionUrl = document.documentElement.getAttribute('data-production-url') || ''
  } catch (e) {}

  // Tema desde localStorage (evita flash)
  try {
    var theme = 'light'
    if (typeof window !== 'undefined' && window.localStorage) {
      theme = window.localStorage.getItem('theme') || 'light'
    }
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  } catch (e) {}

  // Polyfills mínimos (navegadores antiguos)
  if (typeof Object.assign !== 'function') {
    Object.assign = function (target) {
      if (target == null) {
        throw new TypeError('Cannot convert undefined or null to object')
      }
      var to = Object(target)
      for (var index = 1; index < arguments.length; index++) {
        var nextSource = arguments[index]
        if (nextSource != null) {
          for (var nextKey in nextSource) {
            if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
              to[nextKey] = nextSource[nextKey]
            }
          }
        }
      }
      return to
    }
  }
  if (!String.prototype.includes) {
    String.prototype.includes = function (search, start) {
      if (typeof start !== 'number') {
        start = 0
      }
      if (start + search.length > this.length) {
        return false
      }
      return this.indexOf(search, start) !== -1
    }
  }
  if (!Array.prototype.includes) {
    Array.prototype.includes = function (searchElement, fromIndex) {
      if (this == null) {
        throw new TypeError('"this" is null or not defined')
      }
      var o = Object(this)
      var len = parseInt(o.length, 10) || 0
      if (len === 0) {
        return false
      }
      var n = parseInt(fromIndex, 10) || 0
      var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0)
      function sameValueZero(x, y) {
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

  // OAuth/magic link: en localhost, redirigir al callback en producción
  if (typeof window === 'undefined') return
  var urlParams = new URLSearchParams(window.location.search)
  var code = urlParams.get('code')
  var type = urlParams.get('type')
  var currentHost = window.location.host
  var currentOrigin = window.location.origin
  if (
    code &&
    productionUrl &&
    (currentHost.indexOf('localhost') !== -1 || currentOrigin.indexOf('localhost') !== -1)
  ) {
    if (type === 'recovery') {
      window.location.replace(
        productionUrl +
          '/auth/callback?code=' +
          encodeURIComponent(code) +
          '&type=recovery&next=/reset-password'
      )
    } else {
      window.location.replace(productionUrl + '/auth/callback?code=' + encodeURIComponent(code))
    }
  }
})()
