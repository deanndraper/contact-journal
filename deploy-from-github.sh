#!/bin/bash

# =============================================================================
# GITHUB-TO-PRODUCTION DEPLOYMENT SCRIPT
# =============================================================================
#
# This script pulls the latest code from GitHub and deploys it to your 
# production server at transformativehelp.com. It handles both frontend 
# and backend updates with proper service management.
#
# PREREQUISITES:
# - Git repository access from the server
# - Node.js environment set up on server
# - PM2 and Caddy already configured
# - SSH access configured
#
# USAGE:
# ./deploy-from-github.sh [branch-name]
# Default branch: main
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
REPO_URL="https://github.com/deanndraper/contact-journal.git"
BRANCH=${1:-main}
SERVER_REPO_DIR="/home/ddraper/contact-journal-repo"
PRODUCTION_DIR="/var/www/journal"

echo -e "${BLUE}GitHub to Production Deployment${NC}"
echo "========================================"
echo "Branch: $BRANCH"
echo "Target: $SERVER_HOST"
echo ""

# Function to execute commands on remote server
remote_exec() {
    ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_HOST" "$1"
}

# Step 1: Clone or update repository on server
setup_repository() {
    echo -e "${BLUE}Step 1: Setting up repository on server...${NC}"
    
    # Check if repo exists, if not clone it
    if remote_exec "[ -d '$SERVER_REPO_DIR' ]"; then
        echo "Repository exists, updating..."
        remote_exec "cd $SERVER_REPO_DIR && git fetch origin && git reset --hard origin/$BRANCH"
    else
        echo "Cloning repository..."
        remote_exec "git clone $REPO_URL $SERVER_REPO_DIR"
        remote_exec "cd $SERVER_REPO_DIR && git checkout $BRANCH"
    fi
    
    echo -e "${GREEN}✓ Repository updated to latest $BRANCH${NC}"
}

# Step 2: Build frontend on server
build_frontend() {
    echo -e "${BLUE}Step 2: Building frontend...${NC}"
    
    # Install dependencies and build
    remote_exec "cd $SERVER_REPO_DIR && npm install"
    remote_exec "cd $SERVER_REPO_DIR && NODE_ENV=production npm run build"
    
    echo -e "${GREEN}✓ Frontend built successfully${NC}"
}

# Step 3: Build backend on server
build_backend() {
    echo -e "${BLUE}Step 3: Building backend...${NC}"
    
    # Install backend dependencies and build
    remote_exec "cd $SERVER_REPO_DIR/backend && npm install --only=production"
    remote_exec "cd $SERVER_REPO_DIR/backend && npm run build"
    
    echo -e "${GREEN}✓ Backend built successfully${NC}"
}

# Step 4: Deploy frontend files
deploy_frontend() {
    echo -e "${BLUE}Step 4: Deploying frontend files...${NC}"
    
    # Backup current frontend
    remote_exec "sudo cp -r $PRODUCTION_DIR /tmp/production-backup-$(date +%Y%m%d_%H%M%S)"
    
    # Copy new frontend build
    remote_exec "sudo rm -rf $PRODUCTION_DIR/static $PRODUCTION_DIR/*.html $PRODUCTION_DIR/*.js $PRODUCTION_DIR/*.css $PRODUCTION_DIR/*.json $PRODUCTION_DIR/*.txt $PRODUCTION_DIR/*.ico"
    remote_exec "sudo cp -r $SERVER_REPO_DIR/build/* $PRODUCTION_DIR/"
    remote_exec "sudo chown -R www-data:www-data $PRODUCTION_DIR"
    
    echo -e "${GREEN}✓ Frontend deployed${NC}"
}

# Step 5: Deploy backend files
deploy_backend() {
    echo -e "${BLUE}Step 5: Deploying backend files...${NC}"
    
    # Stop backend service
    remote_exec "~/.npm-global/bin/pm2 stop journal-backend || true"
    
    # Update backend files (preserve data and configs)
    remote_exec "sudo cp -r $SERVER_REPO_DIR/backend/dist/* $PRODUCTION_DIR/backend/dist/"
    remote_exec "sudo cp -r $SERVER_REPO_DIR/backend/node_modules $PRODUCTION_DIR/backend/" 
    remote_exec "sudo cp $SERVER_REPO_DIR/backend/package*.json $PRODUCTION_DIR/backend/"
    
    # Update prompts if they exist
    remote_exec "sudo cp -r $SERVER_REPO_DIR/backend/prompts $PRODUCTION_DIR/backend/ 2>/dev/null || true"
    
    # Fix CORS configuration for production
    remote_exec "sudo sed -i \"s|'http://localhost:3000'|['http://localhost:3000', 'https://journal.transformativehelp.com']|g\" $PRODUCTION_DIR/backend/dist/server.js"
    
    # Ensure proper permissions
    remote_exec "sudo chown -R ddraper:ddraper $PRODUCTION_DIR/backend"
    
    echo -e "${GREEN}✓ Backend deployed${NC}"
}

# Step 6: Restart services
restart_services() {
    echo -e "${BLUE}Step 6: Restarting services...${NC}"
    
    # Restart backend
    remote_exec "cd $PRODUCTION_DIR && ~/.npm-global/bin/pm2 start backend/dist/server.js --name journal-backend"
    remote_exec "~/.npm-global/bin/pm2 save"
    
    # Reload Caddy (in case of config changes)
    remote_exec "sudo systemctl reload caddy"
    
    # Wait for services to start
    sleep 5
    
    echo -e "${GREEN}✓ Services restarted${NC}"
}

# Step 7: Health checks
health_check() {
    echo -e "${BLUE}Step 7: Performing health checks...${NC}"
    
    # Check backend health
    if remote_exec "curl -s http://localhost:3001/api/health | grep -q 'success.*true'"; then
        echo -e "${GREEN}✓ Backend API is healthy${NC}"
    else
        echo -e "${RED}✗ Backend API health check failed${NC}"
        remote_exec "~/.npm-global/bin/pm2 logs journal-backend --lines 10"
        exit 1
    fi
    
    # Check frontend accessibility
    if remote_exec "curl -s -o /dev/null -w '%{http_code}' https://journal.transformativehelp.com/test.html | grep -q '200'"; then
        echo -e "${GREEN}✓ Frontend is accessible${NC}"
    else
        echo -e "${YELLOW}⚠ Frontend accessibility check inconclusive${NC}"
    fi
    
    # Check configuration loading
    if remote_exec "curl -s https://api.transformativehelp.com/api/config/journal | grep -q 'success.*true'"; then
        echo -e "${GREEN}✓ Configuration API is working${NC}"
    else
        echo -e "${RED}✗ Configuration API failed${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ All health checks passed${NC}"
}

# Step 8: Display deployment summary
show_summary() {
    echo ""
    echo -e "${BLUE}Deployment Complete!${NC}"
    echo "========================================"
    echo -e "Branch deployed: ${GREEN}$BRANCH${NC}"
    echo -e "Frontend: ${GREEN}https://journal.transformativehelp.com/${NC}"
    echo -e "Backend API: ${GREEN}https://api.transformativehelp.com/api/health${NC}"
    echo -e "Test URL: ${GREEN}https://journal.transformativehelp.com/abc123${NC}"
    echo ""
    echo "Management Commands:"
    echo "ssh -i $SSH_KEY $SERVER_USER@$SERVER_HOST"
    echo "~/.npm-global/bin/pm2 status"
    echo "sudo systemctl status caddy"
    echo ""
    echo "Next deployment: ./deploy-from-github.sh [branch-name]"
}

# Cleanup function for failed deployments
cleanup_failed_deployment() {
    echo -e "${RED}Deployment failed, attempting cleanup...${NC}"
    
    # Restore from backup if it exists
    LATEST_BACKUP=$(remote_exec "ls -t /tmp/production-backup-* 2>/dev/null | head -1 || echo ''")
    
    if [ ! -z "$LATEST_BACKUP" ]; then
        echo "Restoring from backup: $LATEST_BACKUP"
        remote_exec "sudo cp -r $LATEST_BACKUP/* $PRODUCTION_DIR/"
        remote_exec "sudo chown -R www-data:www-data $PRODUCTION_DIR"
    fi
    
    # Restart services
    remote_exec "cd $PRODUCTION_DIR && ~/.npm-global/bin/pm2 start backend/dist/server.js --name journal-backend || true"
    
    echo -e "${YELLOW}Cleanup completed. Check services manually.${NC}"
}

# Set trap for cleanup on failure
trap cleanup_failed_deployment ERR

# Main deployment sequence
main() {
    setup_repository
    build_frontend
    build_backend  
    deploy_frontend
    deploy_backend
    restart_services
    health_check
    show_summary
}

# Run main deployment
main