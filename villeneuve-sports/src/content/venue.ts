import type { Venue } from "./types";

export const address = {
  street: "Route de la Tronchenaz 14",
  postcode: "1844",
  city: "Villeneuve VD",
  country: "CH",
  verification: "reported" as const,
  sources: ["europlan-stade", "europlan-annexe"],
};

const query = encodeURIComponent(`${address.street}, ${address.postcode} Villeneuve, Suisse`);

export const mapLinks = {
  google: `https://www.google.com/maps/search/?api=1&query=${query}`,
  directions: `https://www.google.com/maps/dir/?api=1&destination=${query}`,
  apple: `https://maps.apple.com/?q=${query}`,
  osm: `https://www.openstreetmap.org/search?query=${query}`,
};

export const venues: Venue[] = [
  {
    slug: "stade",
    name: "Stade de la Tronchenaz",
    kind: "Terrain principal",
    facts: [
      { label: "Surface", value: "Gazon naturel", verification: "reported", sources: ["europlan-stade"] },
      { label: "Éclairage", value: "Oui", verification: "reported", sources: ["europlan-stade"] },
      { label: "Capacité indiquée", value: "1 000 places", verification: "reported", sources: ["europlan-stade"] },
      { label: "Homologation", value: "3e ligue", verification: "reported", sources: ["europlan-stade"] },
      { label: "Construction", value: "1968", verification: "reported", sources: ["europlan-stade"] },
      { label: "Propriétaire", value: "Commune de Villeneuve", verification: "reported", sources: ["europlan-stade"] },
    ],
    verification: "confirmed",
    sources: ["acvf-matchcenter", "europlan-stade"],
    note: "Le terrain où la 1re équipe reçoit en 3e ligue, et où se jouent aussi des rencontres juniors."
  },
  {
    slug: "annexe",
    name: "Terrain annexe",
    kind: "Second terrain",
    facts: [
      { label: "Surface", value: "Gazon naturel", verification: "reported", sources: ["europlan-annexe"] },
      { label: "Éclairage", value: "Oui", verification: "reported", sources: ["europlan-annexe"] },
      { label: "Piste d'athlétisme", value: "Non", verification: "reported", sources: ["europlan-annexe"] },
    ],
    verification: "confirmed",
    sources: ["acvf-matchcenter", "europlan-annexe"],
    note: "Des rencontres y sont programmées au calendrier ACVF.",
  },
];

/** The wider municipal sports zone around the pitches. */
export const sportsZone = {
  name: "Zone sportive de la Tronchenaz",
  amenities: [
    "Terrains de football",
    "Courts de tennis en terre battue",
    "Salle multisports",
    "Terrains de pétanque",
    "Boxe anglaise",
    "Skatepark aménagé par ses utilisateurs, aux abords de la zone",
  ],
  hall: { name: "Halle de la Tronchenaz", street: "Route de la Tronchenaz 22", note: "Vestiaires et WC dans la halle." },
  verification: "confirmed" as const,
  sources: ["commune-tronchenaz"],
};

/** Public debate about the facilities (communal council, 2023–2026). */
export const facilityIssues = {
  title: "Des installations au cœur du débat communal",
  points: [
    "Manque de vestiaires, accentué par le nombre croissant d'équipes mixtes.",
    "Filets de buts régulièrement endommagés.",
    "Terrain impraticable pendant la basse saison.",
    "Bâtiment du club vieillissant.",
  ],
  outlook:
    "Le postulat déposé en novembre 2023 demande de clarifier les responsabilités entre le club et la commune et d'intégrer des solutions au réaménagement de la parcelle de la Tronchenaz, lié au futur collège intercommunal. Le rapport de gestion 2025 mentionne le plan d'affectation de la Tronchenaz, qui s'appuie sur une étude terminée en 2024.",
  verification: "reported" as const,
  sources: ["commune-postulat", "udc-postulat", "commune-gestion-2025"],
};
