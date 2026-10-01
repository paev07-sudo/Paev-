# Krisalis

Deux vidéos motion design pour Krisalis SA, fiduciaire et immobilier à Monthey.

1. **La métamorphose** (`out/metamorphose/krisalis-la-metamorphose.mp4`) : Kunzle SA (1968) et Rigolet SA (1969) deviennent Krisalis SA.
2. **Motion UI** (`out/krisalis-metamorphose.mp4`) : les métiers de Krisalis en interface, 40 s qui bouclent.

## 1. La métamorphose

40 s, 1440×1440, 60 fps, 120 BPM. Le scénario s'appuie sur les vrais logos :
- les deux logos se construisent dans leurs couleurs d'origine (Kunzle `#3C454C` / `#0298D8`, Rigolet `#575C68` / `#C55265`) ;
- « 1968 » et « 1969 » s'affichent sur des aplats de couleur, puis « près de 2 × 60 ans » ;
- les lettres qui ne passent pas dans le nouveau nom tombent. Les autres reprennent la couleur de leur maison et se rangent dans l'ordre K R I S A L I S :
  K (Kunzle) · R (Rigolet) · I (le i de Rigolet) · S (le Z de Kunzle) · A (le o de Rigolet) · L (Kunzle) · I (le l de Rigolet) · S (le E de Kunzle) ;
- les lettres fondent en galets, puis fusionnent en un cocon unique qui pulse pendant la montée de la musique ;
- sur le drop, le cocon éclate et chaque galet éclot en lettre Krisalis. La coche bleue de Kunzle et le triangle de Rigolet deviennent les deux points du « : » ;
- un aplat bleu marine naît du point de Rigolet. Suivent les textes (deux histoires, une seule forme, métiers, adresses), puis le logo final.

Sources : `metamorphose/src/metamorphose.src.html` (assemblé par `metamorphose/build.py` en `metamorphose/metamorphose.html`).
Logos vectorisés : `brand/kunzle-logo.svg` (redessin géométrique mesuré, `brand/tools/kunzle_geometry.py`) et `brand/rigolet-logo.svg` (potrace, `brand/tools/vectorize.py`).
Morphing : `metamorphose/tools/morph_data.py`. Chaque contour est rééchantillonné à 420 points et passe par un galet convexe pour ne jamais se croiser.
Musique originale : `audio/music_metamorphose.py`. Couplets en la mineur, montée sur les mesures 9 et 10, drop en majeur sur l'éclosion (mesure 11).

```sh
python3 brand/tools/vectorize.py && python3 brand/tools/kunzle_geometry.py
python3 metamorphose/tools/morph_data.py
python3 audio/music_metamorphose.py out/metamorphose/music.wav
python3 audio/analyze.py out/metamorphose/music.wav out/metamorphose/grid.json
python3 metamorphose/build.py
KR_HTML=metamorphose/metamorphose.html python3 render/stills.py events out/metamorphose/events.json
python3 audio/mix.py out/metamorphose/music.wav out/metamorphose/grid.json out/metamorphose/events.json out/metamorphose/soundtrack.wav --no-wrap
KR_HTML=metamorphose/metamorphose.html KR_AUDIO=out/metamorphose/soundtrack.wav KR_SEG=out/metamorphose/segments \
  python3 render/video.py out/metamorphose/krisalis-la-metamorphose.mp4 4
```

## 2. Motion UI

Motion UI de 40 s (120 BPM, 20 mesures), carré 1440×1440, 60 fps, qui boucle parfaitement.
Krisalis SA, fiduciaire et immobilier à Monthey.

## Fichiers livrés

- `out/krisalis-metamorphose.mp4` : la vidéo finale, avec la musique et les sons d'UI.
- `motion/krisalis.html` : l'animation complète dans un seul fichier HTML autonome (police, logo et grille intégrés). `seek(t)` affiche l'image à l'instant `t`.
- `brand/krisalis-logo.svg` : le logo redessiné en vectoriel. `brand/validation-logo-couleurs.png` est la planche de validation.
- `out/sheets/` : les planches avec une image par temps (80 temps), utilisées pour le contrôle.

## Palette

| Rôle | Hex |
|---|---|
| Accent unique (bleu Krisalis, mesuré sur le logo) | `#1E3E71` |
| Encre (composants sombres, texte) | `#111111` |
| Blanc (cartes) | `#FFFFFF` |
| Fond gris chaud | `#EFECE7` |

Police : Geist (SIL OFL 1.1, voir `motion/fonts/Geist-LICENSE.txt`).

## Principes

- Une seule forme, jamais de cut. Chaque état est le même élément, qui change de taille, de rayon et de couleur.
- Tous les styles sont calculés à partir du temps dans `seek(t)` : pas de transition CSS, pas de timer, aucun état gardé d'une image à l'autre.
- Les ressorts sont des réponses indicielles en forme fermée. Une valeur qui change plusieurs fois de cible est la somme d'un ressort par changement.
- Les deux bords de l'indicateur d'onglet, de la fusion Kunzle/Rigolet et du bouton des toggles suivent des ressorts différents. Le bord avant s'étire donc devant le bord arrière.
- Glisser-déposer en manipulation directe : tant que le bouton est pressé, la valeur est calculée depuis la position du curseur. Au relâchement, elle revient avec un ressort qui part de sa position et de sa vitesse du moment.
- La dernière image enchaîne exactement sur la première : `seek(0)` et `seek(40)` sont identiques au pixel près, et la position et la vitesse du curseur sont continues.
- Pureté vérifiée par `render/purity.py` : 60 instants rendus dans l'ordre puis dans un ordre aléatoire donnent les mêmes images. Il reste au plus 8/255 d'écart sur une vingtaine de pixels d'une icône, à cause du rastériseur de Chromium, ce qui est invisible.

## Régénérer

Dépendances : `pip install numpy scipy pillow playwright imageio-ffmpeg`, plus Chromium pour Playwright.

```sh
python3 audio/music.py out/music.wav                 # musique originale 120 BPM (numpy), libre de droits
python3 audio/analyze.py out/music.wav out/grid.json  # grille des temps : tempo, phase, premier temps fort
python3 motion/build.py                               # assemble motion/krisalis.html
python3 render/stills.py beats out/beats 0.3          # une image par temps
python3 render/contact.py out/beats out/sheets        # planches de contrôle
python3 render/scan.py out/scan.json                  # boucle et recherche de sauts image par image
python3 render/purity.py 60                           # même image quel que soit l'ordre des seek()
python3 render/stills.py events out/events.json       # événements sonores de la timeline
python3 audio/mix.py out/music.wav out/grid.json out/events.json out/soundtrack.wav
python3 render/video.py out/krisalis-metamorphose.mp4 4   # rendu final, 4 processus
```

Les données affichées (biens, montants, votes) sont fictives.
