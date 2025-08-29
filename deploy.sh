#!/bin/bash

# =============================================================================
# CONTACT JOURNAL PRODUCTION DEPLOYMENT SCRIPT
# =============================================================================
#
# This script deploys the Contact Journal application to your production server
# at transformativehelp.com with automatic HTTPS via Caddy reverse proxy.
#
# PREREQUISITES:
# - Server access: ssh -i ~/.ssh/droplet_key ddraper@206.189.187.202
# - Domain DNS configured: journal.transformativehelp.com, api.transformativehelp.com
# - Node.js and npm installed on server
# - Git repository access from server
#
# USAGE:
# ./deploy.sh [initial|update|rollback]
#
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SERVER_USER="ddraper"
SERVER_HOST="206.189.187.202"
SSH_KEY="~/.ssh/droplet_key"
DOMAIN="transformativehelp.com"
APP_NAME="contact-journal"
SERVER_APP_DIR="/var/www/journal"
BACKUP_DIR="/var/backups/journal"

# Deployment mode (initial, update, rollback)
DEPLOY_MODE=${1:-update}

echo -e "${BLUE}Contact Journal Production Deployment${NC}"
echo "========================================"
echo "Mode: $DEPLOY_MODE"
echo "Target: $SERVER_HOST"
echo ""

# Function to execute commands on remote server
remote_exec() {
    ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_HOST" "$1"
}

# Function to copy files to server
copy_to_server() {
    scp -i "$SSH_KEY" -r "$1" "$SERVER_USER@$SERVER_HOST:$2"
}

# Function to check if command exists on server
command_exists() {
    remote_exec "command -v $1 >/dev/null 2>&1"
}

# Initial server setup
initial_setup() {
    echo -e "${BLUE}Performing initial server setup...${NC}"
    
    # Update system packages
    echo "Updating system packages..."
    remote_exec "sudo apt update && sudo apt upgrade -y"
    
    # Install required packages
    echo "Installing required packages..."
    remote_exec "sudo apt install -y curl wget gnupg2 software-properties-common ufw"
    
    # Install Node.js (via NodeSource)
    if ! command_exists node; then
        echo "Installing Node.js..."
        remote_exec "curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -"
        remote_exec "sudo apt install -y nodejs"
    fi
    
    # Install PM2 for process management
    if ! command_exists pm2; then
        echo "Installing PM2..."
        remote_exec "sudo npm install -g pm2"
    fi
    
    # Install Caddy
    if ! command_exists caddy; then
        echo "Installing Caddy..."
        remote_exec "sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https"
        remote_exec "curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg"
        remote_exec "curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list"
        remote_exec "sudo apt update && sudo apt install -y caddy"
    fi
    
    # Configure firewall
    echo "Configuring firewall..."
    remote_exec "sudo ufw --force reset"
    remote_exec "sudo ufw default deny incoming"
    remote_exec "sudo ufw default allow outgoing"
    remote_exec "sudo ufw allow ssh"
    remote_exec "sudo ufw allow 80"
    remote_exec "sudo ufw allow 443"
    remote_exec "sudo ufw --force enable"
    
    # Create application directories
    echo "Creating application directories..."
    remote_exec "sudo mkdir -p $SERVER_APP_DIR"
    remote_exec "sudo mkdir -p $BACKUP_DIR"
    remote_exec "sudo mkdir -p /var/log/caddy"
    remote_exec "sudo mkdir -p /var/www/shared/ssl"
    remote_exec "sudo chown -R $SERVER_USER:$SERVER_USER /var/www"
    remote_exec "sudo chown -R caddy:caddy /var/log/caddy"
    
    echo -e "${GREEN}✓ Initial server setup completed${NC}"
}

# Build application locally
build_application() {
    echo -e "${BLUE}Building application locally...${NC}"
    
    # Build frontend
    echo "Building React frontend..."
    npm run build
    
    # Build backend
    echo "Building Express backend..."
    cd backend
    npm run build
    cd ..
    
    echo -e "${GREEN}✓ Application built successfully${NC}"
}

# Deploy application files
deploy_files() {
    echo -e "${BLUE}Deploying application files...${NC}"
    
    # Create backup of current deployment
    if [ "$DEPLOY_MODE" = "update" ]; then
        echo "Creating backup..."
        remote_exec "sudo mkdir -p $BACKUP_DIR/$(date +%Y%m%d_%H%M%S)"
        remote_exec "sudo cp -r $SERVER_APP_DIR/* $BACKUP_DIR/$(date +%Y%m%d_%H%M%S)/ 2>/dev/null || true"
    fi
    
    # Copy built frontend
    echo "Deploying frontend files..."
    copy_to_server "build/" "$SERVER_APP_DIR/"
    
    # Copy backend files
    echo "Deploying backend files..."
    copy_to_server "backend/" "$SERVER_APP_DIR/backend/"
    
    # Copy configuration files
    echo "Deploying configuration files..."
    copy_to_server "Caddyfile" "/tmp/Caddyfile"
    copy_to_server "ecosystem.config.js" "$SERVER_APP_DIR/"
    
    # Move Caddyfile to proper location
    remote_exec "sudo mv /tmp/Caddyfile /etc/caddy/Caddyfile"
    remote_exec "sudo chown caddy:caddy /etc/caddy/Caddyfile"
    
    # Install backend dependencies on server
    echo "Installing backend dependencies..."
    remote_exec "cd $SERVER_APP_DIR/backend && npm ci --only=production"
    
    echo -e "${GREEN}✓ Files deployed successfully${NC}"
}

# Configure services
configure_services() {
    echo -e "${BLUE}Configuring services...${NC}"
    
    # Start/restart backend with PM2
    echo "Configuring PM2 services..."
    remote_exec "cd $SERVER_APP_DIR && pm2 delete journal-backend 2>/dev/null || true"
    remote_exec "cd $SERVER_APP_DIR && pm2 start ecosystem.config.js"
    remote_exec "pm2 save"
    remote_exec "pm2 startup | grep 'sudo' | sh || true"
    
    # Configure and start Caddy
    echo "Configuring Caddy..."
    remote_exec "sudo systemctl enable caddy"
    remote_exec "sudo systemctl restart caddy"
    
    # Wait for services to start
    sleep 10
    
    echo -e "${GREEN}✓ Services configured successfully${NC}"
}

# Health check
health_check() {
    echo -e "${BLUE}Performing health checks...${NC}"
    
    # Check PM2 processes
    echo "Checking backend process..."
    if remote_exec "pm2 list | grep -q 'journal-backend.*online'"; then
        echo -e "${GREEN}✓ Backend process is running${NC}"
    else
        echo -e "${RED}✗ Backend process failed to start${NC}"
        remote_exec "pm2 logs journal-backend --lines 20"
        exit 1
    fi
    
    # Check Caddy service
    echo "Checking Caddy service..."
    if remote_exec "systemctl is-active --quiet caddy"; then
        echo -e "${GREEN}✓ Caddy service is running${NC}"
    else
        echo -e "${RED}✗ Caddy service failed to start${NC}"
        remote_exec "sudo systemctl status caddy"
        exit 1
    fi
    
    # Test HTTP endpoints
    echo "Testing HTTP endpoints..."
    sleep 5  # Give time for certificates to be obtained
    
    # Test API endpoint (internal)
    if remote_exec "curl -s http://localhost:3001/api/health >/dev/null"; then
        echo -e "${GREEN}✓ Backend API responding${NC}"
    else
        echo -e "${YELLOW}⚠ Backend API not responding (may still be starting)${NC}"
    fi
    
    echo -e "${GREEN}✓ Health checks completed${NC}"
}

# Display deployment information
show_info() {
    echo ""
    echo -e "${BLUE}Deployment Complete!${NC}"
    echo "========================================"
    echo -e "Frontend: ${GREEN}https://journal.$DOMAIN${NC}"
    echo -e "Backend API: ${GREEN}https://api.$DOMAIN${NC}"
    echo ""
    echo "Server Management Commands:"
    echo "ssh -i $SSH_KEY $SERVER_USER@$SERVER_HOST"
    echo ""
    echo "PM2 Process Management:"
    echo "pm2 list                    # List all processes"
    echo "pm2 logs journal-backend    # View backend logs"
    echo "pm2 restart journal-backend # Restart backend"
    echo "pm2 monit                   # Process monitoring"
    echo ""
    echo "Caddy Management:"
    echo "sudo systemctl status caddy      # Check Caddy status"
    echo "sudo systemctl reload caddy      # Reload configuration"
    echo "sudo caddy validate --config /etc/caddy/Caddyfile  # Validate config"
    echo ""
    echo "Logs:"
    echo "sudo tail -f /var/log/caddy/journal.log  # Frontend logs"
    echo "sudo tail -f /var/log/caddy/api.log      # API logs"
    echo "pm2 logs journal-backend                 # Backend application logs"
}

# Rollback function
rollback() {
    echo -e "${YELLOW}Rolling back to previous deployment...${NC}"
    
    # Find latest backup
    LATEST_BACKUP=$(remote_exec "ls -t $BACKUP_DIR | head -1")
    
    if [ -z "$LATEST_BACKUP" ]; then
        echo -e "${RED}No backup found for rollback${NC}"
        exit 1
    fi
    
    echo "Rolling back to: $LATEST_BACKUP"
    
    # Stop services
    remote_exec "pm2 delete journal-backend 2>/dev/null || true"
    remote_exec "sudo systemctl stop caddy"
    
    # Restore files
    remote_exec "sudo rm -rf $SERVER_APP_DIR/*"
    remote_exec "sudo cp -r $BACKUP_DIR/$LATEST_BACKUP/* $SERVER_APP_DIR/"
    remote_exec "sudo chown -R $SERVER_USER:$SERVER_USER $SERVER_APP_DIR"
    
    # Restart services
    configure_services
    health_check
    
    echo -e "${GREEN}✓ Rollback completed${NC}"
}

# Main deployment logic
main() {
    case $DEPLOY_MODE in
        "initial")
            initial_setup
            build_application
            deploy_files
            configure_services
            health_check
            show_info
            ;;
        "update")
            build_application
            deploy_files
            configure_services
            health_check
            show_info
            ;;
        "rollback")
            rollback
            show_info
            ;;
        *)
            echo "Usage: $0 [initial|update|rollback]"
            exit 1
            ;;
    esac
}

# Run main function
main