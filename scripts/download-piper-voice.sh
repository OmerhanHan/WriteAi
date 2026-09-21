#!/usr/bin/env bash
# Download a small local Piper male English voice (en_US-ryan-low ~60MB). No API key.
# Usage:
#   bash scripts/download-piper-voice.sh           # ryan (male, default)
#   bash scripts/download-piper-voice.sh lessac    # female
#   bash scripts/download-piper-voice.sh danny     # male alternative
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIR="$ROOT/models/tts"
CHOICE="${1:-ryan}"

mkdir -p "$DIR"
cd "$DIR"

case "$CHOICE" in
  ryan|en_US-ryan-low)
    VOICE="en_US-ryan-low"
    BASE="https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/ryan/low"
    ;;
  danny|en_US-danny-low)
    VOICE="en_US-danny-low"
    BASE="https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/danny/low"
    ;;
  lessac|en_US-lessac-low)
    VOICE="en_US-lessac-low"
    BASE="https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/lessac/low"
    ;;
  *)
    echo "Unknown voice: $CHOICE"
    echo "Options: ryan (male), danny (male), lessac (female)"
    exit 1
    ;;
esac

echo "Downloading $VOICE into $DIR ..."
curl -L --fail -o "${VOICE}.onnx" "${BASE}/${VOICE}.onnx?download=true"
curl -L --fail -o "${VOICE}.onnx.json" "${BASE}/${VOICE}.onnx.json?download=true"
ls -lh "${VOICE}.onnx" "${VOICE}.onnx.json"
echo "Done. Set in .env.local:"
echo "  TTS_PROVIDER=piper"
echo "  TTS_PIPER_MODEL=models/tts/${VOICE}.onnx"
