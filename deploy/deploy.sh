#!/bin/bash
# ─────────────────────────────────────────────────────────────
# Gravon.ai — Deploy / Update Script
# Run from the project root: bash deploy/deploy.sh
# ─────────────────────────────────────────────────────────────

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEPLOY_DIR="$PROJECT_ROOT/deploy"

echo "╔══════════════════════════════════════════╗"
echo "║   Gravon.ai — Deploying...              ║"
echo "╚══════════════════════════════════════════╝"

# ── 1. Verify .env exists ───────────────────────────────────
if [ ! -f "$PROJECT_ROOT/backend/.env" ]; then
    echo "✗ ERROR: backend/.env not found!"
    echo "  Copy backend/.env.example to backend/.env and fill in your keys."
    exit 1
fi

# ── 2. Build frontend ───────────────────────────────────────
echo "→ Building frontend..."
cd "$PROJECT_ROOT/frontend"

# Install deps if node_modules missing
if [ ! -d "node_modules" ]; then
    echo "  Installing npm dependencies..."
    npm install --production=false
fi

# Build the React app
npm run build
echo "  ✓ Frontend built"

# Copy dist to deploy directory for Nginx to serve
rm -rf "$DEPLOY_DIR/frontend-dist"
cp -r dist "$DEPLOY_DIR/frontend-dist"
echo "  ✓ Frontend dist copied to deploy/frontend-dist"

# ── 3. Build & start services ───────────────────────────────
echo "→ Building Docker images..."
cd "$DEPLOY_DIR"
docker compose -f docker-compose.prod.yml build --no-cache

echo "→ Starting services..."
docker compose -f docker-compose.prod.yml up -d --force-recreate

# ── 4. Health check ─────────────────────────────────────────
echo "→ Waiting for backend to be ready..."
for i in $(seq 1 60); do
    if curl -sf http://localhost/api/health >/dev/null 2>&1; then
        echo "  ✓ Backend is healthy (${i}s)"
        break
    fi
    if [ "$i" -eq 60 ]; then
        echo "  ✗ Backend did not become healthy in 60s"
        echo "  Backend logs:"
        docker compose -f docker-compose.prod.yml logs backend --tail 20
        echo "  Nginx logs:"
        docker compose -f docker-compose.prod.yml logs nginx --tail 20
        exit 1
    fi
    sleep 1
done

# ── 5. Show status ──────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   ✓ Deployment Complete!                ║"
echo "╚══════════════════════════════════════════╝"
echo ""
docker compose -f docker-compose.prod.yml ps
echo ""

# Get external IP
EXTERNAL_IP=$(curl -sf http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip -H "Metadata-Flavor: Google" 2>/dev/null || echo "unknown")
if [ "$EXTERNAL_IP" != "unknown" ]; then
    echo "  Frontend: http://$EXTERNAL_IP"
    echo "  API:      http://$EXTERNAL_IP/api/health"
else
    echo "  Frontend: http://YOUR_VM_IP"
    echo "  API:      http://YOUR_VM_IP/api/health"
fi
echo ""
echo "Useful commands:"
echo "  Logs:    cd deploy && docker compose -f docker-compose.prod.yml logs -f"
echo "  Restart: cd deploy && docker compose -f docker-compose.prod.yml restart"
echo "  Stop:    cd deploy && docker compose -f docker-compose.prod.yml down"
echo ""
