#!/bin/bash

# Server Setup Script - Run this interactively on your server
# This script requires sudo access and will prompt for password once

set -e

echo "Contact Journal Server Setup Script"
echo "===================================="
echo "This script will set up Caddy and configure your production environment"
echo "You'll be prompted for your sudo password once at the beginning"
echo ""

# Get sudo access upfront
sudo -v

# Keep sudo alive during script execution
while true; do sudo -n true; sleep 60; kill -0 "$$" || exit; done 2>/dev/null &

echo "Installing Caddy..."
sudo apt update
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install -y caddy

echo "Setting up directories..."
sudo mkdir -p /var/www/journal/build
sudo mkdir -p /var/log/caddy
sudo mkdir -p /var/log/pm2

echo "Copying application files..."
sudo cp -r ~/contact-journal/build/* /var/www/journal/build/
sudo cp -r ~/contact-journal/backend /var/www/journal/

echo "Setting permissions..."
sudo chown -R www-data:www-data /var/www/journal
sudo chown -R caddy:caddy /var/log/caddy

echo "Updating Caddyfile paths..."
# Update paths in Caddyfile
sudo sed -i 's|/var/www/journal|/var/www/journal|g' ~/contact-journal/Caddyfile

echo "Installing Caddyfile..."
sudo cp ~/contact-journal/Caddyfile /etc/caddy/Caddyfile
sudo chown caddy:caddy /etc/caddy/Caddyfile

echo "Configuring firewall..."
sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable

echo "Starting Caddy service..."
sudo systemctl enable caddy
sudo systemctl restart caddy

echo "Setting up PM2..."
cd ~/contact-journal

# Create PM2 startup script
~/.npm-global/bin/pm2 startup systemd -u ddraper --hp /home/ddraper | grep sudo | bash

# Start backend
~/.npm-global/bin/pm2 delete all 2>/dev/null || true
~/.npm-global/bin/pm2 start simple-ecosystem.js
~/.npm-global/bin/pm2 save

echo ""
echo "✅ Setup Complete!"
echo "=================="
echo "Services Status:"
sudo systemctl status caddy --no-pager | head -10
echo ""
~/.npm-global/bin/pm2 list
echo ""
echo "Test your endpoints:"
echo "  Backend API: curl http://localhost:3001/api/health"
echo "  Caddy: sudo caddy validate --config /etc/caddy/Caddyfile"
echo ""
echo "After DNS is configured, your site will be available at:"
echo "  https://journal.transformativehelp.com"
echo "  https://api.transformativehelp.com"