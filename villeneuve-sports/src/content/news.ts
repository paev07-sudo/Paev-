import type { NewsArticle } from "./types";

/**
 * Articles written for this site from public sources. Each one names its
 * sources; quotes are short and verbatim. `date` is the date of the event.
 */
export const news: NewsArticle[] = [
  {
    slug: "tournoi-juniors-f-tronchenaz",
    title: "Les Juniors F en tournoi à la Tronchenaz",
    kicker: "Agenda",
    category: "Agenda",
    date: "2026-10-31",
    excerpt:
      "Le calendrier des tournois ACVF annonce un tournoi BRACK.CH PmF de catégorie F au stade de la Tronchenaz, samedi 31 octobre de 10 h à midi.",
    body: [
      "Le football des enfants se joue en tournois plutôt qu'en championnat. Le calendrier officiel des tournois de l'ACVF annonce un tournoi « BRACK.CH PmF » pour la catégorie Juniors F, saison 2026/27, au stade de la Tronchenaz.",
      "Rendez-vous samedi 31 octobre 2026, de 10 h à 12 h.",
      "La source ne détaille pas les équipes engagées. Pour les convocations, adressez-vous à l'entraîneur de votre enfant ou au club.",
    ],
    teamSlugs: ["juniors-f"],
    verification: "reported",
    sources: ["acvf-tournois"],
  },
  {
    slug: "3e-ligue-premiers-pas",
    title: "3e ligue : les premiers pas du néo-promu",
    kicker: "1re équipe",
    category: "Résultats",
    date: "2026-09-06",
    excerpt:
      "Promue après son titre en 4e ligue, la première équipe découvre le groupe 2 de 3e ligue. Le début de saison montre l'exigence du nouvel échelon.",
    body: [
      "Après le titre du groupe 6 de 4e ligue, la saison 2026/27 se joue un étage plus haut : Villeneuve-Sports I est engagé dans le groupe 2 de 3e ligue ACVF. La presse régionale (Proxifoot) le présente comme « néo-promu ».",
      "Le 6 septembre, le déplacement chez Pully Football II se solde par une défaite 5–1. Au début du mois de septembre, après trois journées, Villeneuve-Sports comptait une victoire et deux défaites (8 buts marqués, 9 encaissés), soit 3 points.",
      "Ce classement date du début de saison. Le classement à jour est publié chaque semaine sur le match center de l'ACVF.",
    ],
    teamSlugs: ["premiere-equipe"],
    verification: "reported",
    sources: ["proxifoot-2026-09", "footstats-3e"],
  },
  {
    slug: "champion-4e-ligue-groupe-6",
    title: "Villeneuve-Sports, champion du groupe 6 de 4e ligue",
    kicker: "Titre",
    category: "Résultats",
    date: "2026-05-24",
    excerpt:
      "Victoire 2–0 contre le FC Aigle II et titre assuré à deux journées de la fin : 18 victoires, 3 nuls, une seule défaite et 85 buts marqués.",
    body: [
      "Le 24 mai 2026, la première équipe s'impose 2–0 face au FC Aigle II et décroche officiellement le titre du groupe 6 de 4e ligue, à deux journées de la fin du championnat.",
      "L'ouverture du score tombe à la 16e minute : sur une touche jouée rapidement, Kenan Duric déborde son défenseur et centre au second poteau, où Ukaash Mohamed conclut avec sang-froid. Villeneuve scelle la rencontre à la 80e minute.",
      "Au classement ACVF relevé en juin, Villeneuve-Sports I totalise 57 points en 22 matchs (18 victoires, 3 nuls, 1 défaite), avec 85 buts marqués et 13 encaissés, devant le FC Aigle II.",
      "La saison s'est prolongée par les barrages de promotion de juin. Le club joue en 3e ligue en 2026/27.",
    ],
    quotes: [
      {
        text: "Le Villeneuve-Sports a officiellement décroché le titre de champion du groupe 6 de 4e ligue en s'imposant 2-0 face au FC Aigle II, à deux journées de la fin du championnat.",
        source: "footromand-champion",
      },
    ],
    teamSlugs: ["premiere-equipe"],
    verification: "confirmed",
    sources: ["footromand-champion", "acvf-club"],
  },
  {
    slug: "postulat-tronchenaz",
    title: "La Tronchenaz au Conseil communal",
    kicker: "Installations",
    category: "Installations",
    date: "2023-11-03",
    excerpt:
      "Un postulat demande à la Municipalité de clarifier les responsabilités autour des installations du club et de trouver des solutions pour les vestiaires, les locaux et les horaires.",
    body: [
      "En novembre 2023, le conseiller communal Dylan Karlen dépose le postulat « Make FC Villeneuve-Sport great again ! ». Il part d'un constat : le nombre de juniors a augmenté de 33 % entre les saisons 2021-22 et 2022-23, pour atteindre environ 120 enfants.",
      "Le texte relève le manque de vestiaires, accentué par la hausse des équipes mixtes, des filets de buts souvent endommagés, un terrain impraticable en basse saison et un bâtiment du club vieillissant.",
      "Il demande de clarifier les responsabilités entre le club et la commune sur la zone de la Tronchenaz et d'établir une feuille de route, en lien avec le réaménagement de la parcelle prévu pour le futur collège intercommunal. Le postulat figure dans les rapports de gestion de la Municipalité de 2024 et 2025.",
    ],
    verification: "reported",
    sources: ["udc-postulat", "commune-postulat", "commune-gestion-2025"],
  },
  {
    slug: "portrait-radio-chablais-2023",
    title: "De 15 à 160 juniors : le renouveau raconté par Radio Chablais",
    kicker: "Portrait",
    category: "Juniors",
    date: "2023-05-05",
    excerpt:
      "Dans sa série « Le club de foot du vendredi », Radio Chablais retrace la relance du club depuis 2015 et l'essor de son mouvement junior.",
    body: [
      "Le 5 mai 2023, Radio Chablais consacre le 8e épisode de sa série « Le club de foot du vendredi » au Villeneuve-Sports.",
      "Le portrait rappelle qu'en 2015, la quasi-totalité du comité a été renouvelée alors que le mouvement junior ne comptait que 15 enfants. Huit ans plus tard, ils sont près de 160, encadrés par une quinzaine de personnes, et l'équipe fanion est montée d'un échelon.",
      "Le club aligne alors une équipe dans chaque catégorie, à l'exception des juniors A et B, ainsi qu'une équipe féminine en FF-15.",
    ],
    quotes: [
      {
        text: "Fondé en 1921, le club désormais centenaire a toutefois connu un coup d'arrêt il y a quelques années.",
        source: "radio-chablais-2023",
      },
    ],
    verification: "reported",
    sources: ["radio-chablais-2023"],
  },
];

export function getArticle(slug: string): NewsArticle | undefined {
  return news.find((a) => a.slug === slug);
}

export function sortedNews(): NewsArticle[] {
  return [...news].sort((a, b) => b.date.localeCompare(a.date));
}
