#!/bin/sh
# Rebuild "POV: You wake up as a peasant in medieval England, 1348" from scratch.
# Needs: python3, numpy, pillow, ffmpeg, piper-tts (pip) and the Piper voice en-us-ryan-high.onnx
#   (github.com/rhasspy/piper/releases/download/v0.0.2/voice-en-us-ryan-high.tar.gz)
set -e
cd "$(dirname "$0")"
VOICE=${VOICE:-/tmp/claude-0/voices/en-us-ryan-high.onnx}
mkdir -p build
python3 vo.py "$VOICE"          # voiceover lines -> build/vo_*.wav, build/vo.json
python3 render.py               # frames -> build/video.mp4 (+ build/timeline.json)
python3 audio.py                # music + sfx + vo -> build/soundtrack.wav
ffmpeg -y -loglevel error -i build/video.mp4 -i build/soundtrack.wav \
  -af "loudnorm=I=-14:TP=-1.5:LRA=11" -c:v copy -c:a aac -b:a 192k -ar 48000 \
  -shortest -movflags +faststart plague-1348-pov.mp4
echo "-> plague-1348-pov.mp4"
