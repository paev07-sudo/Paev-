# POV: You wake up as a peasant in medieval England, 1348

**File:** `plague-1348-pov.mp4` (1080×1920, 30 fps, 30 s, H.264 + AAC, -14 LUFS)

**TikTok caption**

Would you have survived 1348? 💀 #fyp #history #pov #medieval #historytok

## Timeline

| # | Time | Scene | Caption |
|---|------|-------|---------|
| 1 | 0.0–4.4 | Waking on straw, light through cracks, breath | POV: you wake up in 1348 |
| 2 | 4.4–7.4 | Wool pulled on, cold grey porridge, candle | breakfast = survival |
| 3 | 7.4–12.5 | Muddy street, thatch, fog, chickens, church tower | no water. no doctors. |
| 4 | 12.5–16.6 | Hooded villagers whisper, a cart arrives | then HE arrived… |
| 5 | 16.6–20.9 | Night, boarded windows, red crosses, lanterns | the doors started getting marked |
| 6 | 20.9–25.0 | Plague doctor walks toward you with a lantern | would you open the door? |
| — | 25.0–25.3 | Hard cut to black | |
| 7 | 25.3–30.0 | Knocks, the mask through the door crack, door creaks | comment: survive or not? 👇 |

The cuts follow the voiceover lines, so they land a little later than the brief's 3 s / 4 s / 4 s grid.

## How it was made

Every image is procedural: numpy and Pillow paint noise, polygons and light (`scenes.py`, `gfx.py`).
No photos, stock footage, AI image models, real people, characters or logos.
- Voiceover: Piper TTS, en-US "Ryan" voice (MIT-licensed model), pitched down slightly with a little room reverb (`vo.py`).
- Music and SFX: synthesised from scratch in `audio.py`.
- Rebuild everything with `./build.sh`.
