# WA Auto-Approver — Cloud Deployment Brief (for tech team)

## What this is
A Node.js bot that auto-approves paid GrowthX/LawSikho leads into WhatsApp
community groups. It runs WhatsApp Web headlessly (whatsapp-web.js +
Puppeteer/Chromium), checks each join request against the GrowthX payments
API, and reports everything to a Google Sheet via an Apps Script webhook.
Currently running successfully on a MacBook; needs a small always-on VM.

- Repo: https://github.com/Aquib012/wa-auto-approver (main branch, current)
- Language: JavaScript (Node.js 18+). No build step, no database.
- Related but NOT part of this deployment: a Google Apps Script bound to the
  master sheet handles reporting tabs + AiSensy pending notifications. It
  already runs in Google's cloud — nothing to deploy there.

## Server requirements (IMPORTANT — we already failed once on these)
| Requirement | Spec | Why |
|---|---|---|
| RAM | **2 GB minimum** (t3.small / equivalent) | Headless Chromium needs ~1.5 GB; t3.micro (1 GB) crashed constantly |
| OS | **Ubuntu 22.04 LTS** (NOT 24.04+/26.04) | Newer Ubuntu ships Chromium as a snap, which breaks Puppeteer sandboxing |
| Disk | 15 GB+ | Chromium + session cache |
| Region | ap-south-1 (Mumbai) preferred | Latency to WhatsApp/GrowthX, IST timing |
| Network | Outbound HTTPS only; no inbound ports needed | Bot only makes outgoing calls |

## Deploy steps
```bash
# 1. Node 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs

# 2. Chromium deps for Puppeteer's bundled Chrome (Ubuntu 22.04 names)
sudo apt-get install -y libnss3 libatk-bridge2.0-0 libdrm2 libxkbcommon0 \
  libgbm1 libasound2 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 \
  libpango-1.0-0 libcairo2 fonts-liberation

# 3. App
git clone https://github.com/Aquib012/wa-auto-approver.git && cd wa-auto-approver
npm install
npx puppeteer browsers install chrome

# 4. Create .env (values provided separately — never commit)
#    GROWTHX_API_KEY=<token, WITHOUT the "Bearer " prefix — code adds it>
#    SHEET_WEBHOOK_URL=<Apps Script web app URL>
#    MIN_AMOUNT=100
#    DAYS_BACK=30

# 5. Run under pm2
sudo npm i -g pm2
pm2 start index.js --name wa-bot
pm2 save && pm2 startup   # follow the printed sudo command

# 6. First-run auth: watch `pm2 logs wa-bot` — a QR code prints in the
#    terminal. The ADMIN WhatsApp phone scans it (WhatsApp > Linked Devices).
#    Session persists in .wa-session/ afterwards; no rescan on restarts.
```

## Critical operational rules
1. **ONE instance only, ever.** The WhatsApp session is single-owner. Before
   starting the cloud instance, STOP the copy on the MacBook (and vice
   versa). Two simultaneous instances corrupt the session and risk a ban.
2. **Persist these files/dirs across restarts/redeploys** (same directory as
   index.js): `.wa-session/` (WhatsApp auth), `paid-cache.json`,
   `lid-cache.json`, `pending-reported.json`, `status.json`. Losing
   `.wa-session/` forces a QR rescan by the admin phone.
3. **Do not containerize with Alpine.** If Docker is preferred, use a Debian
   bookworm image ≥2 GB RAM; but plain pm2 on the VM is simpler and proven.
4. The bot self-exits on WhatsApp page reloads ("detached Frame") BY DESIGN —
   pm2 must restart it (default behaviour). Watchdog: `watchdog.js` can also
   run under pm2 to alert if approvals stall.
5. Time logic is IST (Asia/Kolkata): night pause 23:00–07:00, daily counters.
   Server timezone doesn't matter (code handles TZ), but don't "fix" it.
6. All config beyond .env lives in the master Google Sheet (groups list,
   alternate-number form). No redeploy needed to add/remove groups.

## Smoke test after deploy
- `pm2 logs wa-bot` shows: "WhatsApp client ready" → group resolutions →
  "Live: N groups"
- Google Sheet "Bot_Logs" tab receives new lines within ~2 minutes
- A test join request from a paid number gets approved within ~10 minutes

## Contacts / secrets
Ask the project owner for: GrowthX API token, Sheet webhook URL, and the
admin phone availability for the one-time QR scan during cutover.
