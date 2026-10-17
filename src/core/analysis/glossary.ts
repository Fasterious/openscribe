import type { Metrics } from './types'

/**
 * Ce que veut dire chaque étiquette de méthode, pourquoi on l'emploie et, s'il le faut, ce que le lecteur peut
 * faire : le texte des infobulles de l'application et du rapport exporté (décision d'Arnaud, 17/10). Textes
 * centralisés ici pour la traduction ; la section Méthode du rapport et `docs/METHODE.md` disent la même chose.
 */
export interface LabelHelp {
  /** Ce que signifie l'étiquette, en une phrase. */
  what: string
  /** Pourquoi la méthode la pose. */
  why: string
  /** Ce que le lecteur peut faire, quand il y a quelque chose à faire. */
  action?: string
}

export const STANCE_HELP: Record<Metrics['stance'], LabelHelp> = {
  unanimous: {
    what: 'Toutes les personnes qui donnent un avis sur ce motif sont du même côté.',
    why: "Ce n'est pas l'accord de tous : celles qui n'en ont pas parlé ne comptent pas, se taire n'est ni approuver ni désapprouver.",
    action: 'Regardez le nombre : « unanime » sur 4 avis pèse moins que sur 40.',
  },
  consensus: {
    what: 'Au moins 80 % des personnes qui donnent un avis sont du même côté.',
    why: "L'autre camp existe, même petit : ses citations restent sous le motif, parce qu'une minorité reste visible.",
  },
  majority: {
    what: 'Plus de la moitié des personnes qui donnent un avis sont du même côté, mais moins de 80 %.',
    why: "On distingue la majorité du consensus : une majorité laisse une part importante d'avis contraires.",
  },
  lean: {
    what: 'Le camp en tête reste sous la moitié des personnes qui donnent un avis.',
    why: 'Souvent, beaucoup de personnes sont mitigées : elles disent du bien et du mal du même objet.',
  },
  divided: {
    what: "Les deux camps sont proches (le plus petit pèse au moins la moitié du plus grand), ou les mitigés sont aussi nombreux que le camp le plus fort.",
    why: 'Le motif divise : aucun camp ne peut parler au nom des autres.',
    action: 'Lisez les deux camps avant de conclure.',
  },
  thin: {
    what: 'Moins de 4 personnes donnent un avis sur ce motif.',
    why: "Sur si peu d'avis, une proportion ne dit rien : c'est un signal à suivre, pas une tendance.",
  },
  none: {
    what: "Personne ne donne d'avis : le motif réunit seulement des propositions, des questions ou des constats.",
    why: 'Ces idées comptent pour ce qu’elles proposent ou demandent, pas comme un jugement.',
  },
}

export const FRAGILE_HELP: LabelHelp = {
  what: "Il suffirait qu'une seule personne change de camp pour que l'étiquette change.",
  why: 'Sur de petits effectifs, une seule voix pèse lourd ; le code fait le calcul pour chaque motif.',
  action: "Citez le chiffre plutôt que l'étiquette, et relisez les citations.",
}

export const DOUBT_HELP: LabelHelp = {
  what: "L'étiquette tient à des avis comptés aussi dans un autre motif : sans eux, elle serait différente.",
  why: "Une même idée peut juger deux objets à la fois ; le moteur d'IA l'a comptée dans les deux, et le code mesure ce que cela change.",
  action: "Relisez les citations marquées « aussi dans » et décidez si elles relèvent bien de ce motif.",
}

export const MINORITY_HELP: LabelHelp = {
  what: "Un petit groupe de personnes, toujours les mêmes, va à contre-courant sur ce motif : au plus un quart des avis, et aucune n'est mitigée.",
  why: "Consensus n'est pas majorité : une voix minoritaire et cohérente peut signaler un vrai problème que le reste du groupe ne voit pas.",
}

export const LIMITS_HELP: LabelHelp = {
  what: 'Une même idée peut relever de plusieurs motifs, se découper autrement, ou se ranger dans un motif plus large ou plus fin.',
  why: 'Deux lecteurs humains ne trancheraient pas toujours de la même façon ; la méthode ne vise pas zéro erreur, elle rend chaque choix vérifiable.',
  action: "Chaque citation se consulte, chaque motif affiche sa définition, et une étiquette discutable porte la mention « à vérifier ».",
}

/** Le texte d'une infobulle, en une ligne : ce que c'est, pourquoi, et quoi faire. */
export function helpText(h: LabelHelp): string {
  return [h.what, h.why, h.action].filter(Boolean).join(' ')
}
