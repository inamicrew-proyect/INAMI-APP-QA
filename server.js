// Cargar variables de entorno desde .env.local
// Primero intenta cargar desde la ruta relativa al directorio del script
const path = require('path')
const fs = require('fs')
const dotenv = require('dotenv')

// Buscar .env.local en el directorio actual
const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath })
  console.log('✅ Variables de entorno cargadas desde .env.local')
} else {
  console.warn('⚠️ No se encontró .env.local en:', envPath)
}

const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOSTNAME || '0.0.0.0'
const port = parseInt(process.env.PORT || '3000', 10)

const app = next({ 
  dev,
  hostname,
  port 
})
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, hostname, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
      console.log(`> Server listening on all network interfaces (0.0.0.0)`)
    })
})

