#!/bin/bash
# ─────────────────────────────────────────────────────────────
#  WordWise — EC2 server setup script
#  Run this ONCE on a fresh Ubuntu 24.04 EC2 instance.
#  Usage: bash setup-ec2.sh
# ─────────────────────────────────────────────────────────────

set -e
echo ""
echo "======================================"
echo "  WordWise EC2 Setup"
echo "======================================"

# ── 1. System update ──────────────────────────────────────────
echo ""
echo "[1/6] Updating system packages..."
sudo apt update -y && sudo apt upgrade -y

# ── 2. Install Node.js 20 LTS ─────────────────────────────────
echo ""
echo "[2/6] Installing Node.js 20 LTS..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
echo "Node: $(node --version) | npm: $(npm --version)"

# ── 3. Install PM2 ────────────────────────────────────────────
echo ""
echo "[3/6] Installing PM2..."
sudo npm install -g pm2

# ── 4. Install dependencies ───────────────────────────────────
echo ""
echo "[4/6] Installing app dependencies..."
cd ~/wordwise-server
npm install --omit=dev

# ── 5. Set NODE_ENV to production ─────────────────────────────
echo ""
echo "[5/6] Setting NODE_ENV=production in .env..."
if grep -q "^NODE_ENV=" .env; then
    sed -i 's/^NODE_ENV=.*/NODE_ENV=production/' .env
else
    echo "NODE_ENV=production" >> .env
fi

# ── 6. Start app with PM2 ─────────────────────────────────────
echo ""
echo "[6/6] Starting app with PM2..."
pm2 delete wordwise-server 2>/dev/null || true
pm2 start server.js --name wordwise-server --time
pm2 save

# Enable PM2 on reboot
echo ""
echo "Enabling PM2 startup on reboot..."
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu
pm2 save

# ── Done ──────────────────────────────────────────────────────
echo ""
echo "======================================"
echo "  ✅ Setup complete!"
echo "======================================"
echo ""
echo "  API running at: http://$(curl -s ifconfig.me):3000"
echo ""
echo "  Useful commands:"
echo "    pm2 status                  → check app status"
echo "    pm2 logs wordwise-server    → view live logs"
echo "    pm2 restart wordwise-server → restart app"
echo "    pm2 stop wordwise-server    → stop app"
echo ""
