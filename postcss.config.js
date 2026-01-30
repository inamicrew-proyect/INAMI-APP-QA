module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {
      // Compatibilidad con navegadores modernos y antiguos
      overrideBrowserslist: [
        '> 0.5%',
        'last 2 versions',
        'Firefox ESR',
        'not dead',
        'not op_mini all',
        'Chrome >= 60',
        'Safari >= 12',
        'Edge >= 79',
        'iOS >= 12',
        'Android >= 6',
      ],
      flexbox: 'no-2009',
      grid: 'autoplace',
    },
  },
}

