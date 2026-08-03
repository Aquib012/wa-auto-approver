# Railway Deployment Checklist

## Before You Start

- [ ] Google Sheet with "Config" tab set up (see CONFIG-SHEET-SETUP.md)
- [ ] GitHub account created (github.com)
- [ ] Railway account created (railway.app)
- [ ] GrowthX API token ready
- [ ] Your Sheet shared with "Anyone with link"

---

## Deployment Steps (5 min total)

### ✅ Step 1: Push Code to GitHub (2 min)

```bash
cd /Users/aquib/claude\ code/wa-auto-approve

# Initialize git
git init
git add .
git commit -m "Initial commit: WhatsApp auto-approver bot"

# Create repo on GitHub (github.com/new)
# Name: wa-auto-approver
# Copy the git URL, then:

git remote add origin https://github.com/YOUR_USERNAME/wa-auto-approver.git
git branch -M main
git push -u origin main
```

**Result:** Code is on GitHub ✅

---

### ✅ Step 2: Deploy to Railway (1 min)

1. Go to **railway.app**
2. Sign in
3. Click **"Create New Project"**
4. Select **"Deploy from GitHub repo"**
5. Authorize Railway to GitHub
6. Select your `wa-auto-approver` repo
7. Click **"Deploy Now"**

**Result:** Railway deploys your bot (watch the logs) ✅

---

### ✅ Step 3: Add Environment Variables (1 min)

Once deployed:

1. Click your service name in Railway
2. Go to **"Variables"** tab
3. Add these variables:

```
MASTER_SHEET_ID = 1axEuQqoaGT6b5niI5lk_MHERyTVLDx9OjqjhVPEZOjk
GROWTHX_API_KEY = Bearer YOUR_TOKEN_HERE
```

(Leave others blank for now)

4. Click **"Save"**
5. Railway auto-restarts bot

**Result:** Bot starts with your credentials ✅

---

### ✅ Step 4: Scan QR Code (1 min)

1. Go to **"Logs"** tab
2. Watch for QR code in the output
3. Scan with admin phone's WhatsApp camera
4. Approve the linked device request

**Result:** Bot is authenticated ✅

---

### ✅ Step 5: Verify Live (0.5 min)

In logs, you should see:

```
Live: 8 groups; sweeps every 3-7 min (jittered)...
```

**Result:** Bot is live and approving! ✅

---

## Post-Deployment

### Daily Monitoring
- Check Railway logs if you suspect issues
- Bot sends 9 PM IST summary to WhatsApp

### Update Code
```bash
git add .
git commit -m "Update: description"
git push
# Railway auto-deploys in 1 minute
```

### Restart Bot
- Railway dashboard → "Deployments" tab → "Redeploy"

---

## Costs After Deployment

- **Railway**: $5/month (or free for small usage)
- **WhatsApp**: $0 (using Web protocol)
- **Sheets**: $0 (free tier)
- **Total**: **$0-5/month**

---

## Emergency Contacts

**Bot stuck?**
1. Check logs (Railway → Logs tab)
2. Look for error messages
3. Click "Redeploy" to restart

**QR code not appearing?**
- Wait 30 seconds
- Refresh logs
- Check for errors in output

**Need to make changes?**
```bash
cd /Users/aquib/claude\ code/wa-auto-approve
# Edit code
git add .
git commit -m "Fix: description"
git push
# Done - Railway auto-deploys
```

---

## Success Indicators

✅ Logs show "Live: 8 groups..."  
✅ No error messages in logs  
✅ QR code scanned successfully  
✅ First approvals appear in logs  
✅ Daily summary arrives at 9 PM IST  

---

## Ready?

Start with Step 1 above. Let me know if you hit any issues!

**Estimated time: 5-10 minutes total** ⏱️
