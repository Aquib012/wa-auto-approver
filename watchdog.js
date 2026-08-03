// Watchdog for the WhatsApp auto-approver.
// Reads status.json (written by index.js after every sweep) and escalates when
// the bot goes quiet or the WhatsApp session needs a human to rescan a QR.
// Run under pm2 alongside the bot:  npx pm2 start watchdog.js --name wa-watchdog

const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

// ================== CONFIG ==================
const STATUS_FILE = path.join(__dirname, 'status.json');
const LOG_FILE = path.join(__dirname, 'watchdog.log');
const CHECK_EVERY_MS = 5 * 60 * 1000;      // how often to inspect the heartbeat
const STALE_AFTER_MIN = 35;                // no sweep for this long = something is wrong
const REALERT_AFTER_MIN = 60;              // don't repeat the same alert more often

// Optional push channels — fill either one and alerts reach your phone.
// Telegram: create a bot with @BotFather, then message it once and get your chat id.
const TELEGRAM_BOT_TOKEN = '';
const TELEGRAM_CHAT_ID = '';
// Generic webhook (Slack incoming webhook, Zapier, n8n, etc). Receives {text}.
const ALERT_WEBHOOK_URL = '';
// ============================================

const lastAlertAt = new Map();
const startedAt = Date.now();
const GRACE_MS = 10 * 60 * 1000;   // bot may still be booting when we first look

function log(msg) {
  const line = `[${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}] ${msg}`;
  console.log(line);
  try { fs.appendFileSync(LOG_FILE, line + '\n'); } catch (e) { /* best effort */ }
}

function macNotify(title, message) {
  if (process.platform !== 'darwin') return;
  const script = `display notification ${JSON.stringify(message)} with title ${JSON.stringify(title)} sound name "Basso"`;
  execFile('osascript', ['-e', script], () => {});
}

async function push(text) {
  if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
    try {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text }),
      });
    } catch (e) { log(`Telegram push failed: ${e.message}`); }
  }
  if (ALERT_WEBHOOK_URL) {
    try {
      await fetch(ALERT_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
    } catch (e) { log(`Webhook push failed: ${e.message}`); }
  }
}

async function alert(kind, text) {
  const last = lastAlertAt.get(kind) || 0;
  if (Date.now() - last < REALERT_AFTER_MIN * 60 * 1000) return;
  lastAlertAt.set(kind, Date.now());
  log(`ALERT [${kind}] ${text}`);
  macNotify('WA auto-approver', text);
  await push(`⚠️ WA auto-approver: ${text}`);
}

async function tick() {
  let status;
  try {
    status = JSON.parse(fs.readFileSync(STATUS_FILE, 'utf8'));
  } catch (e) {
    if (Date.now() - startedAt < GRACE_MS) return;   // still booting; not an alert yet
    await alert('no-status', 'No status file — the bot may never have started. Check: npx pm2 logs wa-approver');
    return;
  }

  if (status.needsQrScan) {
    await alert('needs-qr', 'WhatsApp session logged out. Approvals are STOPPED until someone scans a new QR.');
    return;
  }

  const ageMin = (Date.now() - (status.updatedAt || 0)) / 60000;
  if (ageMin > STALE_AFTER_MIN) {
    if (status.night) return;  // quiet hours: silence is expected
    await alert('stale', `No activity for ${Math.round(ageMin)} min (last: ${status.updatedAtIST || 'unknown'}). The bot may be stuck.`);
    return;
  }

  lastAlertAt.clear();  // healthy again — allow immediate alerting next time
}

log(`Watchdog started. Checking every ${CHECK_EVERY_MS / 60000} min; stale threshold ${STALE_AFTER_MIN} min.`);
if (!TELEGRAM_BOT_TOKEN && !ALERT_WEBHOOK_URL) {
  log('No Telegram/webhook configured — alerts are local only (log + macOS notification).');
}
tick();
setInterval(tick, CHECK_EVERY_MS);
