# WhatsApp Auto-Approver: Cloud VPS Deployment Guide

Deploy the WhatsApp group auto-approver bot to a Linux VPS for 24/7 operation.

## Prerequisites

### 1. VPS Requirements
- **OS**: Ubuntu 20.04 LTS or later (recommended DigitalOcean, AWS, Linode, Vultr)
- **CPU**: 1 vCPU minimum (2 vCPU recommended for Chromium)
- **RAM**: 2GB minimum (4GB recommended)
- **Disk**: 20GB SSD
- **Network**: Stable internet, allow outbound HTTPS

### 2. Credentials You'll Need
Gather these BEFORE deployment:

| Item | Where to Find | Example |
|------|---------------|---------|
| **GrowthX API Bearer Token** | From your GrowthX dashboard | `Bearer eyJhbGc...` |
| **Google Sheet ID** | From your sheet URL | `1axEuQqoaGT6b5...` |
| **Admin WhatsApp Number** | Your phone number | `+91XXXXXXXXXX` |
| **Telegram Bot Token** (optional) | @BotFather on Telegram | `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11` |
| **Telegram Chat ID** (optional) | Send `/start` to bot, get ID | `987654321` |

---

## Step 1: Provision VPS

### Option A: DigitalOcean (Recommended)
1. Sign up at [digitalocean.com](https://digitalocean.com)
2. Create Droplet:
   - Image: **Ubuntu 20.04 LTS**
   - Size: **$6/mo** (2GB RAM, 1 vCPU, 50GB SSD)
   - Region: Choose nearest to you
3. Add SSH key (or set root password)
4. Create Droplet
5. Wait ~1 min, then SSH in:
   ```bash
   ssh root@<droplet-ip>
   ```

### Option B: AWS, Linode, Vultr
Similar process — create Ubuntu 20.04 LTS instance, note the IP address.

---

## Step 2: Prepare VPS

SSH into your VPS and run these commands:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Chromium dependencies (required for Puppeteer)
sudo apt install -y \
  chromium-browser \
  fonts-noto-cjk \
  xvfb \
  libxss1 \
  libappindicator1 \
  libindicator7

# Install git
sudo apt install -y git

# Create app user (optional but recommended)
sudo useradd -m -s /bin/bash wabot
sudo su - wabot

# Verify Node/npm
node -v   # Should be v18+
npm -v    # Should be 9+
```

---

## Step 3: Deploy Bot Code

From your VPS (as `wabot` user or root):

```bash
# Clone or copy the bot code
# Option 1: If you have it in git
git clone https://github.com/your-repo/wa-auto-approve.git
cd wa-auto-approve

# Option 2: SCP from your Mac
# From your Mac:
scp -r /Users/aquib/claude\ code/wa-auto-approve/* root@<droplet-ip>:/home/wabot/wa-auto-approve/

# Then SSH in and:
cd /home/wabot/wa-auto-approve

# Install dependencies
npm install
```

---

## Step 4: Configure via Google Sheet (No SSH Needed!)

**ALL configuration now comes from a Google Sheet tab.** No `.env` files, no SSH config needed.

Follow [CONFIG-SHEET-SETUP.md](./CONFIG-SHEET-SETUP.md):

1. **Add a "Config" tab** to your existing Google Sheet
2. **Add these rows** (Column A = Key, Column B = Value):
   ```
   GROWTHX_API_KEY    Bearer YOUR_TOKEN_HERE
   TELEGRAM_BOT_TOKEN (optional)
   TELEGRAM_CHAT_ID   (optional)
   ALERT_WEBHOOK_URL  (optional)
   ROSTER_WEBHOOK_URL (optional)
   MIN_AMOUNT         100
   MAX_AMOUNT         300
   DAYS_BACK          14
   ```
3. **Share the sheet** with "Anyone with link" access
4. Done — bot auto-syncs every 12-18 min

That's it. No configuration files on VPS. Everything is in your Google Sheet. ✅

---

## Step 5: Set Up pm2 (Process Manager)

Install pm2 globally:

```bash
sudo npm install -g pm2@7.0.3
```

Create pm2 config (`ecosystem.config.js`):

```bash
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'wa-approver',
      script: 'index.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
      env_production: {
        NODE_ENV: 'production',
      },
      error_file: './logs/wa-approver-error.log',
      out_file: './logs/wa-approver-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      max_memory_restart: '500M',
      instances: 1,
      watch: false,
      ignore_watch: ['node_modules', '.wa-session', 'logs'],
    },
    {
      name: 'wa-watchdog',
      script: 'watchdog.js',
      instances: 1,
      exec_mode: 'fork',
      error_file: './logs/watchdog-error.log',
      out_file: './logs/watchdog-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      max_memory_restart: '200M',
      watch: false,
    },
    {
      name: 'pm2-logrotate',
      script: 'pm2-logrotate',
      instances: 1,
      exec_mode: 'fork',
      args: '--max-size 10M --max-files 14 --compress',
    },
  ],
};
EOF
```

Start with pm2:

```bash
# Start both services
pm2 start ecosystem.config.js

# Save startup config
pm2 save

# Set up auto-restart on reboot (Linux)
sudo pm2 startup systemd -u wabot --hp /home/wabot
# Copy and run the command it outputs

# Verify
pm2 list
pm2 logs wa-approver
```

---

## Step 6: Initial QR Scan

The bot will display a QR code on first run. You have two options:

### Option A: Use Terminal UI
```bash
cd /home/wabot/wa-auto-approve
pm2 logs wa-approver
```

Watch for the QR code in the logs. Copy it to a file and scan from your phone:
```bash
# In another terminal on VPS:
tail -50 ~/.pm2/logs/wa-approver-out.log | grep -A 30 "Scan this QR"
```

### Option B: Use Xvfb (Virtual Display) [Advanced]
```bash
# Install X display server
sudo apt install -y xvfb x11-utils

# Start virtual display
Xvfb :99 -screen 0 1920x1080x24 &
export DISPLAY=:99

# Run bot (will render in Xvfb, can screenshot)
pm2 stop wa-approver
pm2 start wa-approver

# Get screenshot
import -window root screenshot.png
# SCP it to your Mac to scan
```

**After scanning:** Bot will auto-restart loops within 1-2 minutes.

---

## Step 7: Optional - Set Up Alerts

### Telegram Notifications
1. Message [@BotFather](https://t.me/botfather) on Telegram
2. Create new bot: `/newbot`
3. Copy bot token → paste in `.env.production` as `TELEGRAM_BOT_TOKEN`
4. Message your new bot once
5. Get your chat ID: `curl "https://api.telegram.org/bot<TOKEN>/getUpdates"`
6. Copy `message.chat.id` → paste in `.env.production` as `TELEGRAM_CHAT_ID`
7. Restart:
   ```bash
   pm2 restart wa-approver
   ```

### Generic Webhook (Slack, n8n, Zapier)
Set `ALERT_WEBHOOK_URL` in `.env.production` to your webhook endpoint.

---

## Step 8: Optional - Roster Google Sheet Integration

Follow [roster-appscript.gs](./roster-appscript.gs) setup:
1. Open your Google Sheet
2. Extensions → Apps Script
3. Paste contents of `roster-appscript.gs`
4. Save and Deploy as Web App
5. Copy deployed URL
6. Paste into `ROSTER_WEBHOOK_URL` in `.env.production`
7. Restart: `pm2 restart wa-approver`

---

## Monitoring & Maintenance

### Check Logs
```bash
# Real-time logs
pm2 logs wa-approver

# Last 100 lines
pm2 logs wa-approver --lines 100

# Error logs only
pm2 logs wa-approver --err
```

### View Status
```bash
pm2 status
pm2 show wa-approver
```

### Restart (if needed)
```bash
pm2 restart wa-approver
pm2 restart all
```

### View Current Stats
```bash
# SSH into VPS and check
cat ~/.pm2/logs/status.json
```

### Daily EOD Summary
Bot auto-WhatsApps you summary at **9 PM IST**. Check:
```bash
# Member roster audit at 7 PM & 10 AM IST (optional, sent to sheet if configured)
tail ~/.pm2/logs/wa-approver-out.log | grep "Roster"
```

---

## Troubleshooting

### Bot stuck after restart
```bash
# Kill stray Chromium processes
pkill -9 chromium-browser

# Restart
pm2 restart wa-approver
```

### QR scan not working
- Verify your admin phone is connected to internet
- Try scanning again (QR expires after ~60 seconds)
- If persistent, check: `pm2 logs wa-approver | grep -i "error"`

### High memory usage
```bash
# Check memory
pm2 show wa-approver

# Restart (auto-resets memory)
pm2 restart wa-approver

# If still high, increase max_memory_restart in ecosystem.config.js
```

### Google Sheet not syncing
```bash
# Check URL format
grep "SHEET_CSV_URL" .env.production

# Verify access: curl the URL (should return CSV)
curl "https://docs.google.com/spreadsheets/d/YOUR_ID/export?format=csv&gid=0"
```

---

## Costs

| Item | Cost | Notes |
|------|------|-------|
| **VPS (2GB RAM, 1 vCPU)** | $6–12/mo | DigitalOcean, Linode, AWS EC2 |
| **WhatsApp API** | $0 | Using Web protocol, no charges |
| **Google Sheets** | $0 | Free tier sufficient |
| **Telegram** | $0 | Free |
| **Total/Month** | ~$6–12 | Cloud only; Mac local is free |

---

## Next Steps

1. **Choose VPS provider** (DigitalOcean recommended)
2. **Gather credentials** (GrowthX token, Sheet ID, etc.)
3. **Follow steps 1–6** above
4. **Verify bot is live**: `pm2 logs wa-approver | grep "Live:"`
5. **Test first approval**: Send a test WhatsApp request to a group
6. **Monitor EOD summary** at 9 PM IST

Questions? Check logs: `pm2 logs wa-approver`
