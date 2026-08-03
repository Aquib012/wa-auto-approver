# ✅ Google Sheet Configuration Implementation Complete

The bot has been updated to read **ALL configuration from your Google Sheet**. No more SSH, no environment files — just edit Google Sheets and the bot auto-syncs.

---

## What Changed

### Before
- Configuration in hardcoded values or `.env.production` files
- Need SSH access to VPS to change settings
- Changes require bot restart

### Now
- **Configuration in Google Sheet "Config" tab**
- No SSH needed
- Changes auto-sync every 12-18 minutes
- One source of truth: Your Google Sheet

---

## How to Set It Up

### Step 1: Add "Config" Tab to Your Sheet

Open your existing Google Sheet:  
`https://docs.google.com/spreadsheets/d/1axEuQqoaGT6b5niI5lk_MHERyTVLDx9OjqjhVPEZOjk`

1. Right-click on a sheet tab
2. Click "Insert 1 below"
3. Name it: **`Config`**
4. Click "Create"

### Step 2: Add Configuration Rows

In the new "Config" tab, add these rows (**Column A = Key**, **Column B = Value**):

| Column A | Column B |
|----------|----------|
| GROWTHX_API_KEY | Bearer YOUR_TOKEN_HERE |
| TELEGRAM_BOT_TOKEN | (leave empty for now) |
| TELEGRAM_CHAT_ID | (leave empty for now) |
| ALERT_WEBHOOK_URL | (leave empty for now) |
| ROSTER_WEBHOOK_URL | (leave empty for now) |
| MIN_AMOUNT | 100 |
| MAX_AMOUNT | 300 |
| DAYS_BACK | 14 |

**Important**: 
- Column A = exact key names (case-sensitive)
- Column B = your actual values
- For optional fields you don't use, leave Column B empty

### Step 3: Get Your GrowthX Token

1. Open your **GrowthX dashboard**
2. Go to **Settings → API** (or Developer)
3. Copy your **Bearer token** (format: `Bearer eyJhbGc...`)
4. Paste into Config sheet Column B for `GROWTHX_API_KEY`

### Step 4: Share Your Sheet

1. Click **Share** button
2. Change access to **"Anyone with the link"** → **"Viewer"**
3. Click **Done**

**Done!** Bot will sync this config on startup and every 12-18 minutes.

---

## How It Works

### Config Sync Flow

```
Bot Startup
    ↓
Sync from Config sheet
    ↓
Load GROWTHX_API_KEY, Telegram tokens, etc.
    ↓
Live and ready to approve
    ↓
Every 12-18 min: Re-sync Config sheet
    ↓
Changes take effect immediately (no restart needed)
```

### What Gets Synced

| Config | Purpose | Updates Every |
|--------|---------|-----------------|
| **GROWTHX_API_KEY** | API authentication | 12-18 min |
| **TELEGRAM_BOT_TOKEN** | Telegram alerts | 12-18 min |
| **TELEGRAM_CHAT_ID** | Telegram alerts | 12-18 min |
| **ALERT_WEBHOOK_URL** | Webhook alerts | 12-18 min |
| **ROSTER_WEBHOOK_URL** | Sheet roster push | 12-18 min |
| **MIN_AMOUNT** | Approval threshold | 12-18 min |
| **MAX_AMOUNT** | Approval threshold | 12-18 min |
| **DAYS_BACK** | History window | 12-18 min |

---

## Changing Configuration (No SSH Needed)

### To update GrowthX token:
1. Edit Google Sheet Config tab
2. Update `GROWTHX_API_KEY` value in Column B
3. Save
4. Wait 12-18 min (or restart bot)
5. Done ✅

### To add Telegram alerts:
1. Create bot at @BotFather
2. Get token + chat ID
3. Edit Google Sheet Config tab
4. Add values for TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID
5. Save
6. Wait 12-18 min
7. Alerts start automatically ✅

### To add/remove groups:
1. Edit "Groups" tab (not Config tab)
2. Add/remove rows as needed
3. Save
4. Bot syncs on next refresh ✅

### To change approval amounts:
1. Edit "Config" tab
2. Change MIN_AMOUNT or MAX_AMOUNT
3. Save
4. Bot applies within 18 min ✅

---

## VPS Deployment (Simplified)

When deploying to VPS:

1. Create VPS (Ubuntu 20.04)
2. Give me the **VPS IP**
3. I deploy (installs Node, Chromium, pm2, starts bot)
4. You scan QR when bot is live
5. **That's it** — all config comes from Google Sheet

**No secrets to pass, no .env files to manage.** Everything is in your Google Sheet that you control.

---

## Verification

To check if config is syncing properly:

```bash
# SSH into VPS (or Mac if still local)
pm2 logs wa-approver | grep -i "config"
```

You should see:
```
Config sheet synced: X values loaded
```

If config doesn't sync:
1. Check sheet is shared with "Anyone with link"
2. Verify tab name is exactly "Config" (case-sensitive)
3. Check Column A has exact key names
4. Wait 20 min for next sync, or restart: `pm2 restart wa-approver`

---

## Files Updated

- ✅ **index.js** — Now reads from Config sheet
- ✅ **CONFIG-SHEET-SETUP.md** — Detailed setup guide (see it for examples)
- ✅ **VPS-SETUP.md** — Simplified (no .env steps needed)
- ✅ **CLOUD-READY.md** — Updated for sheet-based config
- ✅ **.env.example** — Still available as fallback reference

---

## Quick Reference: All Config Keys

```
GROWTHX_API_KEY = Bearer token from GrowthX dashboard
TELEGRAM_BOT_TOKEN = Bot token from @BotFather (optional)
TELEGRAM_CHAT_ID = Your Telegram user ID (optional)
ALERT_WEBHOOK_URL = Slack/n8n/Zapier webhook URL (optional)
ROSTER_WEBHOOK_URL = Apps Script web app URL (optional)
MIN_AMOUNT = 100 (minimum payment to approve)
MAX_AMOUNT = 300 (maximum payment to approve)
DAYS_BACK = 14 (history window in days)
```

---

## Next Steps

1. ✅ Add "Config" tab to your Google Sheet
2. ✅ Add configuration rows (see Step 2 above)
3. ✅ Get your GrowthX token and add it
4. ✅ Share sheet with "Anyone with link"
5. ✅ Wait for bot to sync (or restart)
6. ✅ Verify in logs: `pm2 logs wa-approver | grep "Config"`

When you're ready for VPS deployment, just say the word and give me your VPS IP. Configuration will come from this Google Sheet automatically. 🚀

---

**Questions?** Check [CONFIG-SHEET-SETUP.md](./CONFIG-SHEET-SETUP.md) for detailed examples and troubleshooting.
