# Comandos para crear server.js en el VPS

## Ejecuta estos comandos en el VPS:

```bash
cd ~/INAMI.APP

# Crear el archivo server.js
cat > server.js << 'EOF'
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
EOF

# Verificar que se creó
ls -la server.js

# Ver contenido (primeras 10 líneas)
head -10 server.js
```

Luego:

```bash
# 1. Detener PM2 actual
pm2 stop inami-app
pm2 delete inami-app

# 2. Verificar que ecosystem.config.js existe y está correcto
cat ecosystem.config.js

# Si no existe o está incorrecto, crear/actualizar:
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'inami-app',
    script: './server.js',
    cwd: process.cwd(),
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      HOSTNAME: '0.0.0.0',
      PORT: '3000'
    }
  }]
}
EOF

# 3. Reconstruir el proyecto
npm run build

# 4. Iniciar con PM2
pm2 start ecosystem.config.js

# 5. Ver logs
pm2 logs inami-app --lines 30

# 6. Verificar que está escuchando en 0.0.0.0
netstat -tulnp | grep :3000

# 7. Probar conexión
curl http://localhost:3000

# 8. Guardar
pm2 save
```

