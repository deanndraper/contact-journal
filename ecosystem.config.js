// PM2 Ecosystem Configuration for Contact Journal
// Manages Node.js backend process in production environment

module.exports = {
  apps: [{
    // Application identification
    name: 'journal-backend',
    script: './backend/dist/server.js',
    
    // Working directory
    cwd: '/var/www/journal',
    
    // Process management
    instances: 1,
    exec_mode: 'cluster',
    
    // Auto-restart configuration
    autorestart: true,
    watch: false,  // Disable file watching in production
    max_memory_restart: '512M',  // Restart if memory exceeds 512MB
    
    // Environment variables
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      
      // OpenRouter API configuration
      // These should be set in the actual .env file on the server
      OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
      OPENROUTER_BASE_URL: 'https://openrouter.ai/api/v1',
      
      // Application settings
      CORS_ORIGIN: 'https://journal.transformativehelp.com',
      DATA_PATH: '/var/www/journal/backend/data',
      LOG_LEVEL: 'info'
    },
    
    // Logging configuration
    log_file: '/var/log/pm2/journal-backend.log',
    out_file: '/var/log/pm2/journal-backend-out.log',
    error_file: '/var/log/pm2/journal-backend-error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    combine_logs: true,
    
    // Process timing
    kill_timeout: 5000,
    listen_timeout: 3000,
    
    // Health monitoring
    health_check_http: {
      port: 3001,
      path: '/api/health',
      max_restarts: 5,
      window: 60000  // 1 minute window
    },
    
    // Advanced PM2 features
    node_args: '--max-old-space-size=512',  // Limit Node.js memory
    source_map_support: false,  // Disable source maps in production
    
    // Restart conditions
    min_uptime: '10s',  // Minimum uptime before considering stable
    max_restarts: 10,   // Maximum restarts within restart_delay window
    restart_delay: 4000, // Delay between restarts (4 seconds)
    
    // Process signals
    kill_signal: 'SIGTERM',
    wait_ready: true,
    
    // Deployment tracking
    version: '1.0.0',
    
    // Custom settings for therapeutic application
    merge_logs: true,
    time: true
  }],
  
  // Deployment configuration for automated deployments
  deploy: {
    production: {
      user: 'ddraper',
      host: '206.189.187.202',
      ref: 'origin/main',
      repo: 'git@github.com:yourusername/contact-journal.git',  // Update with actual repo
      path: '/var/www/journal',
      'pre-deploy-local': '',
      'post-deploy': 'npm install --only=production && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'mkdir -p /var/www/journal && mkdir -p /var/log/pm2'
    }
  },
  
  // Global PM2 settings
  apps_settings: {
    // Default log rotation
    log_type: 'json',
    log_max_files: 10,
    log_max_size: '10M',
    
    // Monitoring settings
    monitoring: true,
    pmx: true,
    
    // Instance settings
    instance_var: 'INSTANCE_ID',
    increment_var: 'PORT'
  }
};