#!/bin/bash

# ─── CONFIGURE THESE ───────────────────────────────────────────
STREAM_KEY="mv0h-qrsb-vgfm-xykx-09p3"   # Your YouTube stream key
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