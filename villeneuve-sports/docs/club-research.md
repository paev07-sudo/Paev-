# Villeneuve-Sports — Research dossier

Checked on **29 October 2026**.

## How this research was done

The build environment's network policy blocks direct access to `villeneuvesports.ch`,
`acvf.football.ch`, `matchcenter-acvf.football.ch`, `football.ch` and `villeneuve.ch`.
Every fact below was therefore read through **web search excerpts** of those pages
(and of press articles), not by opening the pages themselves. Consequences:

- Each fact carries its source and a confidence level.
- **No image was downloaded**: no official crest, no photos. The site has slots
  for them (see `public/brand/README.md` and `src/content/media.ts`).
- Where sources disagree or were indexed long ago, the fact is marked
  "to confirm" and the site says so.

Confidence levels used here and in `src/content/*` (`verification` field):

| Level | Meaning |
|---|---|
| `confirmed` | Two independent sources agree, or an official ACVF / club / commune source dated 2026. |
| `reported` | A single source (press or official), or an official page indexed long ago. |
| `unconfirmed` | Indirect clue, contradictory or stale. Shown with an explicit warning, or not shown. |

## 1. Identifying the right club

| Name | Place | Is it our club? |
|---|---|---|
| **Villeneuve-Sports** (FC Villeneuve-Sports) | Villeneuve VD, Switzerland, ACVF | **Yes** |
| FC Villeneuve (fcvilleneuve.fr) | Villeneuve-lès-Avignon, Gard, France | No (founded 1928, red/yellow/white colours) |
| Villeneuve Académie FC, AJA Villeneuve, Villeneuve-d'Ascq… | France | No |
| Villeneuve FR | Canton of Fribourg | No (a different commune) |

## 2. Identity

| Fact | Value | Source | Confidence |
|---|---|---|---|
| Official name | Villeneuve-Sports (often "FC Villeneuve-Sports" / "FC Villeneuve Sports") | ACVF club page, club.football.ch, villeneuvesports.ch | confirmed |
| Founded | 1 July 1921 (`01.07.1921`) | club.football.ch (v=1142); commune postulat (2023) cites "fondé en 1921"; Radio Chablais (2023) | confirmed |
| ASF club number | 9111 | ACVF club page | confirmed |
| Regional association | ACVF (Association cantonale vaudoise de football) | ACVF | confirmed |
| Colours | **blue / yellow** ("bleu/jaune") | ACVF club page, club.football.ch | confirmed |
| Crest / logo | Exists on villeneuvesports.ch and Facebook, **not obtained** (network blocked) | — | slot to fill |
| Exact colour codes | Not published | — | derived for the site, see `docs/design-decisions.md` |
| Number of teams | 12 (ACVF match center, 2026) · 11 (older club.football.ch profile) | ACVF | confirmed (12 is the latest) |
| Postal address | Case postale 366, 1844 Villeneuve VD | ACVF, commune, club site | confirmed |
| Email | villeneuvesports@gmail.com | commune listing, club site, Facebook | confirmed |
| Website | https://www.villeneuvesports.ch | ACVF club page, Facebook | confirmed |
| Facebook | https://www.facebook.com/VilleneuveSports/ ("FC Villeneuve Sports Officiel") | search result, links to the club site | reported |
| Instagram | Not found | — | unconfirmed (do not show) |
| Club management software | The club site says its data comes from "FOOT Gestion" | villeneuvesports.ch | reported |

## 3. People (public listing only)

| Role | Name | Source | Confidence |
|---|---|---|---|
| President | **Mirnes Duric** | villeneuvesports.ch/le-club and /le-club/le-comite; villeneuve.ch/sports/59132 (commune listing) | confirmed |
| Technical director | Ronald Villavicencio | villeneuvesports.ch/le-club (page age not known) | reported |
| Former president | Arben Citaku (2023) | Radio Chablais, 5 May 2023 | historical |
| Former contact | Daniel Monod, courrier@villeneuvesports.ch | sportinforiviera.ch (outdated) | historical, not shown |
| Coach, team 2 | Gabriel Farinho Calvinho (assistant Luca Provenzano Iglesias) | villeneuvesports.ch `equipedet?eq=30S`, indexed 3–4 years ago, and the page id (`30S`) is ambiguous | unconfirmed, not shown |
| Coach, Juniors C | Dylan Pinheiro Guedes | villeneuvesports.ch `liste-des-joueurs?eq=C1`, indexed 3–4 years ago | unconfirmed, not shown |

The club site also publishes the president's mobile number. The site does not
repeat it: it links to the official committee page and uses the club email.

## 4. History and milestones

| Year | Fact | Source | Confidence |
|---|---|---|---|
| 1921 | Club founded (1 July 1921) | club.football.ch, commune, Radio Chablais | confirmed |
| 1968 | Construction year given for the Tronchenaz ground | Europlan-online (stadium database) | reported |
| 1993–94 | "FC Villeneuve Sports" seniors group champion (ACVF seniors archive) | acvf.football.ch seniors page | reported |
| 2021 | Centenary (follows from 1921) | — | arithmetic |
| ~2015 | Near-complete renewal of the committee after a difficult period; the junior section had only 15 children | Radio Chablais, 5 May 2023 | reported |
| 2023 | Nearly 160 juniors and about 15 coaches; the first team had moved up a league; a team in every category except Juniors A and B; a girls' team | Radio Chablais, 5 May 2023 | reported |
| 2021–22 → 2022–23 | +33 % juniors; about 120 juniors (the two counts differ from Radio Chablais's ~160, probably counted differently) | Postulat by Dylan Karlen, Villeneuve communal council, Nov 2023 | reported |
| Nov 2023 | Postulat "Make FC Villeneuve-Sport great again !": clarify club/commune responsibilities at the Tronchenaz; shortage of changing rooms (made worse by mixed teams), goal nets often damaged, pitch unusable in the low season, ageing club building | udc-villeneuve.ch; villeneuve.ch/_doc/5441218 | confirmed |
| 2024–2026 | The postulat is listed in the municipality's management reports 2024 and 2025 (Préavis 06/2025, 02/2026); a Tronchenaz zoning plan is linked to the new intercommunal school | villeneuve.ch | reported |
| 24 May 2026 | **Champion of 4e ligue, group 6**, after a 2–0 win over FC Aigle II with two rounds to go. Opener: Ukaash Mohamed (16'), from a cross by Kenan Duric; second goal at 80' | FootRomand, "Villeneuve est champion !" | confirmed (FootRomand plus the ACVF table) |
| 2025–26 | 4e ligue gr. 6 table: Villeneuve-Sports I, 22 played, 18 W, 3 D, 1 L, 85:13, +72, **57 pts**; FC Aigle II second with 50 pts (points deduction) | ACVF table indexed in June 2026 | confirmed |
| June 2026 | 4e ligue promotion play-offs: Lausanne Nord Academy II 2–1 Villeneuve-Sports I (17 June); home match against FC Bursins-Rolle-Perroy II on 21 June 15:30 at the Tronchenaz (the score shown, "8 : 1", is unclear) | ACVF club page and match center | reported (the 21 June score is **not** used) |
| 2026–27 | **Plays in 3e ligue, group 2**, as a newly promoted side | Proxifoot (Sept 2026, "le néo-promu Villeneuve-Sports"); footstats.ch 3e ligue ACVF gr. 2; ACVF match center | confirmed |
| 6 Sept 2026 | Pully Football II 5–1 Villeneuve-Sports (3e ligue gr. 2) | footstats.ch | reported |
| Early Sept 2026 | Snapshot: 3 played, 1 W, 0 D, 2 L, 8:9, 3 pts, 10th | footstats.ch | reported (out of date) |

## 5. Teams (2026–27 season)

The ACVF match center lists **12 teams**. No full list was readable.
Here is what the sources allow us to state.

| Team | Competition | Sources | Confidence |
|---|---|---|---|
| **Villeneuve-Sports I** | 3e ligue, group 2 | Proxifoot 09/2026, footstats, ACVF | confirmed |
| Villeneuve-Sports II | 5e ligue (Sofascore; recent loss 2–4 to FC Concordia Lausanne III, undated) | Sofascore; club site (team 2) | reported |
| Seniors 30+ | Seniors 30+ (Élite gr. 1 per Scorenco; a 0-point ACVF row may be a withdrawal; the ACVF 2024 report lists Villeneuve-Sports among withdrawals without saying which competition) | Scorenco, ACVF | unconfirmed |
| Seniors 40+ | Possible gr. 4 fixture vs FC Etoile-Broye on 30.10.2026 (layout unclear) | ACVF match center | unconfirmed |
| Juniors C | 2nd level (Scorenco); category on the club site | Scorenco, villeneuvesports.ch/juniors | reported |
| Juniors D-7 I | 1st level, group 2 (fixtures Oct 2026) | ACVF match center | confirmed |
| Juniors D-7 II | Jun. D-7 (fixtures Oct 2026) | ACVF match center | confirmed |
| Juniors E I | 2nd level, autumn round, group 10 | ACVF match center | confirmed |
| Juniors E II | E1/E2 listed on the club site (2025) | villeneuvesports.ch/juniors | reported |
| Juniors F (children's football) | F1/F2 on the club site; ACVF tournament "BRACK.CH PmF Cat F" at the Tronchenaz on 31.10.2026 | villeneuvesports.ch/juniors, ACVF tournaments | reported |
| Juniors G (children's football) | Listed on the club site | villeneuvesports.ch/juniors | reported |
| Juniors A | Listed on the club site (2025) but "no A or B" in 2023 | contradictory | unconfirmed |
| **Juniores FF-17** (girls) | 2nd level, autumn round, group 2 (vs Vevey-Sports I) | ACVF match center | confirmed |
| **Juniores FF-14 (7v7)** (girls) | Fixtures late Oct / early Nov 2026 | ACVF match center | reported |
| Juniores FF-12 / FF-15 | Former category names on the club site (2025) and Radio Chablais (FF-15, 2023) | club site, Radio Chablais | historical |

**Senior women's team:** none found. Not shown.

## 6. Facilities

| Fact | Value | Source | Confidence |
|---|---|---|---|
| Venue | **Stade de la Tronchenaz** (main pitch) plus **terrain annexe** (second pitch) | ACVF match center (fixtures), Europlan | confirmed |
| Address | Route de la Tronchenaz 14, 1844 Villeneuve VD | Europlan (stadium and annexe), Apple Maps (hall) | reported |
| Owner | Commune of Villeneuve | Europlan; commune postulat | reported |
| Surface | Natural grass, both pitches | Europlan | reported |
| Floodlights | Yes, both pitches | Europlan | reported |
| Capacity | 1,000 | Europlan | reported (secondary source) |
| Approval | Main pitch approved for 3e ligue | Europlan (search excerpt) | reported |
| Sports zone | Clay tennis courts, football pitches, multi-sport hall, pétanque, boxing; skatepark nearby built by its users | villeneuve.ch/tronchenaz | confirmed |
| Neighbouring hall | Halle de la Tronchenaz, Route de la Tronchenaz 22 (changing rooms and toilets in the hall) | villeneuve.ch, montreuxriviera.com | reported |
| Changing rooms (stadium) | Not enough, per the 2023 postulat | postulat | reported |
| Withdrawn project | Two synthetic pitches with changing rooms and a refreshment stand, withdrawn by the Municipality in May 2010 | search excerpt (villeneuve.ch) | reported |
| Future | Tronchenaz zoning plan (parallel study 2024, new intercommunal school); site status changed in the contaminated-sites register at end 2025 | Rapport de gestion 2025 (Préavis 02/2026) | reported |
| Training, team 2 | Monday and Friday 19:30, terrain annexe (old page) | villeneuvesports.ch | unconfirmed, not shown |

GPS coordinates: not verified. The site links to a map search by address.

## 7. Sponsors

The `villeneuvesports.ch/sponsors` page (indexed about 594 days ago, so around March 2025)
lists, among others:

- BCV Villeneuve (Grand Rue 1)
- Banque Raiffeisen de la Riviera (Quai Grand'Rive 10, Villeneuve)
- Carrosserie du Crêt SA (Route de la Rivaz 18)
- Garage et Carrosserie de Villeneuve
- Linsig SA (Z.I. C 81, Villeneuve)
- SAMCO Motors Sàrl

The ACVF club page has a "Sponsor principal" block whose name could not be read.
**No logo was used**: the site shows names only, labelled with the source and the date,
until the club confirms the current list and supplies authorised logos.

## 8. Events

| Event | Date | Source | Confidence |
|---|---|---|---|
| ACVF tournament "BRACK.CH PmF" (Juniors F category), Stade de la Tronchenaz | Sat 31.10.2026, 10:00–12:00 | ACVF tournaments page | reported |
| Supporters' dinner, tournaments | Sections exist on the club site; no 2026 date found | villeneuvesports.ch/evenement | — |

## 9. Registration and fees

- An "Inscription foot" page exists (villeneuvesports.ch/contact/contact-2): junior categories
  and a **family discount** on the membership fee when a sibling already plays at the club (reported).
- **Fee amounts: not published** / not found.
- **Training times: not verified** for 2026–27.

## 10. Open questions for the club

1. Official crest (SVG or high-resolution PNG) and the exact blue and yellow colour codes.
2. Final list of the 12 teams for 2026–27, with coaches, training times and contacts.
3. Status of Seniors 30+ / 40+ and of Juniors A for 2026–27.
4. Score of the 21.06.2026 play-off and how promotion was earned.
5. Current sponsors and authorised logos; name of the main sponsor.
6. Photos (teams, Tronchenaz, events) with usage rights.
7. Fees, registration procedure, registration form.
8. Committee members (other than the president).
9. Upcoming fixtures. Connect the ACVF match center (see `src/lib/data-source.ts`).

## Sources

- ACVF, club page Villeneuve-Sports: https://acvf.football.ch/association-cantonale-vaudoise-de-football/clubs-acvf/club-acvf.aspx/v-1142/
- ACVF match center (club): https://matchcenter-acvf.football.ch/default.aspx?oid=16&lng=2&v=1142
- club.football.ch profile: https://club.football.ch/?lng=2&tab=3398&v=1142
- Official club site: https://www.villeneuvesports.ch/ (pages /le-club, /le-club/le-comite, /juniors, /sponsors, /evenement, /contact/contact-2)
- Facebook: https://www.facebook.com/VilleneuveSports/
- Commune of Villeneuve, club listing: https://www.villeneuve.ch/sports/59132
- Commune of Villeneuve, Tronchenaz zone: https://www.villeneuve.ch/tronchenaz
- Postulat (communal document): https://villeneuve.ch/_doc/5441218
- UDC Villeneuve, "Make FC Villeneuve-Sport great again !": https://www.udc-villeneuve.ch/2023/11/03/make-fc-villeneuve-sport-great-again/
- Rapport de gestion 2025 (Préavis 02/2026): https://www.villeneuve.ch/_docn/6953026/PREAVIS_02.2026.pdf
- Radio Chablais, "Le club de foot du vendredi : le Villeneuve-Sports" (5 May 2023): https://radiochablais.ch/sports/actu-sportive/95868-le-club-de-foot-du-vendredi-le-villeneuve-sports
- FootRomand, "Villeneuve est champion !": https://footromand.ch/villeneuve-est-champion/
- Proxifoot, "Top 5 du week-end by JouezSport !" (Sept 2026): https://www.proxifoot.ch/vaud/2026/09/top-5-du-week-end-by-jouezsport-2/
- footstats.ch, 3e ligue ACVF: https://www.footstats.ch/fr/leagues/acvf-3e-ligue/
- Europlan, Stade de la Tronchenaz: https://www.europlan-online.de/stade-de-la-tronchenaz/stadion-30245.html
- Europlan, terrain annexe: https://www.europlan-online.de/stade-de-la-tronchenaz-terrain-annexe/stadion-43203.html
- ACVF tournaments: https://acvf.football.ch/association-cantonale-vaudoise-de-football/competition-acvf/tournois-acvf.aspx
- ACVF seniors: https://acvf.football.ch/association-cantonale-vaudoise-de-football/seniors-veterans-acvf.aspx
- Sofascore, Villeneuve-Sports II: https://www.sofascore.com/football/team/villeneuve-sports-ii/802597
- Scorenco, Villeneuve-Sports: https://scorenco.com/football/clubs/villeneuve-sports-2d3j
- sportinforiviera.ch (old listing): https://www.sportinforiviera.ch/club/66-fc-villeneuve-sports
