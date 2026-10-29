# Brand assets

The official Villeneuve-Sports crest is not in this folder. It could not be downloaded
during the build (network policy), and redrawing it is not allowed.

To add it:

1. Put the file supplied by the club here (SVG preferred, or PNG at least 512 px).
2. Fill in `src/content/brand.ts`, for example:

   ```ts
   export const crest: Media | null = {
     src: "/brand/crest.svg",
     width: 512,
     height: 512,
     alt: "Écusson du Villeneuve-Sports",
     credit: "Villeneuve-Sports",
   };
   ```

Partner logos belong in `public/partners/`, and only with the club's and the partner's authorisation.
