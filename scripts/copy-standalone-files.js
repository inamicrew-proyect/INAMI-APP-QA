/**
 * Copia los archivos estáticos necesarios para el despliegue standalone.
 * Next.js standalone NO copia automáticamente .next/static ni public.
 * Sin esto, los chunks JS devuelven 404 y la app muestra pantalla negra.
 */
const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..')
const standaloneDir = path.join(projectRoot, '.next', 'standalone')
const standaloneNextDir = path.join(standaloneDir, '.next')

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return
  fs.mkdirSync(dest, { recursive: true })
  const entries = fs.readdirSync(src, { withFileTypes: true })
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

try {
  // Copiar .next/static a .next/standalone/.next/static
  const staticSrc = path.join(projectRoot, '.next', 'static')
  const staticDest = path.join(standaloneNextDir, 'static')
  if (fs.existsSync(staticSrc)) {
    copyRecursive(staticSrc, staticDest)
    console.log('✓ Copiado .next/static a standalone')
  } else {
    console.warn('⚠ .next/static no encontrado')
  }

  // Copiar public a .next/standalone/public
  const publicSrc = path.join(projectRoot, 'public')
  const publicDest = path.join(standaloneDir, 'public')
  if (fs.existsSync(publicSrc)) {
    copyRecursive(publicSrc, publicDest)
    console.log('✓ Copiado public a standalone')
  } else {
    console.warn('⚠ public no encontrado (opcional)')
  }

  console.log('✓ Archivos standalone listos para despliegue')
} catch (err) {
  console.error('Error copiando archivos standalone:', err.message)
  process.exit(1)
}
