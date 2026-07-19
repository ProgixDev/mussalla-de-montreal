/**
 * "Apprendre" — the mussalla's library of short Islamic educational videos, grouped
 * by topic (woudou, prière, voisinage, manières, générosité, invocation). Each entry
 * is a real, verified YouTube video (id checked live via oEmbed; duration from the
 * watch page). Copy is Québec French, written + appropriateness-vetted per video.
 * This is a curated seed the backoffice can edit later — swap a `youtubeId`, add a
 * category, reorder — nothing else needs to change.
 *
 * Note on aniconism: the app's own graphics stay non-figurative; these are third-party
 * educational videos (of real teachers) that the community chooses to watch — embedded
 * on click only, via youtube-nocookie for privacy.
 */
export interface LearnVideo {
  /** YouTube video id (11 chars). */
  youtubeId: string;
  /** Québec-French card title (a clean label, not a literal translation). */
  title: string;
  description: string;
  /** Original channel, shown as attribution. */
  channel: string;
  durationSeconds: number;
}

export interface LearnCategory {
  key: string;
  name: string;
  tagline: string;
  /** Optional short Arabic accent (gold, RTL) — e.g. الصَّلاة. */
  arabic?: string;
  intro: string;
  videos: LearnVideo[];
}

/** Seconds → "m:ss" (tabular, e.g. 258 → "4:18"). */
export function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export const LEARN_CATEGORIES: LearnCategory[] = [
  {
    key: "woudou",
    name: "Le woudou",
    tagline: "Se purifier avant la prière, un geste simple et apaisant.",
    arabic: "الوُضوء",
    intro:
      "Le woudou, ce sont les ablutions que l’on accomplit avant la prière. Voici des vidéos claires pour apprendre chaque étape en douceur, que ce soit pour un premier apprentissage ou une petite révision.",
    videos: [
      {
        youtubeId: "eo3n_i-rHss",
        title: "Le woudou étape par étape",
        description:
          "Une animation claire et posée qui montre chaque geste des ablutions, idéale pour bien comprendre l’ensemble du woudou.",
        channel: "Adam – Islamic Animation",
        durationSeconds: 258,
      },
      {
        youtubeId: "_azOCWrpsko",
        title: "Le woudou en bref",
        description:
          "Une courte vidéo qui résume les étapes essentielles des ablutions, parfaite pour une révision rapide avant la prière.",
        channel: "English Ears",
        durationSeconds: 46,
      },
      {
        youtubeId: "_QkihFbF4Js",
        title: "Le woudou pour les enfants",
        description:
          "Un guide tout simple et chaleureux pensé pour les enfants, afin d’apprendre les ablutions en famille.",
        channel: "Raising 4 Caliphs",
        durationSeconds: 59,
      },
    ],
  },
  {
    key: "priere",
    name: "La prière",
    tagline: "Apprendre la salât, geste après geste, à son rythme.",
    arabic: "الصَّلاة",
    intro:
      "La prière est au cœur de la vie du croyant, un rendez-vous paisible avec Dieu cinq fois par jour. Voici quelques guides simples pour apprendre la salât ou revoir chaque étape en toute confiance.",
    videos: [
      {
        youtubeId: "zalLv2NY98k",
        title: "La salât pas à pas",
        description:
          "Un guide complet et posé qui reprend chaque étape de la prière, idéal pour bien débuter ou se rafraîchir la mémoire.",
        channel: "ALNAQWI",
        durationSeconds: 837,
      },
      {
        youtubeId: "oIPDD23hsl8",
        title: "La prière en bref",
        description:
          "Un court aperçu qui présente d’un coup d’œil l’enchaînement des gestes de la prière, pratique pour un rappel rapide.",
        channel: "Muhammad Ammar",
        durationSeconds: 35,
      },
      {
        youtubeId: "WuiLWYlEuew",
        title: "Le Fajr pour débutantes",
        description:
          "Une animation claire et bienveillante qui accompagne les femmes dans l’apprentissage de la prière du matin, étape par étape.",
        channel: "Adam – Islamic Animation",
        durationSeconds: 256,
      },
    ],
  },
  {
    key: "voisins",
    name: "Le bon voisinage",
    tagline: "Les droits du voisin : un lien de respect, de bonté et de paix.",
    arabic: "الجار",
    intro:
      "Le Prophète ﷺ nous a tant recommandé le voisin qu’on a cru qu’il allait en faire un héritier. Ces courtes vidéos rappellent avec douceur comment prendre soin de ceux qui vivent tout près de nous.",
    videos: [
      {
        youtubeId: "2co1t9v8_kU",
        title: "Prendre soin de son voisin",
        description:
          "En quelques minutes, Mufti Menk rappelle à quel point l’Islam accorde de l’importance au bien-être de nos voisins.",
        channel: "Mufti Menk",
        durationSeconds: 12,
      },
      {
        youtubeId: "IZYxsG0-2oQ",
        title: "Ce que le voisin mérite",
        description:
          "Un survol clair et chaleureux des égards que l’on doit à ceux qui habitent près de chez nous, proches comme éloignés.",
        channel: "The Muslim Guy",
        durationSeconds: 32,
      },
      {
        youtubeId: "1IGO6T9O2v8",
        title: "Les droits du voisin expliqués",
        description:
          "Huda TV détaille avec bienveillance les gestes concrets qui font d’un bon voisin un vrai pilier de la communauté.",
        channel: "Huda TV",
        durationSeconds: 111,
      },
    ],
  },
  {
    key: "manieres",
    name: "Les bonnes manières",
    tagline: "L’adab au quotidien : la douceur, le respect, le beau caractère.",
    arabic: "حُسْن الخُلُق",
    intro:
      "Le bon comportement est au cœur de notre foi. Ces courtes vidéos rappellent comment cultiver la douceur, la patience et le respect — envers nos parents, nos proches et tous ceux que l’on croise.",
    videos: [
      {
        youtubeId: "1OvFQ8XkLoQ",
        title: "Les fondements du bon caractère",
        description:
          "Un tour d’horizon clair des piliers de l’adab, pour poser des bases solides au quotidien.",
        channel: "Ilm – Seekers of Knowledge",
        durationSeconds: 258,
      },
      {
        youtubeId: "_-KxQjPLZIE",
        title: "La patience envers les autres",
        description:
          "Une belle réflexion sur la patience comme moitié des bonnes manières dans nos relations de tous les jours.",
        channel: "Towards Allah",
        durationSeconds: 71,
      },
      {
        youtubeId: "tbLADVe7hFY",
        title: "Parler avec douceur à ses parents",
        description:
          "Un court rappel touchant sur la tendresse et le respect que l’on doit à son père et à sa mère.",
        channel: "Islamic Family Stories",
        durationSeconds: 30,
      },
    ],
  },
  {
    key: "generosite",
    name: "La générosité",
    tagline: "Donner, même un peu, c’est semer le bien autour de soi.",
    arabic: "الصَّدَقة",
    intro:
      "La sadaqa, c’est le geste simple de partager avec le cœur ouvert. Ces courtes vidéos rappellent la beauté de la charité, au cœur même de la mission de notre caisse.",
    videos: [
      {
        youtubeId: "NV8r58N53hA",
        title: "C’est quoi, la sadaqa ?",
        description:
          "Le Mufti Menk explique en quelques mots ce qu’est vraiment la charité en Islam et pourquoi elle compte.",
        channel: "Muslim Central",
        durationSeconds: 89,
      },
      {
        youtubeId: "I2QpuRRq65o",
        title: "La force d’un don",
        description:
          "Un rappel touchant sur la puissance de la sadaqa et le bien qu’un simple geste peut répandre.",
        channel: "The Islamic Compass",
        durationSeconds: 49,
      },
      {
        youtubeId: "zBNzUgDwHw0",
        title: "La charité qui protège",
        description:
          "Omar Suleiman rappelle comment un don sincère éloigne le mal et ouvre les portes de la bénédiction.",
        channel: "Islamic-Waves",
        durationSeconds: 60,
      },
    ],
  },
  {
    key: "invocation",
    name: "L’invocation",
    tagline: "Ouvrir son cœur et parler à Allah, avec ses propres mots.",
    arabic: "ٱدْعُونِي أَسْتَجِبْ لَكُمْ",
    intro:
      "Le du‘â, c’est ce lien tout simple entre toi et Allah : un appel, une demande, une confidence. Voici quelques courtes vidéos pour apprendre à invoquer avec le cœur, sans se compliquer la vie.",
    videos: [
      {
        youtubeId: "fbMWzVjLSHY",
        title: "Le du‘â, pas à pas",
        description:
          "Un guide clair et posé pour comprendre les gestes et l’esprit du du‘â, du début jusqu’à la demande.",
        channel: "Green Lane Masjid",
        durationSeconds: 419,
      },
      {
        youtubeId: "gKiV51e00uM",
        title: "La bonne manière d’invoquer",
        description:
          "En moins d’une minute, Mufti Menk rappelle l’attitude du cœur qui donne toute sa force à l’invocation.",
        channel: "Islamestic",
        durationSeconds: 57,
      },
      {
        youtubeId: "mWuQI3m-RWo",
        title: "Invoquer, en bref",
        description:
          "Un rappel express des bonnes bases pour faire son du‘â correctement, idéal quand on découvre.",
        channel: "Light of Islam",
        durationSeconds: 40,
      },
    ],
  },
];
