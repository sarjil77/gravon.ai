#!/bin/bash
# ─────────────────────────────────────────────────────────────
# Gravon.ai — GCP VM Initial Setup Script
# Run this once on a fresh Ubuntu 22.04/24.04 VM
#
# Usage: ssh into VM, then:
#   curl -sSL https://raw.githubusercontent.com/YOUR_REPO/deploy/setup-vm.sh | bash
#   OR copy this file and run: bash setup-vm.sh
# ─────────────────────────────────────────────────────────────

set -euo pipefail

echo "╔══════════════════════════════════════════╗"
echo "║   Gravon.ai — VM Setup                  ║"
echo "╚══════════════════════════════════════════╝"

# ── 1. System updates ───────────────────────────────────────
echo "→ Updating system packages..."
sudo apt-get update -qq
sudo apt-get upgrade -y -qq

# ── 2. Install Docker ───────────────────────────────────────
echo "→ Installing Docker..."
if ! command -v docker &>/dev/null; then
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker "$USER"
    echo "  ✓ Docker installed. You may need to log out/in for group changes."
else
    echo "  ✓ Docker already installed."
fi

# ── 3. Install Docker Compose (plugin) ──────────────────────
echo "→ Ensuring Docker Compose plugin..."
sudo apt-get install -y -qq docker-compose-plugin 2>/dev/null || true
docker compose version

# ── 4. Install Node.js 20 (needed to build frontend) ────────
echo "→ Installing Node.js 20..."
if ! command -v node &>/dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y -qq nodejs
    echo "  ✓ Node.js $(node -v) installed"
else
    echo "  ✓ Node.js $(node -v) already installed"
fi

# ── 5. Install useful tools ─────────────────────────────────
echo "→ Installing utilities..."
sudo apt-get install -y -qq git curl wget htop unzip jq

# ── 6. Create app directory ─────────────────────────────────
APP_DIR="/opt/gravon"
echo "→ Creating app directory at $APP_DIR..."
sudo mkdir -p "$APP_DIR"
sudo chown "$USER:$USER" "$APP_DIR"

# ── 7. Firewall rules ───────────────────────────────────────
echo "→ Configuring firewall..."
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw --force enable
echo "  ✓ Firewall configured (22, 80, 443 open)"

# ── 8. Create swap (for e2-micro/small instances) ───────────
if [ ! -f /swapfile ]; then
    echo "→ Creating 2GB swap file..."
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab >/dev/null
    echo "  ✓ Swap configured"
else
    echo "  ✓ Swap already exists"
fi

# ── 9. Docker log rotation ──────────────────────────────────
echo "→ Configuring Docker log rotation..."
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json >/dev/null <<'EOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF
sudo systemctl restart docker

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   ✓ VM Setup Complete!                  ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo "  1. Clone your repo:  cd /opt/gravon && git clone <repo-url> ."
echo "  2. Add .env file:    cp backend/.env.example backend/.env && nano backend/.env"
echo "  3. Deploy:           bash deploy/deploy.sh"
echo ""
