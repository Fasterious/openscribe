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
    what: 'Toutes les personnes qui donnent un avis sur ce thème sont du même côté.',
    why: "Ce n'est pas l'accord de tous : qui ne donne pas d'avis n'est compté ni pour ni contre.",
    action: 'Regardez le chiffre : « unanime » sur 4 avis pèse moins que sur 40.',
  },
  consensus: {
    what: 'Au moins 80 % des personnes qui donnent un avis sont du même côté.',
    why: 'Les autres avis, contraires ou mitigés, ne sont pas effacés : leurs citations restent sous le thème.',
  },
  majority: {
    what: 'Plus de la moitié des personnes qui donnent un avis sont du même côté, mais moins de 80 %.',
    why: "Ce n'est pas une large majorité : plus d'un avis sur cinq va dans l'autre sens ou reste mitigé.",
  },
  lean: {
    what: 'Le camp en tête ne dépasse pas la moitié des personnes qui donnent un avis.',
    why: "Contraires ou mitigés (du bien et du mal à la fois), les autres avis font au moins la moitié : aucun camp ne l'emporte.",
  },
  divided: {
    what: 'Les deux camps se tiennent (le plus petit compte au moins 2 personnes et la moitié du plus grand), ou les mitigés sont au moins aussi nombreux que le plus grand camp.',
    why: 'Le thème divise : aucun camp ne peut parler au nom des autres.',
    action: 'Lisez les citations de chaque côté avant de conclure.',
  },
  thin: {
    what: 'Moins de 4 personnes donnent un avis sur ce thème.',
    why: "Sur si peu d'avis, une proportion ne dit rien : c'est un signal à suivre, pas une tendance.",
  },
  none: {
    what: "Personne ne donne d'avis : le thème ne réunit que des suggestions, des questions ou des constats.",
    why: "Ces idées valent pour ce qu'elles proposent, demandent ou constatent, pas comme un jugement.",
  },
}

export const FRAGILE_HELP: LabelHelp = {
  what: "Il suffirait qu'une seule personne change d'avis pour que la conclusion change : un camp perdrait sa majorité, des avis partagés donneraient la majorité à un camp, ou l'absence de majorité deviendrait un partage.",
  why: 'Une seule voix pèse lourd quand les camps sont proches ou les avis peu nombreux ; le code fait le calcul pour chaque thème.',
  action: "Citez le chiffre plutôt que l'étiquette, et relisez les verbatims.",
}

export const DOUBT_HELP: LabelHelp = {
  what: "L'étiquette tient à des avis comptés aussi dans un autre thème : sans eux, elle serait différente.",
  why: "Une même idée peut juger deux choses à la fois : le moteur d'IA l'a rangée dans deux thèmes, le code mesure ce que cela change.",
  action: "Relisez les citations marquées « aussi dans » et décidez si elles relèvent bien de ce thème.",
}

export const MINORITY_HELP: LabelHelp = {
  what: 'Au moins 2 personnes vont à contre-courant sur ce thème, sans dépasser un quart des avis, et aucune ne donne un avis mitigé.',
  why: 'Une minorité constante peut voir ce que les autres ne voient pas : on la montre au lieu de la fondre dans la majorité.',
}

export const LIMITS_HELP: LabelHelp = {
  what: 'Une même idée peut relever de plusieurs thèmes, se découper autrement, ou se ranger dans un thème plus large ou plus fin.',
  why: 'Deux lecteurs humains ne trancheraient pas toujours de la même façon ; la méthode ne vise pas zéro erreur, elle rend chaque choix vérifiable.',
  action: "En cas de doute, relisez les citations et la définition du thème ; une étiquette qui dépend d'idées rangées dans deux thèmes porte la mention « à vérifier ».",
}

/** Le texte d'une infobulle, en une ligne : ce que c'est, pourquoi, et quoi faire. */
export function helpText(h: LabelHelp): string {
  return [h.what, h.why, h.action].filter(Boolean).join(' ')
}

/** Le même texte derrière un intitulé (« Limites : … ») : minuscule après les deux-points. */
export const labelled = (label: string, h: LabelHelp): string => {
  const t = helpText(h)
  return `${label} : ${t.charAt(0).toLowerCase()}${t.slice(1)}`
}
