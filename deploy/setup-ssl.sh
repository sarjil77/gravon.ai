#!/bin/bash
# ─────────────────────────────────────────────────────────────
# Gravon.ai — SSL Setup with Let's Encrypt
# Run on the VM after DNS is pointing to this server.
#
# Usage: bash deploy/setup-ssl.sh your-email@gmail.com
# ─────────────────────────────────────────────────────────────

set -euo pipefail

DOMAIN="gravon.ai"
EMAIL="${1:-}"

if [ -z "$EMAIL" ]; then
    echo "✗ Usage: bash deploy/setup-ssl.sh your-email@gmail.com"
    exit 1
fi

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEPLOY_DIR="$PROJECT_ROOT/deploy"

echo "╔══════════════════════════════════════════╗"
echo "║   Gravon.ai — SSL Setup                 ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "  Domain: $DOMAIN, www.$DOMAIN"
echo "  Email:  $EMAIL"
echo ""

# ── 1. Install certbot ──────────────────────────────────────
echo "→ Installing certbot..."
sudo apt-get update -qq
sudo apt-get install -y -qq certbot

# ── 2. Stop nginx to free port 80 ───────────────────────────
echo "→ Stopping nginx container..."
cd "$DEPLOY_DIR"
docker compose -f docker-compose.prod.yml stop nginx 2>/dev/null || true

# ── 3. Get certificate ──────────────────────────────────────
echo "→ Obtaining SSL certificate from Let's Encrypt..."
sudo certbot certonly --standalone \
    -d "$DOMAIN" \
    -d "www.$DOMAIN" \
    --non-interactive \
    --agree-tos \
    --email "$EMAIL"

echo "  ✓ SSL certificate obtained!"

# ── 4. Set up auto-renewal ──────────────────────────────────
echo "→ Setting up auto-renewal cron..."
# Certbot auto-renewal with pre/post hooks to handle nginx
CRON_CMD="0 3 * * * certbot renew --pre-hook 'cd $DEPLOY_DIR && docker compose -f docker-compose.prod.yml stop nginx' --post-hook 'cd $DEPLOY_DIR && docker compose -f docker-compose.prod.yml start nginx' --quiet"
(sudo crontab -l 2>/dev/null | grep -v certbot; echo "$CRON_CMD") | sudo crontab -
echo "  ✓ Auto-renewal cron configured (runs daily at 3am)"

# ── 5. Switch to SSL nginx config ────────────────────────────
echo "→ Switching nginx to HTTPS config..."
cp "$DEPLOY_DIR/nginx/nginx-ssl.conf" "$DEPLOY_DIR/nginx/nginx.conf"
echo "  ✓ nginx config updated for HTTPS"

# ── 6. Restart services with new SSL config ─────────────────
echo "→ Restarting services with HTTPS..."
cd "$DEPLOY_DIR"
docker compose -f docker-compose.prod.yml up -d

# ── 7. Wait for health ──────────────────────────────────────
echo "→ Waiting for backend..."
for i in $(seq 1 30); do
    if curl -sf https://$DOMAIN/api/health >/dev/null 2>&1; then
        echo "  ✓ Backend is healthy over HTTPS"
        break
    fi
    if [ "$i" -eq 30 ]; then
        echo "  ⚠ Health check timed out — checking HTTP fallback..."
        curl -sf http://localhost/api/health >/dev/null 2>&1 && echo "  ✓ Backend reachable via localhost" || echo "  ✗ Backend not responding"
    fi
    sleep 1
done

# ── 8. Done ─────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   ✓ SSL Setup Complete!                 ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "  Site:    https://$DOMAIN"
echo "  API:     https://$DOMAIN/api/health"
echo ""
echo "  Next: Set Telegram webhook:"
echo "  curl -X POST \"https://api.telegram.org/bot8529097920:AAHh2HRl7vB1-bGePnW_UFy0izG2pFZoAzc/setWebhook?url=https://$DOMAIN/api/telegram/webhook\"
  
  Update Stripe webhook URL in Stripe Dashboard to:
    https://$DOMAIN/api/credits/webhook"
echo ""
