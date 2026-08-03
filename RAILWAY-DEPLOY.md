# Deploy WhatsApp Bot to Railway

Deploy your WhatsApp auto-approver bot to Railway in **5 minutes**. All data stays in Google Sheets.

---

## Prerequisites

✅ GitHub account (free)  
✅ Railway account (free, sign up at railway.app)  
✅ Your code in a GitHub repo  
✅ Google Sheet with Config tab (see CONFIG-SHEET-SETUP.md)

---

## Step 1: Push Code to GitHub

### If you don't have GitHub set up yet:

```bash
cd /Users/aquib/claude\ code/wa-auto-approve

# Initialize git
git init
git add .
git commit -m "Initial commit: WhatsApp auto-approver bot"

# Create a new repo on GitHub (https://github.com/new)
# Call it: wa-auto-approver

# Push code
git remote add origin https://github.com/YOUR_USERNAME/wa-auto-approver.git
git branch -M main
git push -u origin main
```

### Already have GitHub?

```bash
cd /Users/aquib/claude\ code/wa-auto-approve
git add .
git commit -m "Ready for Railway deployment"
git push
```

---

## Step 2: Deploy to Railway

### 2a. Connect Railway to GitHub

1. Go to [railway.app](https://railway.app)
2. Sign in (or create account)
3. Click **"Create New Project"** → **"Deploy from GitHub repo"**
4. Authorize Railway to access GitHub
5. Select your `wa-auto-approver` repo
6. Click **"Deploy Now"**

**Railway will auto-detect the Dockerfile and deploy!** ✅

---

## Step 3: Configure Environment Variables

Once deployed, Railway shows your service. Click it and go to **"Variables"** tab.

Add these environment variables (from your Config sheet):

| Variable Name | Value |
|---------------|-------|
| `MASTER_SHEET_ID` | Your Google Sheet ID (e.g., `1axEuQqoaGT6b5...`) |
| `GROWTHX_API_KEY` | Bearer token from GrowthX |
| `TELEGRAM_BOT_TOKEN` | (leave blank if not using) |
| `TELEGRAM_CHAT_ID` | (leave blank if not using) |
| `ALERT_WEBHOOK_URL` | (leave blank if not using) |
| `ROSTER_WEBHOOK_URL` | (leave blank if not using) |

**Save** → Railway auto-restarts the bot

---

## Step 4: Scan QR Code

Once deployed, Railway shows logs. Watch for the QR code:

```
Scan this QR with the ADMIN number (WhatsApp > Linked Devices > Link a Device):
```

The QR code will display in the logs. Scan it with your phone's WhatsApp camera.

**Bot will restart and start approving!** ✅

---

## Step 5: Monitor & Maintain

### View Logs
- Go to your Railway project
- Click **"Logs"** tab
- Live logs appear in real-time

### Check Status
```
Last line should show:
"Live: 8 groups; sweeps every 3-7 min..."
```

### Restart Bot (if needed)
- Go to **"Deployments"** tab
- Click the **"Redeploy"** button

### Update Code
```bash
# Make changes locally
git add .
git commit -m "Update: fix approval logic"
git push

# Railway auto-deploys within 1 minute
```

---

## Costs

| Item | Cost |
|------|------|
| **Railway** | $5/month (or $0 for small usage) |
| **WhatsApp API** | $0 (using Web, not official API) |
| **Google Sheets** | $0 (free tier) |
| **Total** | **$0-5/month** |

---

## Troubleshooting

### QR code not showing
- Wait 30 seconds after deploy
- Check logs for errors
- Click "Redeploy" if no QR after 2 min

### Bot keeps restarting
- Check logs for errors
- Verify Google Sheet ID is correct in variables
- Check GROWTHX_API_KEY format (should start with "Bearer ")

### No approvals happening
- Scan the QR code with admin phone
- Wait 1-2 min after QR scan
- Check logs for "Live:" message

### How to see logs in real-time
- Go to Railway project
- Click "Logs" tab
- Tail automatically shows newest entries

---

## Git Cheat Sheet

```bash
# Stage changes
git add .

# Commit
git commit -m "Update: description of changes"

# Push (Railway auto-deploys)
git push

# Check status
git status

# View recent commits
git log --oneline
```

---

## Next Steps

1. ✅ Create GitHub repo
2. ✅ Push code
3. ✅ Deploy to Railway
4. ✅ Add environment variables
5. ✅ Scan QR code
6. ✅ Watch logs confirm "Live:"
7. ✅ Test first approval

**Done!** Your bot is now running 24/7 on Railway. 🚀

---

## Support

- **Railway docs**: [docs.railway.app](https://docs.railway.app)
- **Check logs**: Always start here when troubleshooting
- **Restart**: Click "Redeploy" if stuck
