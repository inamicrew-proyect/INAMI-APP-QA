// PM2 — QA en VPS (ruta home + carpeta del clon)
// Tras cambios: npm run build && pm2 restart inami-qa

module.exports = {
  apps: [{
    name: 'inami-qa',
    script: '.next/standalone/server.js',
    cwd: '/home/inami_admin/INAMI.APP_QA',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: '/home/inami_admin/.pm2/logs/inami-qa-error.log',
    out_file: '/home/inami_admin/.pm2/logs/inami-qa-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G',
    watch: false,
    ignore_watch: ['node_modules', '.next', '.git', '.env.local']
  }]
}
