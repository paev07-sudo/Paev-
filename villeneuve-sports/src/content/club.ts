import type { Milestone, Sourced } from "./types";

export const club = {
  name: "Villeneuve-Sports",
  longName: "FC Villeneuve-Sports",
  founded: { iso: "1921-07-01", label: "1er juillet 1921", year: 1921 },
  asfNumber: "9111",
  association: "ACVF — Association cantonale vaudoise de football",
  colors: { label: "Bleu et jaune", verification: "confirmed", sources: ["acvf-club", "asf-club"] },
  teamCount: { value: 12, verification: "confirmed", sources: ["acvf-matchcenter"], note: "Selon le match center ACVF (11 sur un profil plus ancien)." },
  locality: "Villeneuve VD",
  region: "Riviera — Chablais vaudois, au bout du Léman",
  contact: {
    email: "villeneuvesports@gmail.com",
    postal: ["Villeneuve-Sports", "Case postale 366", "1844 Villeneuve VD"],
    website: "https://www.villeneuvesports.ch",
    facebook: "https://www.facebook.com/VilleneuveSports/",
    committeePage: "https://villeneuvesports.ch/le-club/le-comite",
    registrationPage: "https://villeneuvesports.ch/contact/contact-2",
    verification: "confirmed",
    sources: ["commune-club", "acvf-club", "club-site"],
  },
  /** Mission statement as written by the committee. Not published: left empty on purpose. */
  mission: null as string | null,
} as const;

export const people: ({ name: string; role: string } & Sourced)[] = [
  {
    name: "Mirnes Duric",
    role: "Président",
    verification: "confirmed",
    sources: ["club-comite", "commune-club"],
  },
  {
    name: "Ronald Villavicencio",
    role: "Directeur technique",
    verification: "reported",
    sources: ["club-site"],
    note: "Cité sur la page « Le Club » du site officiel ; date de mise à jour inconnue.",
  },
];

/** Facts that describe the club, used instead of an invented mission statement. */
export const identityPillars: ({ figure: string; label: string; text: string } & Sourced)[] = [
  {
    figure: "1921",
    label: "Un club centenaire",
    text: "Fondé le 1er juillet 1921, le Villeneuve-Sports a fêté ses cent ans en 2021.",
    verification: "confirmed",
    sources: ["asf-club", "commune-postulat"],
  },
  {
    figure: "15 → 160",
    label: "Un mouvement junior relancé",
    text: "En 2015, le comité est presque entièrement renouvelé et le club ne compte que 15 enfants. En 2023, ils sont près de 160, encadrés par une quinzaine de bénévoles.",
    verification: "reported",
    sources: ["radio-chablais-2023"],
  },
  {
    figure: "12",
    label: "Équipes engagées",
    text: "Des actifs aux juniors, dont une équipe de juniores filles FF-17 engagée en championnat cette saison.",
    verification: "confirmed",
    sources: ["acvf-matchcenter"],
  },
  {
    figure: "57",
    label: "Points en 2025/26",
    text: "Champion du groupe 6 de 4e ligue : 18 victoires, 3 nuls, 1 défaite, 85 buts marqués. Le club joue en 3e ligue en 2026/27.",
    verification: "confirmed",
    sources: ["footromand-champion", "acvf-club", "proxifoot-2026-09"],
  },
];

export const milestones: Milestone[] = [
  {
    year: "1921",
    title: "Fondation",
    text: "Le club est fondé le 1er juillet 1921 à Villeneuve, au bout du Léman.",
    verification: "confirmed",
    sources: ["asf-club", "commune-postulat"],
  },
  {
    year: "1968",
    title: "Le stade de la Tronchenaz",
    text: "Année de construction indiquée pour le stade de la Tronchenaz, propriété de la commune.",
    verification: "reported",
    sources: ["europlan-stade"],
  },
  {
    year: "1993/94",
    title: "Champion de groupe seniors",
    text: "Les seniors du FC Villeneuve Sports figurent parmi les champions de groupe dans les archives seniors de l'ACVF.",
    verification: "reported",
    sources: ["acvf-seniors"],
  },
  {
    year: "2015",
    title: "Le renouveau",
    text: "Après un coup d'arrêt, la quasi-totalité du comité est renouvelée. Le mouvement junior compte alors 15 enfants.",
    verification: "reported",
    sources: ["radio-chablais-2023"],
  },
  {
    year: "2021",
    title: "Cent ans",
    text: "Le Villeneuve-Sports devient centenaire.",
    verification: "confirmed",
    sources: ["asf-club"],
  },
  {
    year: "2023",
    title: "Près de 160 juniors",
    text: "Le club aligne une équipe dans chaque catégorie sauf les juniors A et B. L'équipe fanion est montée d'un échelon. Au Conseil communal, un postulat demande d'améliorer les conditions à la Tronchenaz (vestiaires, locaux, horaires).",
    verification: "reported",
    sources: ["radio-chablais-2023", "commune-postulat"],
  },
  {
    year: "2026",
    title: "Champion de 4e ligue",
    text: "Le 24 mai, une victoire 2–0 contre le FC Aigle II offre le titre du groupe 6 à deux journées de la fin. La saison 2026/27 se joue en 3e ligue.",
    verification: "confirmed",
    sources: ["footromand-champion", "proxifoot-2026-09"],
  },
];
