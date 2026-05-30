#!/bin/bash
# ProteinHouse — EC2 first-time server setup
# Target OS: Amazon Linux 2023
# Run once after launching a fresh EC2 instance:
#   ssh ec2-user@<YOUR-EC2-IP>
#   curl -O https://raw.githubusercontent.com/YOUR/repo/main/setup-ec2.sh
#   bash setup-ec2.sh

set -e

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║   ProteinHouse — EC2 Server Setup            ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# ── 1. System update ──────────────────────────────────────────────────────────
echo "📦 Updating system packages..."
sudo dnf update -y --quiet

# ── 2. Node.js 20 via NodeSource ──────────────────────────────────────────────
echo "📦 Installing Node.js 20..."
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash - --quiet
sudo dnf install -y nodejs --quiet
echo "   Node $(node -v) · npm $(npm -v)"

# ── 3. PM2 ────────────────────────────────────────────────────────────────────
echo "📦 Installing PM2..."
sudo npm install -g pm2 --silent
echo "   PM2 $(pm2 -v)"

# ── 4. Nginx ──────────────────────────────────────────────────────────────────
echo "📦 Installing Nginx..."
sudo dnf install -y nginx --quiet
sudo systemctl enable nginx
sudo systemctl start nginx
echo "   Nginx $(nginx -v 2>&1 | head -1)"

# ── 5. Git ────────────────────────────────────────────────────────────────────
echo "📦 Ensuring git is installed..."
sudo dnf install -y git --quiet

# ── 6. Log directory ──────────────────────────────────────────────────────────
echo "📁 Creating log directory..."
sudo mkdir -p /var/log/proteinhouse
sudo chown ec2-user:ec2-user /var/log/proteinhouse

# ── 7. Clone the repo ─────────────────────────────────────────────────────────
echo ""
echo "📥 Cloning repository..."
cd /home/ec2-user

if [ -d "proteinhouse" ]; then
  echo "   Directory already exists — skipping clone."
else
  # Replace with your actual repo URL
  git clone https://github.com/YOUR_USERNAME/proteinhouse.git
fi

cd proteinhouse

# ── 8. Install deps & build ───────────────────────────────────────────────────
echo "📦 Installing dependencies..."
npm ci --omit=dev

echo "🔨 Building..."
npm run build

echo "📁 Copying public assets..."
cp -r public/* dist/client/ 2>/dev/null || true

# ── 9. Nginx config (no-domain / IP-only for now) ─────────────────────────────
echo "⚙️  Configuring Nginx (HTTP / IP-only mode)..."
sudo cp nginx-temp.conf /etc/nginx/conf.d/proteinhouse.conf
# Remove default server block to avoid port 80 conflict
sudo rm -f /etc/nginx/conf.d/default.conf
sudo nginx -t
sudo systemctl reload nginx

# ── 10. PM2 ───────────────────────────────────────────────────────────────────
echo "🚀 Starting app with PM2..."
pm2 start ecosystem.config.cjs --env production
pm2 save

# Autostart PM2 on reboot
echo "⚙️  Configuring PM2 autostart..."
PM2_STARTUP=$(pm2 startup systemd -u ec2-user --hp /home/ec2-user 2>&1 | grep "sudo")
if [ -n "$PM2_STARTUP" ]; then
  eval "$PM2_STARTUP"
fi
sudo systemctl enable pm2-ec2-user 2>/dev/null || true

# ── Done ──────────────────────────────────────────────────────────────────────
EC2_IP=$(curl -sf http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "<your-ec2-ip>")

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║   ✅  Setup complete!                                        ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "   App URL (HTTP):  http://${EC2_IP}"
echo ""
echo "   PM2 status:      pm2 status"
echo "   PM2 logs:        pm2 logs proteinhouse"
echo "   Nginx logs:      sudo tail -f /var/log/nginx/error.log"
echo ""
echo "   When domain is ready:"
echo "   1. Copy nginx.conf → /etc/nginx/conf.d/proteinhouse.conf"
echo "   2. sudo certbot --nginx -d proteinhouse.ba -d www.proteinhouse.ba"
echo "   3. sudo systemctl reload nginx"
echo ""
