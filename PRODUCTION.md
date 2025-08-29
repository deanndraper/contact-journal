# Contact Journal Production Deployment Guide

This document provides comprehensive instructions for deploying and managing the Contact Journal application on transformativehelp.com with Caddy reverse proxy and automatic HTTPS.

## Architecture Overview

The production deployment uses a multi-subdomain architecture:
- **journal.transformativehelp.com** → React frontend (served as static files)
- **api.transformativehelp.com** → Express.js backend API (reverse proxied)
- **Caddy** → Reverse proxy with automatic HTTPS via Let's Encrypt
- **PM2** → Process management for Node.js backend

## Quick Deployment

### Prerequisites
- Server access: `ssh -i ~/.ssh/droplet_key ddraper@206.189.187.202`
- DNS records configured for journal.transformativehelp.com and api.transformativehelp.com
- OpenRouter API key for AI functionality

### Initial Deployment
```bash
# Make deployment script executable (if not already done)
chmod +x deploy.sh

# Run initial deployment (installs all dependencies and configures server)
./deploy.sh initial
```

### Updating Application
```bash
# Update existing deployment
./deploy.sh update
```

### Rollback if Needed
```bash
# Rollback to previous deployment
./deploy.sh rollback
```

## Manual Server Setup (Alternative to deploy.sh)

### 1. Server Preparation

#### Install Required Software
```bash
# Connect to server
ssh -i ~/.ssh/droplet_key ddraper@206.189.187.202

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install Caddy
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install -y caddy
```

#### Configure Firewall
```bash
sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable
```

#### Create Directories
```bash
sudo mkdir -p /var/www/journal
sudo mkdir -p /var/log/caddy
sudo mkdir -p /var/log/pm2
sudo chown -R ddraper:ddraper /var/www
sudo chown -R caddy:caddy /var/log/caddy
```

### 2. Application Deployment

#### Build and Deploy Frontend
```bash
# On local machine, build React app
npm run build

# Copy build files to server
scp -i ~/.ssh/droplet_key -r build/ ddraper@206.189.187.202:/var/www/journal/
```

#### Deploy Backend
```bash
# Copy backend files
scp -i ~/.ssh/droplet_key -r backend/ ddraper@206.189.187.202:/var/www/journal/
scp -i ~/.ssh/droplet_key ecosystem.config.js ddraper@206.189.187.202:/var/www/journal/

# On server, install dependencies and build
ssh -i ~/.ssh/droplet_key ddraper@206.189.187.202
cd /var/www/journal/backend
npm ci --only=production
npm run build
```

#### Configure Environment Variables
```bash
# Create .env file on server
cd /var/www/journal/backend
cp .env.example .env
nano .env  # Add your OpenRouter API key
```

### 3. Configure Caddy

#### Deploy Caddyfile
```bash
# Copy Caddyfile to server
scp -i ~/.ssh/droplet_key Caddyfile ddraper@206.189.187.202:/tmp/
ssh -i ~/.ssh/droplet_key ddraper@206.189.187.202
sudo mv /tmp/Caddyfile /etc/caddy/Caddyfile
sudo chown caddy:caddy /etc/caddy/Caddyfile

# Validate configuration
sudo caddy validate --config /etc/caddy/Caddyfile

# Enable and start Caddy
sudo systemctl enable caddy
sudo systemctl restart caddy
```

### 4. Configure PM2

#### Start Backend Process
```bash
cd /var/www/journal
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Follow the instructions to enable auto-start
```

## DNS Configuration

Configure the following DNS records for transformativehelp.com:

```
Type    Name     Value
A       journal  206.189.187.202
A       api      206.189.187.202
A       *        206.189.187.202  (wildcard for future subdomains)
```

## Service Management

### PM2 Commands
```bash
# View all processes
pm2 list

# View logs
pm2 logs journal-backend

# Restart backend
pm2 restart journal-backend

# Monitor processes
pm2 monit

# Stop all processes
pm2 stop all

# Delete process
pm2 delete journal-backend
```

### Caddy Commands
```bash
# Check status
sudo systemctl status caddy

# Restart Caddy
sudo systemctl restart caddy

# Reload configuration (no downtime)
sudo systemctl reload caddy

# View logs
sudo journalctl -u caddy -f

# Validate configuration
sudo caddy validate --config /etc/caddy/Caddyfile
```

### Log Monitoring
```bash
# Frontend access logs
sudo tail -f /var/log/caddy/journal.log

# API access logs
sudo tail -f /var/log/caddy/api.log

# Backend application logs
pm2 logs journal-backend

# System logs
sudo journalctl -u caddy -f
```

## Adding Future Applications

### Step 1: Prepare Application
1. Deploy application code to `/var/www/newapp/`
2. Configure application to run on unique port (3002, 3003, etc.)
3. Set up PM2 configuration for process management

### Step 2: Update Caddyfile
Add configuration block to `/etc/caddy/Caddyfile`:

```caddy
# Static site example
docs.transformativehelp.com {
    root * /var/www/docs
    file_server
    encode gzip
}

# API/Backend example
newapi.transformativehelp.com {
    reverse_proxy localhost:3002
    
    # CORS if needed
    header {
        Access-Control-Allow-Origin "https://newapp.transformativehelp.com"
    }
}

# SPA with API example
newapp.transformativehelp.com {
    root * /var/www/newapp/build
    file_server
    try_files {path} /index.html
    
    # Handle API routes
    handle /api/* {
        reverse_proxy localhost:3002
    }
    
    encode gzip
}
```

### Step 3: Deploy
```bash
# Reload Caddy configuration
sudo systemctl reload caddy

# Start application with PM2
pm2 start newapp-ecosystem.config.js
pm2 save
```

The application will automatically receive HTTPS certificates within minutes.

## Security Considerations

### HTTPS Configuration
- Automatic Let's Encrypt certificates for all subdomains
- HTTP to HTTPS redirects enforced
- HSTS headers enabled
- OCSP stapling configured

### Security Headers
- X-Frame-Options: DENY (prevents clickjacking)
- X-Content-Type-Options: nosniff (prevents MIME type sniffing)
- X-XSS-Protection: enabled
- Referrer-Policy: strict-origin-when-cross-origin

### CORS Configuration
- API allows requests only from journal.transformativehelp.com
- Preflight OPTIONS requests handled automatically
- Credentials allowed for authenticated requests

### Rate Limiting
- API rate limiting configured (100 requests per minute per IP)
- Configurable per endpoint if needed

## Monitoring and Maintenance

### Health Checks
```bash
# Check backend health
curl -s https://api.transformativehelp.com/api/health

# Check frontend
curl -s https://journal.transformativehelp.com/

# Check PM2 processes
pm2 list

# Check Caddy service
sudo systemctl status caddy
```

### Backup Strategy
```bash
# Application data backup
sudo tar -czf /var/backups/journal-$(date +%Y%m%d).tar.gz /var/www/journal/backend/data/

# Configuration backup
sudo cp /etc/caddy/Caddyfile /var/backups/Caddyfile-$(date +%Y%m%d)
```

### Log Rotation
PM2 handles log rotation automatically. Caddy logs are managed by systemd.

### Certificate Renewal
Let's Encrypt certificates renew automatically. No manual intervention required.

## Troubleshooting

### Common Issues

**1. Backend Won't Start**
```bash
# Check PM2 logs
pm2 logs journal-backend

# Check if port 3001 is in use
sudo netstat -tulpn | grep 3001

# Restart PM2 process
pm2 restart journal-backend
```

**2. HTTPS Certificate Issues**
```bash
# Check Caddy logs
sudo journalctl -u caddy -n 50

# Validate Caddyfile
sudo caddy validate --config /etc/caddy/Caddyfile

# Force certificate renewal (if needed)
sudo systemctl restart caddy
```

**3. CORS Errors**
- Verify CORS_ORIGIN environment variable in PM2 config
- Check Caddy CORS headers configuration
- Ensure frontend is making requests to correct API domain

**4. 502 Bad Gateway**
- Backend service may be down (check PM2)
- Backend may be listening on wrong port
- Check firewall rules

### Performance Optimization

**Frontend Optimization**
- Static assets cached for 1 year
- Gzip compression enabled
- CDN integration available if needed

**Backend Optimization**
- PM2 cluster mode for load balancing (currently single instance)
- Memory limit set to prevent runaway processes
- Health check monitoring with auto-restart

### Scaling Considerations

**Horizontal Scaling**
- Multiple PM2 instances can be configured
- Load balancing built into Caddy
- Database scaling may be needed for larger user base

**Monitoring Integration**
- PM2 monitoring dashboard available
- Custom application metrics can be added
- Log aggregation services can be integrated

## Support and Maintenance

### Regular Maintenance Tasks
1. Monitor disk space usage
2. Review application logs for errors
3. Update Node.js and dependencies monthly
4. Monitor SSL certificate status (automated)
5. Backup application data weekly

### Emergency Procedures
1. Use `./deploy.sh rollback` for quick rollback
2. PM2 auto-restarts failed processes
3. Caddy automatically handles certificate issues
4. Contact hosting provider for server-level issues

For questions or issues, refer to:
- PM2 Documentation: https://pm2.keymetrics.io/docs/
- Caddy Documentation: https://caddyserver.com/docs/
- Application logs: `/var/log/caddy/` and PM2 logs