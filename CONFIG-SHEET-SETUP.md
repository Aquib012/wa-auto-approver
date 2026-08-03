# Config Sheet Setup Guide

The bot now reads ALL configuration from a **Google Sheet tab called "Config"**. No SSH, no `.env` files — just edit the sheet and the bot auto-syncs.

---

## Step 1: Add Config Tab to Your Sheet

In your existing Google Sheet (ID: `1axEuQqoaGT6b5niI5lk_MHERyTVLDx9OjqjhVPEZOjk`):

1. **Right-click** on a sheet tab (e.g., next to "Groups")
2. Click **"Insert 1 below"**
3. Name it: **`Config`**
4. Click **"Create"**

---

## Step 2: Add Configuration Values

In the new "Config" tab, add these rows:

| Column A | Column B |
|----------|----------|
| GROWTHX_API_KEY | Bearer YOUR_TOKEN_HERE |
| TELEGRAM_BOT_TOKEN | (leave empty if no Telegram) |
| TELEGRAM_CHAT_ID | (leave empty if no Telegram) |
| ALERT_WEBHOOK_URL | (leave empty if no generic webhook) |
| ROSTER_WEBHOOK_URL | (leave empty if not set up yet) |
| MIN_AMOUNT | 100 |
| MAX_AMOUNT | 300 |
| DAYS_BACK | 14 |

---

## What Each Config Does

| Key | Value | Example | Notes |
|-----|-------|---------|-------|
| **GROWTHX_API_KEY** | Your Bearer token | `Bearer eyJhbGc...` | Required. Get from GrowthX dashboard |
| **TELEGRAM_BOT_TOKEN** | Telegram bot token | `123456:ABC-DEF1234ghIkl` | Optional. Leave blank to disable |
| **TELEGRAM_CHAT_ID** | Your Telegram user ID | `987654321` | Optional. Required only if TELEGRAM_BOT_TOKEN is set |
| **ALERT_WEBHOOK_URL** | Generic webhook URL | `https://hooks.slack.com/...` | Optional. Slack, n8n, Zapier, etc. |
| **ROSTER_WEBHOOK_URL** | Apps Script web app URL | `https://script.google.com/...` | Optional. For member roster pushes to sheet |
| **MIN_AMOUNT** | Minimum payment | `100` | Only approve leads paid ₹100+ |
| **MAX_AMOUNT** | Maximum payment | `300` | Only approve leads paid ≤₹300 |
| **DAYS_BACK** | History window (days) | `14` | Only approve payments from last 14 days |

---

## Example Config Tab (Complete)

Copy this exactly into your Config sheet:

```
GROWTHX_API_KEY	Bearer eyJhbGc...YXJiaXRyYQ==
TELEGRAM_BOT_TOKEN	123456:ABCDEFGHIJKLMNOPQRSTuvwxyz
TELEGRAM_CHAT_ID	987654321
ALERT_WEBHOOK_URL	https://hooks.slack.com/services/YOUR/WEBHOOK/URL
ROSTER_WEBHOOK_URL	https://script.google.com/macros/d/YOUR_DEPLOYMENT_ID/userweb?v=1
MIN_AMOUNT	100
MAX_AMOUNT	300
DAYS_BACK	14
```

---

## Getting Each Value

### 1. GROWTHX_API_KEY
- Open your **GrowthX dashboard**
- Go to **Settings → API**
- Copy the **Bearer token**
- Paste into Column B

### 2. TELEGRAM_BOT_TOKEN (Optional)
- Message [@BotFather](https://t.me/botfather) on Telegram
- Type `/newbot`
- Follow prompts, get your **Bot Token**
- Example: `123456:ABCDEFGHIJKLMNOPQRSTuvwxyz`

### 3. TELEGRAM_CHAT_ID (Optional)
- Message your newly created bot
- Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
- Look for `"id": XXXXX` under `message` → `chat`
- That's your Chat ID

### 4. ALERT_WEBHOOK_URL (Optional)
**Slack Example:**
- Create incoming webhook: [api.slack.com/messaging/webhooks](https://api.slack.com/messaging/webhooks)
- Copy the webhook URL
- Paste into Config sheet

**n8n Example:**
- Create webhook trigger in n8n
- Copy the webhook URL
- Paste into Config sheet

### 5. ROSTER_WEBHOOK_URL (Optional)
- Deploy `roster-appscript.gs` as Web App (see [roster-appscript.gs](./roster-appscript.gs))
- Copy the deployed URL
- Paste into Config sheet

### 6. MIN_AMOUNT, MAX_AMOUNT, DAYS_BACK
- These are typically **100, 300, 14**
- Only change if you want different approval criteria

---

## When Changes Take Effect

✅ **Bot syncs Config sheet every 12-18 minutes** (during day, not night)  
✅ **On startup**, bot loads latest config  
✅ **Changes are immediate** after the next sync

Check logs to confirm:
```bash
pm2 logs wa-approver | grep "Config sheet"
```

---

## Troubleshooting

### "Config sheet fetch error 403"
- Your sheet **isn't shared** with "Anyone with link"
- **Fix**: Share the sheet:
  1. Click **Share** button
  2. Change to **"Anyone with the link"** → **"Viewer"**
  3. Copy link, click Done
  4. Bot should sync on next refresh (~18 min)

### "Config sheet sync failed: ..."
- Sheet URL is wrong
- Columns aren't set up correctly
- **Fix**: Verify:
  1. Tab name is exactly **"Config"** (case-sensitive)
  2. Column A = Key, Column B = Value
  3. No blank rows at the top
  4. Sheet is shared with "Anyone with link"

### Changes not taking effect
- Bot hasn't synced yet (syncs every 12-18 min)
- Night hours (11 pm–7 am IST) — syncing paused
- **Fix**: 
  1. Wait 20 minutes
  2. Or force restart: `pm2 restart wa-approver`
  3. Check logs: `pm2 logs wa-approver | tail -50`

---

## Moving to VPS

On VPS deployment:
1. Copy your **Master Sheet ID** from the URL
2. Update **MASTER_SHEET_ID** in the deployment (I'll do this for you)
3. Everything else stays the same — all config stays in Google Sheets

**No VPS files to change.** All configuration is remote. ✅

---

## Summary

| Before | Now |
|--------|-----|
| Edit `.env.production` on VPS → SSH in | Edit Google Sheet Config tab |
| Need SSH access | No SSH needed |
| Changes take effect on restart | Auto-sync every 12-18 min |
| Hard to audit changes | Easy to audit (sheet history) |

**One source of truth: Your Google Sheet.** 🎯
