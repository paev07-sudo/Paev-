import type { Sponsor } from "./types";

/**
 * Names listed on villeneuvesports.ch/sponsors (page indexed around March 2025).
 * The list is not exhaustive and may be out of date. No logo is shown: logos
 * must be supplied and authorised by the club and each partner.
 */
export const sponsorsListedOn = "Liste publiée sur le site officiel (relevé indexé vers mars 2025)";

export const sponsors: Sponsor[] = [
  { name: "BCV Villeneuve", location: "Grand Rue 1, Villeneuve", logo: null, url: null, verification: "reported", sources: ["club-sponsors"] },
  { name: "Banque Raiffeisen de la Riviera", location: "Quai Grand'Rive 10, Villeneuve", logo: null, url: null, verification: "reported", sources: ["club-sponsors"] },
  { name: "Carrosserie du Crêt SA", location: "Route de la Rivaz 18", logo: null, url: null, verification: "reported", sources: ["club-sponsors"] },
  { name: "Garage et Carrosserie de Villeneuve", location: "Villeneuve", logo: null, url: null, verification: "reported", sources: ["club-sponsors"] },
  { name: "Linsig SA", location: "Z.I. C 81, Villeneuve", logo: null, url: null, verification: "reported", sources: ["club-sponsors"] },
  { name: "SAMCO Motors Sàrl", location: null, logo: null, url: null, verification: "reported", sources: ["club-sponsors"] },
];
