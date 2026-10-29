# Design decisions — Villeneuve-Sports

Based on UI UX Pro Max (`design-system/villeneuve-sports/MASTER.md`) and the research in
`docs/club-research.md`.

## Creative direction: "Nocturne à la Tronchenaz"

A floodlit night match at the Tronchenaz, at the eastern end of Lake Geneva.
The **dark** sections (stadium, match center) carry the drama. The **light** sections
(paper `#F4F2EC`) carry the editorial content: club, news, practical information.
Blue is the structuring colour. Yellow is used sparingly, like a captain's armband:
calls to action, active states, key figures.

- Skill pattern: *Hero-Centric Design*. The 3D hero leads, with a single main call to action
  ("Découvrir le club") and one secondary action ("Rejoindre une équipe").
- Skill style: *Vibrant & Block-based*, toned down: large type blocks, precise grids,
  geometric pitch lines, no large gradients, no glass everywhere.
- Dials: variance 7, motion 6, density 4.

## Colours

The official codes are not published. Starting from the verified "blue/yellow" combination:

| Token | Hex | Why |
|---|---|---|
| `night` | `#050B1F` | Night sky above the floodlights. Very dark blue rather than black, to stay "blue". |
| `navy` | `#0C1736` | Cards on dark backgrounds. |
| `primary` | `#1D3FB3` | Saturated royal blue: readable with white text (8.7:1) and on paper (7.8:1). |
| `accent` | `#FFD200` | Pure, warm yellow, legible on night (13.5:1) and on blue (6:1). Never as text on a light background. |
| `paper` | `#F4F2EC` | Warm off-white, editorial feel. |
| `ink` | `#0B1020` | Body text on light backgrounds. |

To swap in the official codes, edit `src/app/globals.css` (`@theme` block).

## Typography

Barlow Condensed (headings, uppercase) and Barlow (body text), the skill's "Sports/Fitness" pairing.
Both are self-hosted (`src/fonts`, SIL OFL licence). Fluid scale using `clamp()`. Body text at 16px minimum.

## Identity without the crest

The official crest could not be downloaded (network policy). Redrawing it is not allowed,
so the site uses a **text wordmark** ("Villeneuve-Sports · 1921") that is clearly not a crest.
Adding the official file (`src/content/brand.ts`) replaces the wordmark everywhere: header,
footer, 3D hero and social-sharing metadata.

## Real-time 3D: where and why

- **Home page only.** `three` and `@react-three/fiber` are loaded with `next/dynamic` (no SSR)
  after the text is displayed. The other pages load no 3D.
- Scene: a natural-grass pitch with a procedural shader (mowing stripes and grain), regulation
  markings (105 × 68 m), goals with nets, floodlights with volumetric beams,
  floating particles, a mountain backdrop (Villeneuve sits below the Alps) and boards reading
  "Villeneuve-Sports · depuis 1921". The ball pattern (truncated icosahedron, rendered by a shader)
  uses the club colours: navy pentagons and yellow seams.
- The ball follows the pointer (and touch), turns as you scroll, and the camera
  moves from an aerial view down to pitch level.
- Fallbacks: no WebGL, `Save-Data`, under 2 GB of memory or **software rendering** (SwiftShader,
  llvmpipe: no GPU) → a CSS 3D hero (pitch in perspective). `/?hero=3d` forces the scene.
  `prefers-reduced-motion` → the scene renders a single fixed frame, with no camera movement or ticker scrolling.
- Budget: the scene mounts only when the browser is idle after `load`. DPR capped at 1.75 (1.25 on mobile),
  1,800 particles on desktop and 700 on mobile, 30 fps on phones, one renderer, rendering paused when
  the hero is off screen or the tab is hidden. If the median frame stays above 50 ms after the intro,
  the scene settles on a still frame.

## Motion

- Section reveals using `IntersectionObserver` and CSS (`--ease-out-expo`, 500–700 ms, 60 ms stagger), turned off under reduced motion.
- Page transitions use the native View Transitions API (`<ViewTransition>` in React 19.3):
  a crossfade between pages, and the team card morphing into the team page header.
- Matchday ticker: pauses on hover and focus, and has a pause button (WCAG 2.2.2).

## Honesty about the data

- Every piece of content has a `verification` level (`confirmed` / `reported` / `unconfirmed`)
  and source references. The interface shows a badge and the source on every card and page.
- No live score: the match center shows the date of the last check.
- Forms: no backend. When `NEXT_PUBLIC_FORM_ENDPOINT` is set, the forms POST JSON to it
  and confirm only on a 2xx response. Otherwise they prepare an email to the club address
  and say so.
