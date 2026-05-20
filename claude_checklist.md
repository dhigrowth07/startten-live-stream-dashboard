Here's the complete step-by-step guide for Option 3:

---

## Phase 1: Launch & Connect to EC2

### Step 1: Launch EC2 Instance
Go to AWS Console → EC2 → Launch Instance:
- **Name:** `youtube-stream`
- **AMI:** Ubuntu Server 22.04 LTS (64-bit x86)
- **Instance type:** `t3.medium` (minimum)
- **Key pair:** Create new → download `.pem` file
- **Security Group rules:**
  - Inbound: SSH port 22 (your IP only)
  - Outbound: All traffic (default)
- **Storage:** 20 GB gp3
- Click **Launch Instance**

### Step 2: Connect to EC2
```bash
# On your local machine
chmod 400 your-key.pem

ssh -i your-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

---

## Phase 2: System Setup

### Step 3: Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### Step 4: Install Xvfb (Virtual Display)
```bash
sudo apt install -y xvfb
```

### Step 5: Install FFmpeg
```bash
sudo apt install -y ffmpeg

# Verify installation
ffmpeg -version
```

### Step 6: Install Google Chrome
```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb

sudo apt install -y ./google-chrome-stable_current_amd64.deb

# Verify
google-chrome --version
```

### Step 7: Install Node.js 18
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

sudo apt install -y nodejs

# Verify both
node -v
npm -v
```

### Step 8: Install Puppeteer
```bash
mkdir -p /home/ubuntu/streamer
cd /home/ubuntu/streamer

npm init -y

npm install puppeteer-core
```

### Step 9: Install xdotool (for extra utilities)
```bash
sudo apt install -y xdotool wmctrl
```

---

## Phase 3: Create All Scripts

### Step 10: Create the Puppeteer Login Script

```bash
nano /home/ubuntu/streamer/login.js
```

Paste this — **edit the 5 variables at the top**:

```javascript
const puppeteer = require('puppeteer-core');

// ─── CONFIGURE THESE ───────────────────────────────────────────
const WEBSITE_URL  = 'https://yourwebsite.com/login';
const USERNAME     = 'your_username';
const PASSWORD     = 'your_password';
const USERNAME_SEL = '#username';   // CSS selector for username field
const PASSWORD_SEL = '#password';   // CSS selector for password field
const SUBMIT_SEL   = '#login-btn';  // CSS selector for submit button
// ───────────────────────────────────────────────────────────────

(async () => {
  console.log('[Puppeteer] Launching Chrome...');

  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    userDataDir: '/home/ubuntu/chrome-profile',  // saves session/cookies
    headless: false,
    defaultViewport: null,
    args: [
      '--no-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--disable-setuid-sandbox',
      '--window-size=1280,720',
      '--display=:99',
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  console.log('[Puppeteer] Navigating to login page...');
  await page.goto(WEBSITE_URL, { waitUntil: 'networkidle2', timeout: 60000 });

  console.log('[Puppeteer] Filling credentials...');
  await page.waitForSelector(USERNAME_SEL, { timeout: 30000 });
  await page.click(USERNAME_SEL);
  await page.type(USERNAME_SEL, USERNAME, { delay: 80 });

  await page.waitForSelector(PASSWORD_SEL, { timeout: 30000 });
  await page.click(PASSWORD_SEL);
  await page.type(PASSWORD_SEL, PASSWORD, { delay: 80 });

  console.log('[Puppeteer] Submitting login form...');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }),
    page.click(SUBMIT_SEL),
  ]);

  console.log('[Puppeteer] Logged in! Current URL:', page.url());
  console.log('[Puppeteer] Browser staying open for FFmpeg capture...');

  // Keep the process alive — do NOT close browser
  await new Promise(() => {});
})();
```

---

### Step 11: Find the Correct CSS Selectors for Your Site

Before moving on, you need the correct selectors for your login form.

**Method — inspect your site locally:**
1. Open your website in Chrome on your local machine
2. Right-click the **username field** → **Inspect**
3. Look for `id`, `name`, or `class` attribute:
   - If it has `id="email"` → use `#email`
   - If it has `name="user"` → use `[name="user"]`
   - If it has `class="input-field"` → use `.input-field`
4. Do the same for **password field** and **submit button**
5. Update the selectors in `login.js`

**Common selector examples:**
```
#username         → <input id="username">
#email            → <input id="email">
[name="email"]    → <input name="email">
.login-input      → <input class="login-input">
button[type=submit] → <button type="submit">
```

---

### Step 12: Create the Master Stream Script

```bash
nano /home/ubuntu/streamer/stream.sh
```

```bash
#!/bin/bash

# ─── CONFIGURE THESE ───────────────────────────────────────────
STREAM_KEY="xxxx-xxxx-xxxx-xxxx-xxxx"   # Your YouTube stream key
RTMP_URL="rtmp://a.rtmp.youtube.com/live2/$STREAM_KEY"
RESOLUTION="1280x720"
FPS=30
# ───────────────────────────────────────────────────────────────

LOG_FILE="/home/ubuntu/streamer/stream.log"
echo "==============================" >> $LOG_FILE
echo "Stream started: $(date)" >> $LOG_FILE

# Kill any existing processes
pkill -f Xvfb || true
pkill -f chrome || true
pkill -f ffmpeg || true
sleep 2

# Start virtual display
echo "[Stream] Starting virtual display..." | tee -a $LOG_FILE
Xvfb :99 -screen 0 ${RESOLUTION}x24 -ac &
XVFB_PID=$!
export DISPLAY=:99
sleep 3

# Start Puppeteer login (launches Chrome + logs in)
echo "[Stream] Starting Puppeteer login script..." | tee -a $LOG_FILE
cd /home/ubuntu/streamer
node login.js >> $LOG_FILE 2>&1 &
NODE_PID=$!

# Wait for login + dashboard to fully load
echo "[Stream] Waiting for login to complete..." | tee -a $LOG_FILE
sleep 20

# Verify Chrome is running
if ! pgrep -f chrome > /dev/null; then
  echo "[Stream] ERROR: Chrome did not start!" | tee -a $LOG_FILE
  exit 1
fi

echo "[Stream] Chrome is running. Starting FFmpeg..." | tee -a $LOG_FILE

# Start streaming
ffmpeg \
  -f x11grab \
  -r $FPS \
  -s $RESOLUTION \
  -i :99.0 \
  -f lavfi \
  -i anullsrc=channel_layout=stereo:sample_rate=44100 \
  -c:v libx264 \
  -preset veryfast \
  -maxrate 3000k \
  -bufsize 6000k \
  -pix_fmt yuv420p \
  -g 60 \
  -c:a aac \
  -b:a 128k \
  -f flv \
  "$RTMP_URL" >> $LOG_FILE 2>&1

echo "[Stream] FFmpeg exited: $(date)" | tee -a $LOG_FILE
```

```bash
chmod +x /home/ubuntu/streamer/stream.sh
```

---

## Phase 4: Get Your YouTube Stream Key

### Step 13: Set Up YouTube Live Stream

1. Go to [studio.youtube.com](https://studio.youtube.com)
2. Click **"Go Live"** (top right)
3. Choose **"Stream"** tab
4. Set **Latency** to `Low-latency`
5. Copy your **Stream Key**
6. Paste it into `stream.sh` where it says `STREAM_KEY="..."`

---

## Phase 5: Test Everything

### Step 14: Test Puppeteer Login First (Dry Run)

```bash
# Start virtual display manually for testing
Xvfb :99 -screen 0 1280x720x24 -ac &
export DISPLAY=:99
sleep 2

# Run login script and watch output
cd /home/ubuntu/streamer
node login.js
```

**Expected output:**
```
[Puppeteer] Launching Chrome...
[Puppeteer] Navigating to login page...
[Puppeteer] Filling credentials...
[Puppeteer] Submitting login form...
[Puppeteer] Logged in! Current URL: https://yourwebsite.com/dashboard
[Puppeteer] Browser staying open for FFmpeg capture...
```

If you see **"Logged in!"** and the dashboard URL — it works! ✅

If you see errors, see **Troubleshooting** section below.

```bash
# Stop test processes
pkill -f node
pkill -f chrome
pkill -f Xvfb
```

### Step 15: Test Full Stream (5 min test)

```bash
cd /home/ubuntu/streamer
bash stream.sh
```

- Go to YouTube Studio → check if stream is **live**
- Let it run for 2-3 minutes
- Press `Ctrl+C` to stop after testing

---

## Phase 6: Run 24/7 as a Service

### Step 16: Create Systemd Service

```bash
sudo nano /etc/systemd/system/youtube-stream.service
```

```ini
[Unit]
Description=YouTube 24/7 Live Stream
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/streamer
ExecStartPre=/bin/sleep 10
ExecStart=/home/ubuntu/streamer/stream.sh
Restart=always
RestartSec=15
KillMode=control-group

[Install]
WantedBy=multi-user.target
```

### Step 17: Enable and Start the Service

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable on boot
sudo systemctl enable youtube-stream

# Start now
sudo systemctl start youtube-stream
```

### Step 18: Verify It's Running

```bash
# Check service status
sudo systemctl status youtube-stream

# Watch live logs
tail -f /home/ubuntu/streamer/stream.log

# Or check journalctl
journalctl -u youtube-stream -f
```

---

## Phase 7: Handle Session Expiry (Important)

### Step 19: Add Auto Re-login on Session Expiry

If your site logs out after a few hours, update `login.js` to check and re-login:

```javascript
// Add this AFTER the login block, before "Keep process alive"

// Check every 5 minutes if still logged in
setInterval(async () => {
  try {
    const currentUrl = page.url();
    console.log('[Puppeteer] Health check — current URL:', currentUrl);

    // If redirected back to login page, re-login
    if (currentUrl.includes('/login') || currentUrl.includes('/signin')) {
      console.log('[Puppeteer] Session expired! Re-logging in...');

      await page.goto(WEBSITE_URL, { waitUntil: 'networkidle2' });
      await page.waitForSelector(USERNAME_SEL);
      await page.click(USERNAME_SEL);
      await page.type(USERNAME_SEL, USERNAME, { delay: 80 });
      await page.click(PASSWORD_SEL);
      await page.type(PASSWORD_SEL, PASSWORD, { delay: 80 });
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2' }),
        page.click(SUBMIT_SEL),
      ]);
      console.log('[Puppeteer] Re-login successful!');
    }
  } catch (err) {
    console.error('[Puppeteer] Health check error:', err.message);
  }
}, 5 * 60 * 1000); // every 5 minutes
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `Cannot find module 'puppeteer-core'` | Run `cd /home/ubuntu/streamer && npm install puppeteer-core` |
| `Chrome failed to start` | Add `--disable-dev-shm-usage` arg; ensure enough RAM |
| Selector not found | Re-inspect your site's HTML; try `[name="email"]` format |
| Login works but wrong page streamed | Increase `sleep 20` to `sleep 30` in stream.sh |
| Stream disconnects | Systemd `Restart=always` auto-reconnects within 15s |
| Black screen on YouTube | Check `DISPLAY=:99` is exported before FFmpeg |
| Session expires mid-stream | Add the health check interval (Step 19) |
| High CPU / lag | Change `-preset veryfast` to `-preset ultrafast` |

---

## Quick Reference Commands

```bash
# Start stream
sudo systemctl start youtube-stream

# Stop stream
sudo systemctl stop youtube-stream

# Restart stream
sudo systemctl restart youtube-stream

# Watch logs live
tail -f /home/ubuntu/streamer/stream.log

# Check if Chrome is running
pgrep -a chrome

# Check if FFmpeg is streaming
pgrep -a ffmpeg
```

That's the complete setup. Once the systemd service is running, it will automatically start on EC2 reboot and restart itself if anything crashes.