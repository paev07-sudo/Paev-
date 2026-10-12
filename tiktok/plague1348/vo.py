"""Voiceover: Piper TTS (en-US Ryan, male) -> slightly deeper, slower, small room reverb.
Usage: python3 vo.py <voice.onnx>   writes build/vo_<n>.wav and build/vo.json (durations)."""
import json, subprocess, sys, wave, os

LINES = [
    "You wake up. It's thirteen forty-eight. And something is very wrong.",
    "Breakfast is cold porridge. If you're lucky.",
    "Your village has no clean water, no doctors... and no idea what's coming.",
    "A merchant arrives from the port. People say he's been coughing.",
    "Within weeks, doors get marked. Nobody goes outside anymore.",
    "And the only one who comes to help... wears a mask like this.",
    "Would you survive thirteen forty-eight? Comment below.",
]
model = sys.argv[1]
B = os.path.join(os.path.dirname(__file__), "build")
durs = []
for i, line in enumerate(LINES):
    raw = f"{B}/vo_raw_{i}.wav"; out = f"{B}/vo_{i}.wav"
    subprocess.run([sys.executable, "-m", "piper", "-m", model, "-f", raw,
                    "--length-scale", "1.02", "--sentence-silence", "0.12"],
                   input=line.encode(), check=True, capture_output=True)
    # pitch down ~6% keeping tempo, warm EQ, short dark reverb, trim silence
    af = ("asetrate=22050*0.94,aresample=48000,atempo=1.0638,"
          "silenceremove=start_periods=1:start_threshold=-45dB,areverse,"
          "silenceremove=start_periods=1:start_threshold=-45dB,areverse,"
          "equalizer=f=120:t=q:w=1:g=3,equalizer=f=3500:t=q:w=1:g=-2,"
          "aecho=0.8:0.6:45|90:0.18|0.10")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", raw, "-af", af,
                    "-ac", "1", "-ar", "48000", out], check=True)
    with wave.open(out) as w:
        durs.append(w.getnframes() / w.getframerate())
    print(i, round(durs[-1], 2), line)
json.dump({"lines": LINES, "durations": durs}, open(f"{B}/vo.json", "w"), indent=1)
