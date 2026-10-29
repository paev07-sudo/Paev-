# Villeneuve-Sports — site du club

Site du Villeneuve-Sports (football, Villeneuve VD, fondé en 1921) : héros 3D en temps réel,
annuaire des équipes, match center, stade de la Tronchenaz, actualités, inscriptions, partenaires et contact.

Toutes les informations viennent de sources publiques vérifiées le **29 octobre 2026**.
Chaque donnée affiche son niveau de vérification et ses sources. Voir `docs/club-research.md`.

## Démarrer

Prérequis : Node.js 20.9 ou plus récent.

```sh
npm install
npm run dev          # http://localhost:3000
npm run lint
npx tsc --noEmit
npm run build && npm start
```

Variables d'environnement (voir `.env.example`) :

| Variable | Rôle |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | URL publique du site (balises canoniques, sitemap, Open Graph). |
| `NEXT_PUBLIC_FORM_ENDPOINT` | Facultative. Point d'envoi des formulaires (POST JSON). Sans elle, les formulaires préparent un e-mail au club et le disent. |

## Pages

| Route | Contenu |
|---|---|
| `/` | Héros 3D (Three.js / React Three Fiber), fil Matchday, identité, saison, matchs, équipes, Tronchenaz, actualités, partenaires, inscriptions |
| `/club` | Histoire (frise sourcée), identité, comité, débat sur les installations |
| `/equipes` | Annuaire filtrable (catégorie, public, compétition, vérification, recherche, lien profond `?section=`) |
| `/equipes/[slug]` | Fiche par équipe (13 fiches) : compétition, matchs, classements, encadrement, entraînements, contact |
| `/matchs` | Match center : résultats / à venir, filtre par équipe, classements |
| `/matchs/[id]` | Fiche de match ou de tournoi |
| `/installations` | Stade de la Tronchenaz : terrains (schéma 3D CSS interactif), zone sportive, accès |
| `/actualites`, `/actualites/[slug]` | Articles rédigés à partir des sources, avec partage |
| `/rejoindre` | Catégories, démarche, FAQ, formulaire d'inscription (`?equipe=` pré-remplit l'équipe) |
| `/partenaires` | Partenaires listés par le club, formulaire de partenariat |
| `/contact` | Coordonnées officielles, formulaire |
| `/sources` | Toutes les sources et la méthode de vérification |

Aussi : `sitemap.xml`, `robots.txt`, image Open Graph, données structurées JSON-LD (`SportsOrganization`, `NewsArticle`), page 404.

## Structure

```
docs/                    recherche (club-research.md) et décisions de design
design-system/           design system UI UX Pro Max (MASTER.md)
src/content/             TOUTES les données du club (à éditer ici)
  types.ts               modèle de données (verification + sources sur chaque fait)
  sources.ts             registre des sources et date de vérification
  club.ts teams.ts matches.ts venue.ts sponsors.ts news.ts brand.ts
src/lib/data-source.ts   point d'intégration des données officielles (ACVF / Clubcorner)
src/components/three/    scène 3D, shaders GLSL, repli CSS
src/components/…         UI, équipes, matchs, actualités, formulaires
```

## Mettre à jour le contenu

- **Logo officiel** : déposer le fichier dans `public/brand/` puis renseigner `src/content/brand.ts`.
  Le logo remplace automatiquement le mot-symbole dans l'en-tête, le pied de page et les partages.
- **Équipes** : `src/content/teams.ts` (entraîneurs, horaires, recrutement, photo).
- **Matchs et classements** : `src/content/matches.ts`, ou brancher un flux dans `src/lib/data-source.ts`.
- **Partenaires** : `src/content/sponsors.ts` (logos uniquement avec autorisation).
- **Couleurs officielles** : bloc `@theme` de `src/app/globals.css`.
- Après une vérification, mettre à jour `LAST_CHECKED` dans `src/content/sources.ts`.

## 3D et performance

- La scène n'est chargée que sur l'accueil, quand le navigateur est inactif après le chargement.
  Les autres pages ne chargent pas Three.js.
- Repli CSS (terrain en perspective) : sans WebGL, en mode économie de données, sur les appareils
  à faible mémoire, et avec un rendu logiciel (sans GPU). `/?hero=3d` force la scène, par exemple pour une démo.
- `prefers-reduced-motion` : une image fixe, sans vol de caméra ni défilement du fil.
- Téléphones : 30 images par seconde, DPR plafonné, moins de particules. Si les images restent lentes,
  la scène se fige d'elle-même.

## Formulaires

Il n'y a pas de backend. Avec `NEXT_PUBLIC_FORM_ENDPOINT` (par exemple un service de formulaires
ou une route API du club), les formulaires envoient un JSON et ne confirment l'envoi que sur une réponse 2xx.
Sans cette variable, ils ouvrent la messagerie avec un message prêt pour villeneuvesports@gmail.com
et précisent que rien n'est encore envoyé.
