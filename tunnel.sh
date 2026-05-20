#!/bin/bash

# Configuration
KEY_PATH="$HOME/.ssh/youtube-stream-key.pem"
REMOTE_USER="ubuntu"
REMOTE_HOST="54.89.172.167"
LOCAL_PORT="5900"
REMOTE_PORT="5900"

echo "Establishing SSH tunnel to $REMOTE_HOST..."
echo "Local port $LOCAL_PORT -> Remote port $REMOTE_PORT"

ssh -i "$KEY_PATH" -L ${LOCAL_PORT}:localhost:${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} -N -v
