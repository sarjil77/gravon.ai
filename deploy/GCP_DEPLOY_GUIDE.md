# Gravon.ai — GCP Cloud Deployment Guide

## Overview
Deploy Gravon.ai to a Google Cloud Platform VM using Docker.

**Architecture:**
```
User → [GCP VM: Nginx :80] → /api/* → [Backend :8000]
                            → /*    → [Static React files]
                            
Backend → [Docker] → OpenClaw containers (per tenant)
Backend → [Supabase] → Database (external)
Backend → [Stripe] → Payments (external)
```

---

## Step 1: Create GCP Account & Project

1. Go to https://cloud.google.com/free
2. Sign up — you'll get **$300 in free credits** for 90 days
3. Create a new project: `gravon-ai`
4. Enable the **Compute Engine API**:
   - Go to: APIs & Services → Enable APIs → Search "Compute Engine" → Enable

---

## Step 2: Create a VM Instance

### Option A: Via GCP Console (easiest)
1. Go to **Compute Engine** → **VM Instances** → **Create Instance**
2. Configure:
   - **Name:** `gravon-prod`
   - **Region:** `us-central1` (cheapest) or nearest to your users
   - **Machine type:** `e2-small` (2 vCPU, 2GB RAM) — **~$13/month**
     - OR `e2-medium` (2 vCPU, 4GB) for better performance — **~$25/month**
   - **Boot disk:** Ubuntu 22.04 LTS, 30GB SSD
   - **Firewall:** ✅ Allow HTTP traffic, ✅ Allow HTTPS traffic
3. Click **Create**

### Option B: Via gcloud CLI
```bash
gcloud compute instances create gravon-prod \
  --zone=us-central1-a \
  --machine-type=e2-small \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=30GB \
  --boot-disk-type=pd-ssd \
  --tags=http-server,https-server

# Create firewall rules (if not already present)
gcloud compute firewall-rules create allow-http \
  --allow=tcp:80 --target-tags=http-server
gcloud compute firewall-rules create allow-https \
  --allow=tcp:443 --target-tags=http-server
```

---

## Step 3: SSH into VM & Run Setup

```bash
# SSH via GCP Console (click SSH button) or:
gcloud compute ssh gravon-prod --zone=us-central1-a
```

Once SSHed in:
```bash
# Download and run the setup script
# (or copy deploy/setup-vm.sh to the VM and run it)
bash setup-vm.sh
```

This installs Docker, configures firewall, creates swap, etc.

---

## Step 4: Deploy the Application

### Option A: Copy files directly (no Git)
From your local machine:
```bash
# Create a tarball of the project (exclude node_modules, .venv, etc.)
tar czf gravon.tar.gz \
  --exclude=node_modules \
  --exclude=.venv \
  --exclude=__pycache__ \
  --exclude=.git \
  --exclude=frontend/dist \
  -C /path/to/gravon-ai .

# Copy to VM
gcloud compute scp gravon.tar.gz gravon-prod:/opt/gravon/ --zone=us-central1-a

# SSH in and extract
gcloud compute ssh gravon-prod --zone=us-central1-a
cd /opt/gravon
tar xzf gravon.tar.gz
rm gravon.tar.gz
```

### Option B: Use Git (recommended)
```bash
cd /opt/gravon
git clone https://github.com/YOUR_USERNAME/gravon-ai.git .
```

### Then deploy:
```bash
# Edit the .env file with your production keys
nano backend/.env

# Run the deploy script
bash deploy/deploy.sh
```

---

## Step 5: Verify

```bash
# Check services are running
cd /opt/gravon/deploy
docker compose -f docker-compose.prod.yml ps

# Check logs
docker compose -f docker-compose.prod.yml logs backend -f

# Test API
curl http://localhost/api/health
# Should return: {"status":"healthy","service":"Gravon-ai"}
```

Then open `http://YOUR_VM_IP` in a browser.

---

## Step 6: Update Stripe Webhook URL

Once your VM is live, update the Stripe webhook endpoint:

1. Go to https://dashboard.stripe.com/webhooks
2. Add endpoint: `http://YOUR_VM_IP/api/credits/webhook`
3. Select event: `checkout.session.completed`
4. Copy the webhook signing secret
5. Update `backend/.env`: `STRIPE_WEBHOOK_SECRET=whsec_...`
6. Restart: `cd /opt/gravon/deploy && docker compose -f docker-compose.prod.yml restart backend`

---

## Step 7: Add Custom Domain (Optional, Later)

When you're ready to use `gravon.ai`:

1. Point your domain's DNS A record to the VM's external IP
2. Uncomment the certbot service in `docker-compose.prod.yml`
3. Run:
   ```bash
   # Get SSL certificate
   docker run -it --rm \
     -v /opt/gravon/deploy/certbot/conf:/etc/letsencrypt \
     -v /opt/gravon/deploy/certbot/www:/var/www/certbot \
     certbot/certbot certonly --webroot \
     --webroot-path=/var/www/certbot \
     -d gravon.ai -d www.gravon.ai
   ```
4. Update `nginx.conf` to add HTTPS server block
5. Restart nginx

---

## Estimated Monthly Cost (GCP)

| Resource | Spec | Cost |
|----------|------|------|
| VM (e2-small) | 2 vCPU, 2GB RAM | ~$13/mo |
| Boot disk | 30GB SSD | ~$5/mo |
| Network egress | ~10GB | ~$1/mo |
| **Total** | | **~$19/mo** |

*First 90 days: FREE with $300 credits*

---

## Useful Commands

```bash
# View logs
cd /opt/gravon/deploy
docker compose -f docker-compose.prod.yml logs -f

# Restart all services
docker compose -f docker-compose.prod.yml restart

# Rebuild after code changes
docker compose -f docker-compose.prod.yml up -d --build

# Stop everything
docker compose -f docker-compose.prod.yml down

# Check disk space
df -h

# Check resource usage
htop
docker stats
```
