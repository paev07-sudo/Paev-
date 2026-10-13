"""Cue sheet shared by the visuals and the sound: every animation event, keyed to the voiceover.

Reads ict/data/timeline.json (scene cuts + word times from the TTS) and writes ict/data/cues.json.
The music grid is 140 BPM with the drop downbeat on the Scene 4 cut. The sweep's line crossing
and the take-profit hit are snapped to the nearest beat when one is close, so the hits land
on the music.

Usage: python3 ict/tools/cues.py
"""
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
BPM = 140
BEAT = 60 / BPM
BAR = 4 * BEAT


def main():
    tl = json.loads((ROOT / 'data' / 'timeline.json').read_text())
    L = tl['lines']
    sc = [(s['s'], s['e']) for s in tl['scenes']]

    def ws(li, wi):
        return L[li]['words'][wi]['s']

    def we(li, wi):
        return L[li]['words'][wi]['e']

    drop = sc[3][0]

    def snap(t, tol=0.16):
        n = round((t - drop) / BEAT)
        g = drop + n * BEAT
        return g if abs(g - t) <= tol else t

    c = {}
    c['scenes'] = sc
    c['grid'] = {'bpm': BPM, 'beat': BEAT, 'bar': BAR, 'drop': drop,
                 'first_bar': drop - 9 * BAR}          # bar -9 starts just before t = 0
    # S1 hook
    c['s1_cut'] = ws(0, 6) - 0.08                      # "Here's the setup" -> closer shot
    # S2 vault
    c['vault_bolts'] = [ws(1, 0) + 0.06 + i * 0.17 for i in range(4)]
    c['vault_spin'] = [ws(1, 2), we(1, 5)]
    c['vault_unlock'] = ws(1, 6)
    c['s2_cut'] = ws(1, 7) - 0.08
    # S3 liquidity
    c['ssl_draw'] = [ws(2, 0), we(2, 1)]
    c['s3_cut1'] = ws(2, 2) - 0.08
    a, b = ws(2, 4), we(2, 10)
    c['stops_pop'] = [a + i * (b - a - 0.15) / 6 for i in range(7)]
    c['s3_cut1b'] = ws(2, 8) - 0.06                  # "right below them": the other side, closer
    c['s3_cut2'] = ws(2, 11) - 0.1
    c['ssl_label'] = ws(2, 12)
    # S4 sweep: open, dive from "Price", cross the line at the end of "lows,", stops go off during
    # "triggers every stop,", low at the end of "stop,", snap back on "snaps right back."
    c['sweep_dive'] = ws(3, 4)
    c['sweep_cross'] = snap(we(3, 8) - 0.1)
    c['sweep_low'] = we(3, 11)
    c['stops_explode'] = [c['sweep_cross'] + 0.12 + i * (c['sweep_low'] - c['sweep_cross'] - 0.2) / 6 for i in range(7)]
    c['sweep_snap'] = [ws(3, 12), we(3, 13) + 0.08]
    c['sweep_label'] = c['sweep_low'] - 0.05
    # S5 shift
    c['mss_line'] = [ws(4, 2), we(4, 3)]
    c['c11'] = [ws(4, 4), we(4, 5)]
    c['mss_break'] = ws(4, 7) + 0.08
    c['c12'] = [ws(4, 6), c['mss_break'] + 0.22]
    c['c13'] = [ws(4, 8), we(4, 11)]
    c['riser'] = [sc[4][0] + 0.35, c['mss_break']]
    c['trend_flip'] = ws(4, 13)
    # S6 gap
    c['num1'] = ws(5, 5)
    c['num3'] = ws(5, 9)
    c['num2'] = (c['num1'] + c['num3']) / 2
    c['high1'] = ws(5, 6)
    c['low3'] = ws(5, 10)
    c['overlap'] = [ws(5, 11), we(5, 12)]
    c['s6_cut1'] = ws(5, 5) - 0.07                    # before "one's": the numbers appear in shot B
    c['s6_cut1b'] = ws(5, 11) - 0.06                  # "don't overlap": close on the gap band
    c['s6_cut2'] = ws(5, 13) - 0.1
    c['fvg_box'] = ws(5, 14)
    c['fvg_label'] = ws(5, 18)
    # S7 entry
    c['hourglass'] = ws(6, 2)
    c['s7_cut'] = ws(6, 3) - 0.1
    c['c14'] = [ws(6, 3), we(6, 5)]
    c['fvg_contact'] = ws(6, 9)
    c['c15'] = [ws(6, 6), ws(6, 9) + 0.12]
    c['entry'] = ws(6, 12)
    # S8 risk & target
    c['sl_line'] = ws(7, 0)
    c['risk_zone'] = ws(7, 2)
    c['s8_cut'] = ws(7, 5) - 0.12
    c['tp_line'] = ws(7, 5)
    c['reward_zone'] = ws(7, 7)
    c['eqh_pulse'] = [ws(7, 7), we(7, 8)]
    c['bsl_icons'] = ws(7, 13)
    c['s8_cut2'] = ws(7, 10) - 0.08                   # "where the next liquidity sits": up to the highs
    # S9 payoff: the rally reaches the target on the beat just before "Target hit"
    c['tp_hit'] = snap(ws(8, 0) - 0.08, 0.2)
    c['rally'] = [sc[8][0] + 0.04, c['tp_hit']]
    c['recap'] = [ws(8, 2), ws(8, 3), ws(8, 4)]
    # S10 outro
    c['icons'] = [ws(9, 0), ws(9, 1), ws(9, 2)]
    c['save'] = ws(9, 3)
    c['s10_cut'] = ws(9, 3) - 0.06                    # "Save this": punch in on the tiles
    c['disclaimer'] = sc[9][0] + 0.25
    c['end'] = tl['duration']
    (ROOT / 'data' / 'cues.json').write_text(json.dumps(c, indent=1))
    for k, v in c.items():
        if k != 'grid':
            print(f'{k:14s} {v if not isinstance(v, float) else round(v, 3)}')
    print('grid', c['grid'])


if __name__ == '__main__':
    main()
