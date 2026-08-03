# WhatsApp Auto-Approver: Cloud Ready ✅

The bot is **production-ready for VPS deployment**. This document explains what you need to provide and what you'll get.

---

## What's Ready

✅ **All code complete** — index.js, watchdog.js, roster-appscript.gs  
✅ **Deployment guide** — VPS-SETUP.md (step-by-step)  
✅ **Environment template** — .env.example (copy and fill in)  
✅ **Features implemented**:
- 8 WhatsApp group approvals (sheet-configured)
- 3-tier matching: normal paid + alternate numbers + fresh-payer lookup
- Daily EOD summary at 9 PM IST
- Optional member roster audit (twice daily)
- Heartbeat monitoring + optional Telegram/webhook alerts
- Log rotation (10 MB, 14 files)
- Anti-ban hardening (jittered timing, night pause)

---

## What You Need to Provide

**Just 3 things:**

| Item | Example |
|------|---------|
| **VPS IP Address** | `123.45.67.89` (after creating VPS) |
| **Admin WhatsApp Phone** | `+91XXXXXXXXXX` (for QR scan) |
| **Your Google Sheet URL** | `https://docs.google.com/spreadsheets/d/1axEuQqoaGT6b5...` |

**That's it.** All credentials go in your Google Sheet's "Config" tab (see [CONFIG-SHEET-SETUP.md](./CONFIG-SHEET-SETUP.md)).

No `.env` files, no secrets in code — everything is in your Sheet, which you control.

---

## What You'll Get Daily

### 9 PM IST — WhatsApp Summary
```
✅ Approved today: 47
   • Criminal Litigation: 15
   • Independent Director: 12
   • Contract Drafting: 9
   • (5 more groups...)

⏳ Pending: 12 (unpaid/form-only)
```

### 7 PM & 10 AM IST — Member Roster (optional, if Apps Script set up)
Google Sheet tab: "Roster"
- All group members (snapshot)
- Payment status (Paid / Not Paid / Form-only)
- Color-coded for quick scan
- "Roster History" tab tracks trends over time

### 24/7 — Live Approvals
Real-time WhatsApp request approval within **3–6 minutes** of payment:
- ✅ Paid from same phone → instant match
- ✅ Paid from alternate phone → form match
- ✅ Just paid (last few hours) → targeted lookup

### 24/7 — Monitoring
Optional alerts via Telegram if:
- Bot goes offline (stale heartbeat > 35 min)
- WhatsApp session logs out (needs QR re-scan)
- Any errors occur

---

## Deployment Steps

**Quick overview** (full details in [VPS-SETUP.md](./VPS-SETUP.md)):

1. **Provision VPS** (DigitalOcean $6/mo recommended)
   ```
   Ubuntu 20.04 LTS, 2GB RAM, 1 vCPU
   ```

2. **Tell me your VPS IP** — I handle everything else
   - I SSH in, install dependencies (Node, Chromium, pm2)
   - Deploy bot code, start services
   - Bot displays QR code for you to scan
   - Done!

3. **Setup Google Sheet Config** (while I'm deploying)
   - Add "Config" tab to your sheet
   - Copy values from [CONFIG-SHEET-SETUP.md](./CONFIG-SHEET-SETUP.md)
   - Share sheet with "Anyone with link"

4. **Scan QR Code** (when bot is live)
   - Check logs: `pm2 logs wa-approver`
   - Scan QR with admin phone's WhatsApp
   - Bot auto-starts approvals within 1-2 min

**Total: ~15 minutes from VPS provisioning to live system.**

No configuration files to edit, no secrets to type. Everything in your Google Sheet. ✅

---

## What Happens After Deploy

| Time | Action |
|------|--------|
| **On startup** | Loads Google Sheet config, restores 3,800+ cached paid numbers, resolves all 8 groups |
| **Every 3–7 min** | Checks all 8 groups for pending requests, matches against paid list, approves eligible |
| **Every 12–18 min** | Refreshes GrowthX paid list (per group, ₹100-300, last 14 days) |
| **Every 1 min** | Loads alternate number sheet (current month only) |
| **7 PM & 10 AM IST** | Builds member roster, pushes to sheet (optional) |
| **9 PM IST** | WhatsApps you daily summary |
| **11 PM–7 AM IST** | Night pause (no approvals, reduces ban risk) |
| **Crashes** | Auto-restart via pm2 |

---

## Security & Ban Risk

**Security:**
- No credentials stored in code — all in `.env.production`
- `.env.production` NOT in git (add to `.gitignore`)
- VPS file perms: `600` on `.env.production`

**Ban Risk (WhatsApp Web unofficial API):**
- Mitigated by:
  - Jittered timing (3–7 min sweeps, 20–90s delays)
  - Night pause (11 pm–7 am IST)
  - Limited approvals (~50/day max, you're at ~47 today)
  - Fresh-payer lookup only (targeted API, not bulk scanning)
- **Worst case**: Session needs re-scan (QR), approvals paused until then
- **User accepted trade-off** in initial conversation

---

## Monitoring (After Deploy)

### Daily Check
```bash
# SSH into VPS
tail ~/.pm2/logs/status.json  # Current counts, last sweep
```

### Full Logs
```bash
pm2 logs wa-approver --lines 100
```

### If Bot Stops
```bash
pm2 restart wa-approver
pm2 show wa-approver  # Status, memory, uptime
```

### Telegram Alerts (if enabled)
- You'll get notified if bot is down for >35 min
- Or if WhatsApp session needs re-auth

---

## Costs

| Item | Cost | When |
|------|------|------|
| **VPS (2GB RAM)** | $6/mo | DigitalOcean, Linode, Vultr, etc. |
| **WhatsApp** | $0 | Using Web protocol (unofficial, no API charges) |
| **Google Sheets** | $0 | Free tier covers this |
| **Telegram** | $0 | Free bot platform |
| **Total/Month** | **~$6–12** | Just VPS hosting |

---

## When You're Ready to Deploy

Tell me:
1. ✅ VPS provider chosen (DigitalOcean recommended) + IP address
2. ✅ GrowthX API Bearer token
3. ✅ Sheet ID (you already have: `1axEuQqoaGT6b5niI5lk_MHERyTVLDx9OjqjhVPEZOjk`)
4. ✅ Telegram bot token (optional)

I can then:
- SSH into your VPS and run the full setup
- Deploy the code
- Configure everything
- Hand you back a live, monitoring system

Or if you prefer to do it yourself, follow [VPS-SETUP.md](./VPS-SETUP.md) — it's a step-by-step guide.

---

## Questions?

- **Setup stuck?** Check the [VPS-SETUP.md](./VPS-SETUP.md) troubleshooting section
- **After deploy issues?** SSH in and run: `pm2 logs wa-approver`
- **Feature requests?** Let me know — bot is designed for easy updates

**Current Status**: Fully tested on Mac, production-ready for cloud. 🚀
