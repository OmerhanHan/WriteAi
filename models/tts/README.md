# Local Piper TTS voice models (downloaded, not committed)
#
# Install piper-tts:
#   pip3 install --user piper-tts
#
# Download voices (~60MB each):
#   bash scripts/download-piper-voice.sh ryan     # male (default)
#   bash scripts/download-piper-voice.sh danny    # male alt
#   bash scripts/download-piper-voice.sh lessac   # female
#
# Then in .env.local:
#   TTS_PROVIDER=piper
#   TTS_PIPER_MODEL=models/tts/en_US-ryan-low.onnx
#
# Fallback without Piper: TTS_PROVIDER=macos (TTS_MACOS_VOICE=Eddy)
# Client also falls back to browser SpeechSynthesis if the API fails.
