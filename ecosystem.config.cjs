// PM2 process manager config for Amazon EC2
// Usage: pm2 start ecosystem.config.cjs --env production

module.exports = {
  apps: [
    {
      name: 'proteinhouse',
      script: 'server.js',
      instances: 'max',          // cluster mode — use all CPU cores
      exec_mode: 'cluster',
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      // Auto-restart on crash
      watch: false,
      autorestart: true,
      restart_delay: 1000,
      // Logging
      out_file: '/var/log/proteinhouse/out.log',
      error_file: '/var/log/proteinhouse/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
  ],
}
