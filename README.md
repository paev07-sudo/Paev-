# Krisalis : Métamorphose

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
