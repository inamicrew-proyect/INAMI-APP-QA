const path = require('path')

module.exports = {
  apps: [{
    name: 'inami-app',
    script: path.resolve(__dirname, 'server.js'),
    cwd: path.resolve(__dirname),
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      HOSTNAME: '0.0.0.0',
      PORT: '3000'
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
}

