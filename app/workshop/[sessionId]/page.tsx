'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import type {
  WorkshopSession,
  WorkshopResponse,
  WorkshopAnalysis,
  LLMProvider,
  AnalysisResult,
  Cluster,
} from '@/types/workshop';
import { LLM_MODELS } from '@/types/workshop';

function uniqueParticipantCount(cluster: Cluster): number {
  return new Set(cluster.excerpts.map((e) => e.response_id)).size;
}

type Tab = 'clusters' | 'wordcloud' | 'raw';
type TestPreset = '' | '20' | '40' | '60' | '80' | '100';

const FIRST_NAMES = [
  'Alice', 'Bruno', 'Claire', 'David', 'Emma', 'François', 'Géraldine', 'Hugo',
  'Isabelle', 'Julien', 'Karine', 'Léo', 'Marie', 'Nicolas', 'Ophélie', 'Pierre',
  'Quentin', 'Roxane', 'Sébastien', 'Théo', 'Ursula', 'Vincent', 'Wendy', 'Xavier',
  'Yasmine', 'Zoé', 'Antoine', 'Béatrice', 'Cédric', 'Delphine', 'Éric', 'Fatima',
  'Guillaume', 'Hélène', 'Ivan', 'Jade', 'Kevin', 'Laure', 'Maxime', 'Nadia',
  'Olivier', 'Pauline', 'Raphaël', 'Sophie', 'Thomas', 'Valérie', 'William', 'Yannick',
  'Aurélie', 'Baptiste', 'Camille', 'Damien', 'Élise', 'Fabien', 'Gaëlle', 'Hervé',
  'Inès', 'Joël', 'Katia', 'Lucas', 'Margaux', 'Nathan', 'Océane', 'Patrick',
  'Rémi', 'Sarah', 'Tristan', 'Ugo', 'Virginie', 'Wanda', 'Yves', 'Zara',
  'Adrien', 'Brigitte', 'Charles', 'Diane', 'Étienne', 'Flore', 'Gaspard', 'Hannah',
  'Irène', 'Jacques', 'Lena', 'Marius', 'Noémie', 'Oscar', 'Priscilla', 'Roland',
  'Sylvie', 'Thibaut', 'Ursule', 'Véronique', 'Wilfried', 'Ximena', 'Yolande', 'Zacharie',
  'Arnaud', 'Blanche', 'Clément', 'Dorothée',
];

interface ClusterTemplate {
  label: string;
  summary: string;
  responses: string[];
}

// Distribution Zipf inversée : 16, 14, 12, 10, 9, 8, 7, 6, 5, 4, 3, 3, 2, 1 = 100
const ZIPF_DISTRIBUTION = [16, 14, 12, 10, 9, 8, 7, 6, 5, 4, 3, 3, 2, 1];

const CLUSTER_TEMPLATES: ClusterTemplate[] = [
  {
    label: 'Problème de communication interne',
    summary: 'Les participants soulignent un manque de communication entre les équipes, entraînant des doublons, des malentendus et une perte de temps considérable au quotidien.',
    responses: [
      "On ne sait jamais ce que font les autres équipes. J'ai déjà passé deux semaines sur un livrable pour découvrir qu'une autre équipe avait fait exactement la même chose en parallèle. C'est frustrant et c'est un gaspillage de ressources énorme.",
      "Les informations se perdent entre les services, il n'y a pas de canal centralisé. On jongle entre les mails, Teams, le chat interne et les Post-it. Résultat : personne n'a la même version de l'info.",
      "Je trouve que les réunions hebdo ne suffisent pas pour avoir une vraie visibilité. On a besoin d'outils de communication asynchrone qui permettent de suivre les avancées sans multiplier les réunions.",
      "Les décisions sont prises sans consulter les personnes concernées.\nOn l'apprend par un mail collectif après coup et on doit s'adapter dans l'urgence.",
      "Le manque de transparence crée de la frustration au quotidien. J'ai l'impression qu'il y a deux mondes : ceux qui savent et ceux qui subissent les décisions.\nÇa nuit clairement à l'engagement.",
      "Ce qui me pose le plus problème, c'est qu'on n'a pas de source de vérité unique.\nChaque équipe a ses propres fichiers, ses propres process, et quand il faut collaborer c'est un vrai casse-tête.\nIl faudrait un wiki interne à jour.",
      "J'ai rejoint l'équipe il y a 6 mois et j'ai mis des semaines à comprendre qui fait quoi. L'organigramme n'est pas à jour, les rôles ne sont pas clairs. Un onboarding plus structuré avec une cartographie des compétences serait un vrai plus.",
      "La communication descendante existe, mais la communication montante est quasi inexistante.\nQuand on remonte des problèmes terrain, on a rarement un retour. Ça donne l'impression que nos feedbacks partent dans le vide.",
      "Entre les sites de Paris et Lyon, la communication est catastrophique. On découvre des projets en cours par hasard.\nIl faudrait des points inter-sites réguliers, même courts.",
      "On perd un temps fou à chercher la bonne information. Est-ce dans le mail de lundi ? Dans le compte-rendu de réunion ? Sur le drive partagé ?\nPersonne ne sait. Un outil de gestion de connaissances centralisé nous ferait gagner des heures chaque semaine.",
      "Le problème c'est que chaque manager a sa propre façon de communiquer.\nCertains envoient des mails détaillés, d'autres ne disent rien.\nIl faudrait un standard de communication minimum.",
      "J'apprécie les efforts récents avec la newsletter interne, mais ça ne suffit pas pour le quotidien opérationnel. On a besoin de transparence sur les décisions projet en temps réel.",
      "Les informations critiques arrivent souvent trop tard. La dernière fois, on a appris le changement de deadline 48h avant l'échéance.\nC'est ingérable pour organiser le travail de l'équipe.",
      "Quand il y a un incident en production, chaque équipe gère dans son coin.\nOn n'a pas de canal de crise transversal.\nLa dernière panne a duré 4h de plus que nécessaire à cause de ça.",
      "Ce qui manque vraiment c'est un rituel de partage inter-équipes.\nPas une grande messe formelle, mais des démos courtes, informelles, pour voir ce que font les autres et créer des synergies.",
      "La communication avec les prestataires externes est aussi un sujet. Ils n'ont pas accès aux mêmes outils que nous et l'information se perd dans des allers-retours de mails interminables.",
    ],
  },
  {
    label: 'Besoin de formation continue',
    summary: 'Un besoin fort de montée en compétences est exprimé, notamment sur les nouveaux outils, les méthodes agiles et les compétences transversales nécessaires pour évoluer.',
    responses: [
      "J'aimerais avoir accès à plus de formations sur les outils qu'on utilise au quotidien.\nOn a déployé un nouveau CRM il y a 3 mois et je n'ai eu que 30 minutes de démo.\nJe n'utilise probablement que 20% des fonctionnalités.",
      "On nous demande d'utiliser de nouveaux logiciels sans formation préalable.\nLe résultat c'est qu'on perd du temps à bidouiller au lieu d'être efficaces.\nUn parcours de formation structuré pour chaque outil serait un minimum.",
      "La formation initiale à l'arrivée est correcte, mais ensuite il n'y a rien.\nLes métiers évoluent vite, et après 2-3 ans on se retrouve avec des compétences qui ne sont plus à jour.\nIl faudrait un plan de développement continu.",
      "Il faudrait un budget formation individuel pour se perfectionner sur les sujets qui nous intéressent.\nD'autres entreprises proposent 1000-1500€ par an de budget personnel, c'est un vrai levier de motivation et de fidélisation.",
      "Les webinaires internes sont utiles mais pas assez fréquents. On en a un par trimestre alors qu'il faudrait au moins un par mois.\nEt il faudrait varier les sujets : soft skills, technique, management, pas juste des présentations produit.",
      "J'aimerais beaucoup qu'on mette en place des « learning hours » hebdomadaires.\nUne heure dédiée où chacun peut se former, regarder un cours en ligne, lire un article technique.\nChez mon ancien employeur ça marchait très bien.",
      "Le problème c'est qu'on n'a pas le temps de se former.\nLa charge de travail est telle qu'on repousse toujours.\nLa formation devrait être planifiée et sanctuarisée dans l'agenda, pas optionnelle.",
      "Les compétences data et IA deviennent incontournables dans notre métier.\nMais personne n'a été formé.\nOn regarde les autres entreprises se transformer pendant qu'on reste sur nos acquis.",
      "Je souhaiterais des formations certifiantes qui puissent être valorisées.\nPas juste des présentations internes, mais de vrais parcours reconnus qui motivent les collaborateurs à investir du temps.",
      "L'apprentissage entre pairs est sous-exploité chez nous.\nOn a des experts dans plein de domaines mais on ne partage pas assez.\nDes sessions de type « lunch & learn » ou « brown bag sessions » seraient géniales.",
      "Pour les managers, il n'y a quasiment aucune formation au management.\nOn promeut des experts techniques à des postes de managers sans les accompagner.\nRésultat : ils sont malheureux et leurs équipes aussi.",
      "J'ai demandé une formation il y a 8 mois. Elle a été validée par mon manager puis refusée par les RH pour raison budgétaire.\nLe processus est trop opaque et décourageant.",
      "Il faudrait une plateforme e-learning accessible à tous, avec du contenu de qualité.\nType LinkedIn Learning ou Coursera.\nC'est un investissement mais le ROI en compétences est immense.",
      "Les nouvelles méthodes de travail (Design Thinking, Lean, OKR) ne sont connues que par quelques personnes.\nSi on veut vraiment les adopter, il faut former massivement, pas juste envoyer un PDF.",
    ],
  },
  {
    label: 'Amélioration des outils numériques',
    summary: 'Les outils actuels sont jugés obsolètes ou inadaptés aux usages modernes. Des suggestions concrètes de modernisation sont proposées avec un vrai sentiment d\'urgence.',
    responses: [
      "Notre CRM est lent et ne correspond plus à nos besoins actuels.\nIl plante régulièrement, l'interface date des années 2010, et il nous manque des fonctionnalités basiques comme le suivi des interactions multicanal.\nIl est temps de migrer.",
      "Il faudrait moderniser notre intranet, personne ne l'utilise.\nLa dernière mise à jour date de 2019.\nQuand je cherche un document, c'est plus rapide de demander à un collègue que de naviguer dans l'arborescence.",
      "Pourquoi ne pas adopter des outils collaboratifs modernes comme Notion, Slack ou Figma ?\nOn utilise encore des fichiers Word partagés par mail pour collaborer.\nEn 2026, c'est aberrant.",
      "Les outils de reporting sont trop complexes pour un usage quotidien.\nChaque rapport nécessite 3h de manipulation Excel.\nUn outil de BI en self-service avec des dashboards pré-configurés changerait tout.",
      "On devrait automatiser les tâches répétitives avec des workflows.\nJe passe 2h par jour sur des tâches administratives qui pourraient être automatisées :\nrelances, saisie de données, génération de rapports standards.",
      "L'accès VPN est instable, ce qui rend le télétravail pénible.\nJe perds la connexion au moins 3 fois par jour.\nIl existe des solutions zero-trust plus modernes et plus fiables.",
      "On a trop d'outils qui font la même chose.\nEntre l'outil officiel et les solutions adoptées par chaque équipe, on a 4 outils de gestion de tâches différents.\nIl faudrait rationaliser et choisir un seul outil pour chaque usage.",
      "Notre outil de ticketing est une catastrophe UX.\nLes développeurs passent plus de temps à remplir les tickets qu'à coder.\nOn devrait migrer vers Jira ou Linear, quelque chose de moderne et rapide.",
      "L'app mobile interne n'est pas responsive et certaines fonctionnalités ne marchent tout simplement pas sur téléphone.\nQuand on est en déplacement, c'est très handicapant.",
      "Le stockage de fichiers est éclaté entre le NAS, SharePoint, Google Drive et des clés USB.\nOn ne retrouve plus rien.\nUne politique claire de stockage avec un seul outil serait salvatrice.",
      "Les performances de notre ERP sont inacceptables.\nCharger une facture prend 15 secondes.\nMultiplié par 200 factures par jour, ça fait presque une heure perdue.",
      "On n'a pas d'outil de signature électronique officiel.\nOn imprime, on signe, on scanne, on envoie par mail.\nC'est archaïque et ça ralentit tous les processus contractuels.",
    ],
  },
  {
    label: 'Questionnement sur la stratégie',
    summary: 'Des interrogations profondes sur la direction stratégique de l\'organisation, le manque de vision claire et le besoin de cohérence entre le discours et les actions.',
    responses: [
      "Où va-t-on exactement ? La vision à 3 ans n'est pas claire.\nOn entend parler de transformation digitale, d'internationalisation, d'innovation, mais concrètement quelles sont les priorités ?\nJ'aimerais comprendre comment mon travail s'inscrit dans cette vision.",
      "Comment notre travail au quotidien s'inscrit dans la stratégie globale ?\nOn fait des projets, on livre, mais on ne sait pas si c'est aligné avec les objectifs de l'entreprise.\nUn lien plus explicite entre stratégie et opérations serait motivant.",
      "Les priorités changent trop souvent, c'est déstabilisant.\nEn 6 mois, on a eu 3 réorganisations et 2 changements de cap.\nLes équipes ont besoin de stabilité pour être performantes.",
      "J'aimerais comprendre pourquoi certains projets sont abandonnés du jour au lendemain alors qu'on y a investi des mois de travail.\nUn minimum d'explication serait respectueux envers les équipes qui se sont investies.",
      "La stratégie devrait être co-construite avec les collaborateurs.\nOn a une expertise terrain que la direction n'a pas.\nDes ateliers de co-construction stratégique créeraient de l'adhésion et de meilleures décisions.",
      "On parle beaucoup d'innovation mais on ne nous donne pas les moyens d'innover.\nPas de budget R&D, pas de temps dédié, pas de droit à l'erreur.\nL'innovation ne se décrète pas, elle se cultive.",
      "Le décalage entre le discours managérial (agilité, autonomie, confiance) et la réalité (process lourds, validations multiples, contrôle) est flagrant.\nIl faudrait aligner les actes avec les paroles.",
      "Je me demande quelle est notre position face à la concurrence.\nOn ne nous partage jamais d'analyse concurrentielle.\nComprendre notre positionnement nous aiderait à mieux défendre notre offre.",
      "L'absence de communication sur les résultats financiers crée de l'inquiétude.\nOn entend des rumeurs de restructuration sans avoir aucun élément factuel.\nLa transparence réduirait l'anxiété collective.",
      "Notre marché évolue très vite avec l'arrivée de nouveaux acteurs tech.\nQuelle est notre réponse ?\nJ'ai l'impression qu'on attend de voir plutôt que d'anticiper.",
    ],
  },
  {
    label: 'Satisfaction sur l\'ambiance d\'équipe',
    summary: 'L\'ambiance de travail et la cohésion d\'équipe sont unanimement saluées comme un point fort majeur de l\'organisation, source de motivation quotidienne.',
    responses: [
      "L'ambiance dans l'équipe est vraiment top, c'est ce qui me fait rester.\nMême dans les périodes de rush, on garde le sourire et on s'entraide.\nC'est rare et précieux.",
      "Je me sens bien au travail grâce à mes collègues bienveillants.\nIl y a un vrai respect mutuel et une écoute sincère.\nQuand j'ai traversé une période difficile personnellement, tout le monde a été là.",
      "L'entraide est naturelle ici, c'est appréciable.\nQuand quelqu'un est en difficulté sur un sujet, il y a toujours un collègue pour proposer son aide sans qu'on ait besoin de demander.",
      "Les événements d'équipe (afterworks, team buildings, petits-déjeuners) renforcent notre cohésion.\nCe n'est pas juste du « fun corporate », ça crée de vrais liens humains qui facilitent ensuite le travail au quotidien.",
      "C'est une vraie force de pouvoir compter les uns sur les autres.\nDans mon équipe, personne ne laisse tomber un collègue.\nCe sentiment de sécurité psychologique est la base de notre performance.",
      "L'intégration des nouveaux est exemplaire.\nQuand je suis arrivé, tout le monde a pris le temps de m'accueillir, de m'expliquer, de m'inclure dans les rituels.\nJe me suis senti chez moi dès la première semaine.",
      "La diversité de profils dans l'équipe est une richesse.\nOn a des parcours très différents et c'est ça qui rend nos discussions riches et nos solutions créatives.",
      "Mon manager fait un excellent travail pour maintenir l'ambiance.\nIl est à l'écoute, il désamorce les tensions rapidement, et il sait célébrer les petites victoires.\nUn bon manager ça change tout.",
      "Même en télétravail, l'esprit d'équipe reste fort.\nOn a gardé nos rituels (café virtuel du matin, rétrospectives fun) et ça maintient le lien humain malgré la distance.",
    ],
  },
  {
    label: 'Difficulté de recrutement',
    summary: 'Le processus de recrutement est perçu comme trop lent et inadapté, entraînant une surcharge chronique pour les équipes existantes et une perte de candidats qualifiés.',
    responses: [
      "On n'arrive pas à recruter assez vite, les postes restent vacants 4 à 6 mois en moyenne.\nPendant ce temps, l'équipe absorbe la charge, ce qui crée de l'épuisement et de la démotivation.\nC'est un cercle vicieux : plus on est épuisés, moins l'équipe est attractive.",
      "La surcharge de travail due au sous-effectif impacte la qualité de ce qu'on livre.\nOn fait du mieux qu'on peut mais on rogne sur les tests, la documentation, le polissage.\nÀ terme ça crée de la dette technique et des problèmes clients.",
      "Il faudrait revoir notre marque employeur pour attirer plus de candidats.\nNotre site carrières est austère, nos offres d'emploi sont des copier-coller génériques.\nLes talents vont là où l'entreprise fait envie.",
      "Les processus de validation RH sont trop lents.\nEntre l'identification du besoin et la publication de l'offre, il se passe 6 semaines.\nDans le marché actuel, les bons profils ne restent pas disponibles aussi longtemps.",
      "On perd des bons candidats à cause de nos délais de réponse.\nLa dernière fois, un excellent profil a signé ailleurs pendant qu'on attendait le retour du comité de validation.\nIl faut raccourcir le process à 2 semaines max.",
      "Le programme de cooptation n'est pas assez incitatif.\nLa prime est trop faible et versée trop tard.\nSi on la doublait et qu'on la versait à la fin de la période d'essai, on aurait beaucoup plus de recommandations.",
      "On devrait être présents dans les écoles et les meetups tech.\nNotre visibilité dans l'écosystème est quasi nulle.\nLes étudiants et jeunes diplômés ne nous connaissent pas.",
      "Les fiches de poste sont trop exigeantes et découragent des candidats qui pourraient monter en compétences.\n« 5 ans d'expérience minimum en React, TypeScript, AWS et GraphQL »… sérieusement ?\nOn cherche des licornes au lieu de former des potentiels.",
    ],
  },
  {
    label: 'Idée de mentorat interne',
    summary: 'Proposition de créer un programme de mentorat structuré pour accompagner les nouveaux, favoriser le transfert de compétences et créer du lien intergénérationnel.',
    responses: [
      "Un système de parrainage pour les nouveaux arrivants serait très utile.\nLes premiers mois sont déterminants et avoir un référent qui n'est pas le manager direct permettrait de poser des questions « bêtes » sans pression.",
      "Les seniors ont énormément de connaissances à transmettre mais ça se perd.\nDes sessions de mentorat régulières, même 1h par mois, permettraient de capitaliser sur cette expertise avant les départs en retraite.",
      "Le mentorat pourrait aussi aider à la mobilité interne.\nAujourd'hui on ne connaît pas les métiers des autres services.\nUn mentor d'un autre département ouvrirait des perspectives de carrière.",
      "J'aurais aimé avoir un mentor quand je suis arrivé dans l'entreprise.\nJ'ai mis 6 mois à comprendre les codes, la culture, les réseaux informels.\nAvec un parrain, ça aurait pris 6 semaines.",
      "Ça créerait du lien intergénérationnel dans l'entreprise.\nLes juniors apporteraient leur regard neuf et leur maîtrise du digital,\nles seniors leur expérience et leur réseau.\nGagnant-gagnant.",
      "J'ai vu ça fonctionner dans mon ancienne boîte.\nLe programme de mentorat était structuré : matching basé sur les objectifs, points mensuels, évaluation semestrielle.\nÇa avait un vrai impact sur la rétention des talents.",
      "Le mentorat inversé serait intéressant aussi.\nLes juniors pourraient former les seniors aux nouveaux outils digitaux.\nÇa valorise les jeunes et ça décloisonne les générations.",
    ],
  },
  {
    label: 'Manque de reconnaissance',
    summary: 'Les efforts individuels et collectifs ne sont pas suffisamment reconnus. L\'impact sur la motivation et l\'engagement est significatif.',
    responses: [
      "On fait des efforts considérables mais on n'a jamais de retour positif.\nLa seule fois où on entend parler de nous, c'est quand il y a un problème.\nUn feedback positif de temps en temps ferait tellement de bien.",
      "La reconnaissance ne passe pas que par le salaire, un simple merci sincère compte énormément.\nUn mail de félicitations de la direction après un projet réussi, une mention en réunion d'équipe...\nCes petits gestes ont un impact immense sur le moral.",
      "Il faudrait célébrer davantage les succès d'équipe.\nOn enchaîne les projets sans jamais marquer le coup.\nUn pot, un mail de remerciement, une rétrospective positive... quelque chose pour reconnaître le travail accompli.",
      "Les évaluations annuelles ne reflètent pas le travail réel fourni pendant l'année.\nEn 30 minutes, on ne peut pas couvrir 12 mois d'efforts.\nDes points trimestriels seraient plus justes et plus utiles.",
      "Un système de reconnaissance entre pairs serait motivant.\nPouvoir dire publiquement « merci à Claire pour son aide sur le projet X » valorise et crée une culture positive.",
      "J'ai porté un projet stratégique pendant 8 mois, livré dans les temps et sous le budget.\nPas un mot de remerciement.\nMon collègue dans une autre boîte a eu un bonus et une promotion pour moins que ça.\nÇa fait réfléchir.",
    ],
  },
  {
    label: 'Besoin de flexibilité horaire',
    summary: 'Le télétravail et les horaires flexibles sont fortement demandés pour améliorer l\'équilibre vie professionnelle/vie personnelle et la productivité.',
    responses: [
      "Le télétravail devrait être étendu à 3 jours par semaine minimum.\nLes jours où je suis au bureau, je passe 2h dans les transports et je suis constamment interrompu.\nMes jours de télétravail sont mes jours les plus productifs.",
      "Les horaires rigides (9h-18h obligatoire) ne correspondent plus aux modes de vie actuels.\nCertains sont plus efficaces tôt le matin, d'autres tard le soir.\nLa flexibilité c'est faire confiance aux adultes pour organiser leur temps.",
      "La flexibilité permettrait de mieux gérer les contraintes familiales sans culpabiliser.\nPouvoir emmener ses enfants à l'école et commencer à 9h30, c'est pas la mer à boire.\nLe résultat compte plus que les heures de présence.",
      "On est plus productif quand on peut organiser son temps librement, c'est prouvé par toutes les études.\nLe présentéisme est un fléau français.\nJugeons les résultats, pas les heures de chaise.",
      "D'autres entreprises du secteur offrent beaucoup plus de souplesse et ça joue directement sur l'attractivité.\nJ'ai deux collègues qui sont partis cette année pour des boîtes full remote.\nSi on ne s'adapte pas, on va continuer à perdre des talents.",
    ],
  },
  {
    label: 'Préoccupation écologique',
    summary: 'Une réflexion croissante sur l\'impact environnemental de l\'organisation et des propositions concrètes pour réduire l\'empreinte carbone.',
    responses: [
      "On devrait réduire drastiquement les déplacements professionnels en avion.\nLa moitié des voyages pourraient être remplacés par des visioconférences.\nC'est bon pour la planète ET pour le budget.",
      "Pourquoi ne pas passer au zéro papier dans tous les services ?\nOn imprime encore des tonnes de documents qui finissent à la poubelle.\nAvec la signature électronique et les outils digitaux, c'est parfaitement faisable.",
      "L'entreprise devrait publier son bilan carbone annuel et se fixer des objectifs de réduction ambitieux.\nLes jeunes générations en particulier sont sensibles à cet engagement.\nC'est aussi un argument commercial face aux clients qui ont des critères RSE.",
      "Les fournisseurs devraient être sélectionnés aussi sur des critères écologiques et pas uniquement sur le prix.\nOn ne peut pas prôner la responsabilité environnementale et acheter au moins-disant sans regarder l'impact.",
    ],
  },
  {
    label: 'Force de l\'expertise technique',
    summary: 'Le niveau d\'expertise technique des équipes est reconnu comme un avantage compétitif majeur, source de fierté et de différenciation sur le marché.',
    responses: [
      "Notre expertise technique est reconnue par nos clients, c'est une vraie fierté.\nLors du dernier audit, le client a souligné la qualité exceptionnelle de notre code et de notre architecture.\nC'est le fruit d'années d'investissement dans les compétences.",
      "On a des profils très pointus qui font la différence sur les appels d'offres.\nNotre capacité à résoudre des problèmes complexes est ce qui nous distingue de la concurrence.\nIl faut continuer à investir dans ces expertises.",
      "La qualité de nos livrables est un vrai atout concurrentiel.\nLes clients savent que quand c'est nous, c'est solide, bien pensé et maintenable.\nCette réputation se construit projet après projet.",
    ],
  },
  {
    label: 'Risque de burn-out',
    summary: 'Plusieurs signaux d\'alerte sur la charge de travail excessive et ses conséquences sur la santé mentale et physique des collaborateurs.',
    responses: [
      "La charge de travail est devenue insoutenable depuis 6 mois.\nJe travaille régulièrement le soir et le week-end pour tenir les délais.\nMon médecin m'a dit que je montrais des signes d'épuisement professionnel.\nIl faut que ça change.",
      "Je vois des collègues au bord de l'épuisement et personne ne réagit.\nLes arrêts maladie se multiplient dans l'équipe.\nQuand quelqu'un s'arrête, sa charge est répartie sur les autres et ça aggrave le problème.\nC'est un engrenage dangereux.",
      "Les deadlines irréalistes génèrent un stress permanent qui mine le moral de toute l'équipe.\nOn nous demande de livrer en 2 semaines ce qui en nécessite 6.\nPuis on nous reproche la qualité insuffisante. C'est absurde.",
    ],
  },
  {
    label: 'Suggestion d\'espaces collaboratifs',
    summary: 'Repenser les espaces de travail pour favoriser la collaboration, la créativité et le bien-être, tout en préservant des zones de concentration.',
    responses: [
      "On manque cruellement d'espaces pour brainstormer en petit groupe.\nLes seules options sont la grande salle de réunion (toujours réservée) ou le couloir.\nDes petits espaces modulables avec des tableaux blancs seraient parfaits.",
      "Les salles de réunion sont systématiquement occupées.\nJ'ai essayé de réserver un créneau la semaine prochaine : tout est pris.\nIl en faut plus, ou il faut mieux gérer les réservations fantômes.",
      "Un espace type lab d'innovation serait vraiment stimulant.\nUn lieu dédié à l'expérimentation, avec du matériel de prototypage, des écrans, des post-its géants.\nÇa donnerait un signal fort sur la culture d'innovation.",
    ],
  },
  {
    label: 'Interrogation sur l\'IA',
    summary: 'Questions et attentes autour de l\'intégration de l\'intelligence artificielle dans les processus de travail, entre enthousiasme et inquiétude.',
    responses: [
      "Comment l'IA va-t-elle impacter nos métiers concrètement ?\nJ'entends des discours contradictoires : certains disent que ça va tout révolutionner, d'autres que c'est du hype.\nJ'aimerais une vision claire de la direction sur ce sujet.",
    ],
  },
];

function buildFullTestDataset(): {
  responses: WorkshopResponse[];
  analysis: AnalysisResult;
} {
  const responses: WorkshopResponse[] = [];
  const clusters: Cluster[] = [];
  let nameIdx = 0;

  CLUSTER_TEMPLATES.forEach((tpl, ci) => {
    const count = ZIPF_DISTRIBUTION[ci];
    const excerpts: { participant_name: string; response_id: string; excerpt: string }[] = [];

    for (let j = 0; j < count; j++) {
      const name = FIRST_NAMES[nameIdx % FIRST_NAMES.length];
      nameIdx++;
      const responseText = tpl.responses[j % tpl.responses.length];
      const id = `test-${ci}-${j}`;
      responses.push({
        id,
        session_id: 'test',
        participant_name: name,
        participant_token: `tok-${id}`,
        response_text: responseText,
        created_at: new Date(Date.now() - (100 - nameIdx) * 60000).toISOString(),
        updated_at: new Date().toISOString(),
      });
      excerpts.push({ participant_name: name, response_id: id, excerpt: responseText.split('\n')[0] });
    }

    clusters.push({
      label: tpl.label,
      summary: tpl.summary,
      participant_count: count,
      excerpts,
    });
  });

  return {
    responses,
    analysis: {
      clusters,
      global_summary: 'L\'analyse fait ressortir 14 thématiques majeures avec une forte concentration autour des problèmes de communication (16 mentions) et du besoin de formation (14 mentions). Les préoccupations opérationnelles (outils, recrutement, charge de travail) dominent, tandis que des signaux positifs sur l\'ambiance d\'équipe et l\'expertise technique constituent des leviers de rétention importants.',
      total_responses: 100,
      total_participants: 100,
    },
  };
}

let _cachedFull: ReturnType<typeof buildFullTestDataset> | null = null;
function getFullTestDataset() {
  if (!_cachedFull) _cachedFull = buildFullTestDataset();
  return _cachedFull;
}

function generateTestData(participantCount: number): {
  responses: WorkshopResponse[];
  analysis: AnalysisResult;
} {
  const full = getFullTestDataset();
  if (participantCount >= 100) return full;

  const ratio = participantCount / 100;
  const subResponses: WorkshopResponse[] = [];
  const subClusters: Cluster[] = [];

  for (const cluster of full.analysis.clusters) {
    let subCount = Math.round(cluster.participant_count * ratio);
    if (subCount < 1 && cluster.participant_count >= 1) subCount = Math.random() < ratio * 2 ? 1 : 0;
    if (subCount === 0) continue;

    subClusters.push({
      label: cluster.label,
      summary: cluster.summary,
      participant_count: subCount,
      excerpts: cluster.excerpts.slice(0, subCount),
    });

    const clusterResponses = full.responses.filter((r) =>
      cluster.excerpts.some((e) => e.response_id === r.id)
    );
    subResponses.push(...clusterResponses.slice(0, subCount));
  }

  const actualTotal = subClusters.reduce((s, c) => s + c.participant_count, 0);

  return {
    responses: subResponses,
    analysis: {
      clusters: subClusters,
      global_summary: `Échantillon de ${actualTotal} participants répartis en ${subClusters.length} clusters. Les thématiques dominantes restent la communication interne et le besoin de formation, avec une décroissance naturelle vers les sujets plus niches comme l'IA ou les espaces collaboratifs.`,
      total_responses: actualTotal,
      total_participants: actualTotal,
    },
  };
}

export default function SessionView() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const supabase = createClient();

  const [session, setSession] = useState<WorkshopSession | null>(null);
  const [responses, setResponses] = useState<WorkshopResponse[]>([]);
  const [analysis, setAnalysis] = useState<WorkshopAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<Tab>('wordcloud');
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<LLMProvider>('gemini');
  const [showQR, setShowQR] = useState(true);
  const [testPreset, setTestPreset] = useState<TestPreset>('');

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== 'undefined' ? window.location.origin : '');
  const participateUrl = `${baseUrl}/workshop/${sessionId}/participate`;

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/workshop/sessions/${sessionId}`);
      if (!res.ok) throw new Error('Session not found');
      const data = await res.json();
      setSession(data.session);
      setResponses(data.responses);
      setAnalysis(data.analysis);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error loading session');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // Supabase Realtime for live response updates + slow polling fallback
  useEffect(() => {
    if (loading) return;

    let realtimeActive = false;

    const channel = supabase
      .channel(`workshop-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workshop_responses',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          realtimeActive = true;
          if (payload.eventType === 'INSERT') {
            setResponses((prev) => {
              if (prev.some((r) => r.id === payload.new.id)) return prev;
              return [...prev, payload.new as WorkshopResponse];
            });
          } else if (payload.eventType === 'UPDATE') {
            setResponses((prev) =>
              prev.map((r) =>
                r.id === payload.new.id ? (payload.new as WorkshopResponse) : r
              )
            );
          }
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loading, sessionId, supabase]);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const res = await fetch('/api/workshop/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          provider: selectedProvider,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Analysis failed');
      }

      const data = await res.json();
      setAnalysis(data.analysis ?? { clusters: data.result });
      setActiveTab('wordcloud');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(participateUrl);
  };

  const testData = useMemo(() => {
    if (!testPreset) return null;
    return generateTestData(Number(testPreset));
  }, [testPreset]);

  const effectiveResponses = testPreset ? (testData?.responses ?? []) : responses;
  const effectiveAnalysis: AnalysisResult | null = testPreset
    ? (testData?.analysis ?? null)
    : analysis
      ? (analysis.clusters as unknown as AnalysisResult)
      : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-10 flex justify-center py-20">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
        </main>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-10">
          <div className="max-w-md mx-auto text-center py-20">
            <p className="text-destructive">{error}</p>
          </div>
        </main>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Session header */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="flex-1 min-w-0">
              <a
                href="/workshop"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 mb-3"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Retour
              </a>
              <h1 className="text-xl font-bold text-foreground">
                {session.question}
              </h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {responses.length} réponse{responses.length > 1 ? 's' : ''}
                </span>
                <button
                  onClick={fetchSession}
                  title="Rafraîchir les réponses"
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    session.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {session.status === 'active' ? 'Active' : 'Fermée'}
                </span>
              </div>
            </div>
          </div>

          {/* QR Code section */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground">
                Partager avec les participants
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowQR(!showQR)}
              >
                {showQR ? 'Masquer' : 'Afficher'} le QR code
              </Button>
            </div>

            {showQR && (
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="bg-white p-4 rounded-xl border border-border">
                  <QRCodeSVG
                    value={participateUrl}
                    size={180}
                    level="M"
                    includeMargin={false}
                  />
                </div>
                <div className="flex-1 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Les participants scannent ce QR code pour accéder à la session
                    et répondre à votre question.
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={participateUrl}
                      className="flex-1 text-sm bg-muted rounded-lg px-3 py-2 text-muted-foreground border border-border"
                    />
                    <Button variant="outline" size="sm" onClick={copyLink}>
                      Copier
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Analysis controls */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-semibold text-foreground">Analyse</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Clusterisez les réponses pour identifier les tendances
                </p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={selectedProvider}
                  onChange={(e) =>
                    setSelectedProvider(e.target.value as LLMProvider)
                  }
                  className="text-sm rounded-lg border border-input bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {(Object.entries(LLM_MODELS) as [LLMProvider, { label: string }][]).map(
                    ([key, { label }]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    )
                  )}
                </select>
                <Button
                  onClick={handleAnalyze}
                  disabled={analyzing || responses.length === 0}
                >
                  {analyzing ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2" />
                      Analyse en cours...
                    </>
                  ) : (
                    <>
                      <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      Analyser les réponses
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-border">
            <div className="flex items-center justify-between">
              <nav className="flex gap-1">
                {[
                  { id: 'wordcloud' as Tab, label: 'Nuage de mots' },
                  { id: 'clusters' as Tab, label: 'Clusters' },
                  { id: 'raw' as Tab, label: 'Données brutes' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>

              <select
                value={testPreset}
                onChange={(e) => setTestPreset(e.target.value as TestPreset)}
                className="text-xs rounded-md border border-dashed border-border bg-transparent px-2 py-1 text-muted-foreground/60 hover:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors mb-1"
              >
                <option value="">Données réelles</option>
                <option value="20">Test · 20 participants</option>
                <option value="40">Test · 40 participants</option>
                <option value="60">Test · 60 participants</option>
                <option value="80">Test · 80 participants</option>
                <option value="100">Test · 100 participants</option>
              </select>
            </div>
          </div>

          {/* Tab content */}
          {activeTab === 'clusters' && (
            <ClustersView
              result={effectiveAnalysis}
              analyzing={!testPreset && analyzing}
              responseCount={effectiveResponses.length}
            />
          )}

          {activeTab === 'wordcloud' && (
            <WordCloudView
              result={effectiveAnalysis}
              analyzing={!testPreset && analyzing}
              responseCount={effectiveResponses.length}
            />
          )}

          {activeTab === 'raw' && <RawDataView responses={effectiveResponses} />}

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 rounded-xl p-3">
              {error}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function ClustersView({
  result,
  analyzing,
  responseCount,
}: {
  result: AnalysisResult | null;
  analyzing: boolean;
  responseCount: number;
}) {
  if (analyzing) {
    return (
      <div className="text-center py-16 space-y-4">
        <div className="animate-spin h-10 w-10 border-3 border-primary border-t-transparent rounded-full mx-auto" />
        <p className="text-muted-foreground">
          Analyse de {responseCount} réponse{responseCount > 1 ? 's' : ''} en
          cours...
        </p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p>
          {responseCount === 0
            ? 'En attente de réponses des participants...'
            : `${responseCount} réponse${responseCount > 1 ? 's' : ''} reçue${responseCount > 1 ? 's' : ''}. Cliquez sur "Analyser les réponses" pour générer les clusters.`}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Global summary */}
      {result.global_summary && (
        <div className="bg-primary/5 rounded-2xl border border-primary/20 p-5">
          <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
            <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Synthèse globale
          </h3>
          <p className="text-sm text-foreground/80">{result.global_summary}</p>
          <p className="text-xs text-muted-foreground mt-2">
            {result.total_participants} participant{result.total_participants > 1 ? 's' : ''} —{' '}
            {result.clusters.length} cluster{result.clusters.length > 1 ? 's' : ''} identifié{result.clusters.length > 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* Clusters */}
      {result.clusters.map((cluster: Cluster, idx: number) => (
        <ClusterCard key={idx} cluster={cluster} index={idx} />
      ))}
    </div>
  );
}

type CategoryId = 'problem' | 'need' | 'idea' | 'question' | 'strength' | 'other';
type ColorMode = 'category' | 'readability';

const CATEGORY_DEFS: { id: CategoryId; label: string; color: string; pattern?: RegExp }[] = [
  {
    id: 'problem',
    label: 'Problèmes',
    color: 'oklch(0.6 0.22 25)',
    pattern: /problème|difficulté|obstacle|frein|blocage|risque|danger|menace|faiblesse|limite|contrainte|défi|challenge|pain|problem|souci|complex|insuffisan|inadapt|frustrat|tension|conflit/i,
  },
  {
    id: 'need',
    label: 'Besoins',
    color: 'oklch(0.6 0.19 250)',
    pattern: /besoin|nécessité|attente|demande|exigence|manque|priorité|need|requirement|indispensable|essentiel|fondamental|accès|accompagnement|ressource|support|formation/i,
  },
  {
    id: 'idea',
    label: 'Améliorations',
    color: 'oklch(0.62 0.19 150)',
    pattern: /amélioration|idée|suggestion|proposition|innovation|solution|opportunité|piste|recommandation|optimisation|evolution|idea|improvement|créat|développ|mise en place|renforcement|modernis/i,
  },
  {
    id: 'question',
    label: 'Questionnements',
    color: 'oklch(0.7 0.17 65)',
    pattern: /question|interrogation|incertitude|doute|clarification|compréhension|inquiry|pourquoi|comment|\?|réflexion|préoccupation/i,
  },
  {
    id: 'strength',
    label: 'Points forts',
    color: 'oklch(0.6 0.2 290)',
    pattern: /force|atout|avantage|succès|réussite|satisfaction|point fort|strength|positive|qualité|bénéfice|apprécié|efficac|fierté|motivation/i,
  },
  {
    id: 'other',
    label: 'Autre',
    color: 'oklch(0.6 0.12 230)',
  },
];

function detectCategory(text: string): CategoryId {
  for (const cat of CATEGORY_DEFS) {
    if (cat.pattern?.test(text)) return cat.id;
  }
  return 'other';
}

const READABILITY_PALETTE = [
  'oklch(0.55 0.22 25)',
  'oklch(0.50 0.2 250)',
  'oklch(0.55 0.2 150)',
  'oklch(0.60 0.20 310)',
];

interface LayoutWord {
  text: string;
  size: number;
  x: number;
  y: number;
  x0?: number;
  y0?: number;
  x1?: number;
  y1?: number;
  clusterIndex: number;
  category: CategoryId;
  readabilityColor: number;
}

const MIN_FONT = 24;
const MAX_FONT = 56;
const PROXIMITY = 20;

function getWordBox(w: LayoutWord): { l: number; r: number; t: number; b: number } {
  if (w.x0 != null && w.y0 != null && w.x1 != null && w.y1 != null) {
    return {
      l: w.x + w.x0 - PROXIMITY,
      r: w.x + w.x1 + PROXIMITY,
      t: w.y + w.y0 - PROXIMITY,
      b: w.y + w.y1 + PROXIMITY,
    };
  }
  const CHAR_W_RATIO = 0.58;
  const halfW = (w.text.length * w.size * CHAR_W_RATIO) / 2;
  const halfH = w.size * 0.65;
  return {
    l: w.x - halfW - PROXIMITY,
    r: w.x + halfW + PROXIMITY,
    t: w.y - halfH - PROXIMITY,
    b: w.y + halfH + PROXIMITY,
  };
}

function computeReadabilityColors(words: LayoutWord[]): number[] {
  const boxes = words.map((w) => getWordBox(w));
  const adj: Set<number>[] = words.map(() => new Set());
  for (let i = 0; i < words.length; i++) {
    for (let j = i + 1; j < words.length; j++) {
      const a = boxes[i], b = boxes[j];
      if (a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t) {
        adj[i].add(j);
        adj[j].add(i);
      }
    }
  }

  const N = READABILITY_PALETTE.length;
  const colors = new Array<number>(words.length).fill(-1);
  const order = words.map((_, i) => i).sort((a, b) => adj[b].size - adj[a].size || words[b].size - words[a].size);
  for (const i of order) {
    const used = new Set<number>();
    for (const n of adj[i]) if (colors[n] >= 0) used.add(colors[n]);
    let c = 0;
    while (used.has(c) && c < N) c++;
    colors[i] = c % N;
  }
  return colors;
}

/** Couche par couche : mots ligne par ligne, du plus gros au plus petit, mesure Canvas précise */
function packWordsLineByLine<T extends { text: string; count: number }>(
  data: T[],
  minFont: number,
  maxFont: number
): { words: (T & { size: number; width: number; height: number; cx: number; cy: number })[]; bounds: { minX: number; maxX: number; minY: number; maxY: number } } {
  if (typeof document === 'undefined' || data.length === 0) {
    return { words: [], bounds: { minX: 0, maxX: 1, minY: 0, maxY: 1 } };
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  const gapX = 32;
  const gapY = 20;
  const maxLineWidth = 1200;

  const maxCount = Math.max(...data.map((d) => d.count));
  const minCount = Math.min(...data.map((d) => d.count));
  const range = maxCount - minCount || 1;

  const words = data
    .map((d) => {
      const size = minFont + ((d.count - minCount) / range) * (maxFont - minFont);
      ctx.font = `500 ${size}px system-ui, -apple-system, sans-serif`;
      const width = ctx.measureText(d.text).width;
      const height = size * 1.2;
      return { ...d, size, width, height };
    })
    .sort((a, b) => b.size - a.size);

  const lines: { words: typeof words; width: number; height: number }[] = [];
  let currentLine = { words: [] as typeof words, width: 0, height: 0 };

  for (const word of words) {
    if (currentLine.words.length === 0) {
      currentLine.words.push(word);
      currentLine.width = word.width;
      currentLine.height = word.height;
    } else if (currentLine.width + gapX + word.width <= maxLineWidth) {
      currentLine.words.push(word);
      currentLine.width += gapX + word.width;
      currentLine.height = Math.max(currentLine.height, word.height);
    } else {
      lines.push(currentLine);
      currentLine = { words: [word], width: word.width, height: word.height };
    }
  }
  if (currentLine.words.length > 0) lines.push(currentLine);

  const placed: (T & { size: number; width: number; height: number; cx: number; cy: number })[] = [];
  let currentY = 0;
  let actualMaxWidth = 0;

  for (const line of lines) {
    actualMaxWidth = Math.max(actualMaxWidth, line.width);
    let currentX = -line.width / 2;
    const lineCenterY = currentY + line.height / 2;

    for (const word of line.words) {
      placed.push({
        ...word,
        cx: currentX + word.width / 2,
        cy: lineCenterY,
      });
      currentX += word.width + gapX;
    }
    currentY += line.height + gapY;
  }

  return {
    words: placed,
    bounds: {
      minX: -actualMaxWidth / 2,
      maxX: actualMaxWidth / 2,
      minY: 0,
      maxY: currentY - (lines.length > 0 ? gapY : 0),
    },
  };
}

function WordCloudView({
  result,
  analyzing,
  responseCount,
}: {
  result: AnalysisResult | null;
  analyzing: boolean;
  responseCount: number;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [layoutWords, setLayoutWords] = useState<LayoutWord[]>([]);
  const [layoutBounds, setLayoutBounds] = useState<{ minX: number; maxX: number; minY: number; maxY: number } | null>(null);
  const [colorMode, setColorMode] = useState<ColorMode>('category');
  const [soloCategory, setSoloCategory] = useState<CategoryId | null>(null);
  const [tooltipAnchor, setTooltipAnchor] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!result) return;

    const clusters = result.clusters;
    const layerData = clusters.map((c, i) => ({
      text: c.label,
      count: uniqueParticipantCount(c),
      clusterIndex: i,
      category: detectCategory(c.label),
    }));

    const { words: placed, bounds } = packWordsLineByLine(layerData, MIN_FONT, MAX_FONT);
    const layoutWordsFromLayer: LayoutWord[] = placed.map((w) => ({
      text: w.text,
      size: w.size,
      x: w.cx,
      y: w.cy,
      x0: -w.width / 2,
      y0: -w.height / 2,
      x1: w.width / 2,
      y1: w.height / 2,
      clusterIndex: w.clusterIndex,
      category: w.category,
      readabilityColor: 0,
    }));
    const rColors = computeReadabilityColors(layoutWordsFromLayer);
    layoutWordsFromLayer.forEach((w, i) => { w.readabilityColor = rColors[i]; });
    setLayoutWords(layoutWordsFromLayer);
    setLayoutBounds(bounds);
  }, [result]);

  const activeCategories = useMemo(() => {
    const catSet = new Set(layoutWords.map((w) => w.category));
    return CATEGORY_DEFS.filter((c) => catSet.has(c.id));
  }, [layoutWords]);

  const bbox = useMemo(() => {
    if (layoutBounds) {
      const pad = 40;
      return {
        minX: layoutBounds.minX - pad,
        maxX: layoutBounds.maxX + pad,
        minY: layoutBounds.minY - pad,
        maxY: layoutBounds.maxY + pad,
        w: layoutBounds.maxX - layoutBounds.minX + pad * 2,
        h: layoutBounds.maxY - layoutBounds.minY + pad * 2,
      };
    }
    return { minX: 0, maxX: 0, minY: 0, maxY: 0, w: 1, h: 1 };
  }, [layoutBounds]);

  const handleLegendClick = (catId: CategoryId) => {
    setSoloCategory((prev) => (prev === catId ? null : catId));
  };

  if (analyzing) {
    return (
      <div className="text-center py-16 space-y-4">
        <div className="animate-spin h-10 w-10 border-3 border-primary border-t-transparent rounded-full mx-auto" />
        <p className="text-muted-foreground">
          Analyse de {responseCount} réponse{responseCount > 1 ? 's' : ''} en
          cours...
        </p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p>
          {responseCount === 0
            ? 'En attente de réponses des participants...'
            : `${responseCount} réponse${responseCount > 1 ? 's' : ''} reçue${responseCount > 1 ? 's' : ''}. Cliquez sur "Analyser les réponses" pour générer les clusters.`}
        </p>
      </div>
    );
  }

  const clusters = result.clusters;

  const displayHeight = bbox.h;
  const viewBox = layoutBounds ? `${bbox.minX} ${bbox.minY} ${bbox.w} ${bbox.h}` : null;

  function getWordColor(word: LayoutWord): string {
    if (colorMode === 'category') {
      return CATEGORY_DEFS.find((c) => c.id === word.category)?.color ?? CATEGORY_DEFS[5].color;
    }
    return READABILITY_PALETTE[word.readabilityColor] ?? READABILITY_PALETTE[0];
  }

  function isWordVisible(word: LayoutWord): boolean {
    if (colorMode !== 'category' || soloCategory === null) return true;
    return word.category === soloCategory;
  }

  return (
    <div className="space-y-3">
      {/* Options : Par type / Lisibilité */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded-lg border border-border bg-muted/50 p-0.5">
          {([
            { id: 'category' as ColorMode, label: 'Par type' },
            { id: 'readability' as ColorMode, label: 'Lisibilité' },
          ]).map((mode) => (
            <button
              key={mode.id}
              onClick={() => { setColorMode(mode.id); setSoloCategory(null); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                colorMode === mode.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>

        {colorMode === 'category' && activeCategories.length > 1 && (
          <div className="flex flex-wrap items-center gap-x-1 gap-y-1">
            {activeCategories.map((cat) => {
              const isActive = soloCategory === null || soloCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleLegendClick(cat.id)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${
                    soloCategory === cat.id
                      ? 'border-foreground/20 bg-foreground/5 text-foreground'
                      : soloCategory === null
                        ? 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        : 'border-transparent text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/30'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0 transition-opacity"
                    style={{
                      backgroundColor: cat.color,
                      opacity: isActive ? 1 : 0.3,
                    }}
                  />
                  {cat.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Cloud */}
      <div
        ref={containerRef}
        className="bg-card rounded-2xl border border-border relative overflow-visible flex justify-center"
        style={{
          height: `${displayHeight || 400}px`,
          minHeight: 400,
          maxHeight: 'min(80vh, 800px)',
        }}
        onClick={() => { setActiveIndex(null); setTooltipAnchor(null); }}
      >
        {viewBox ? (
          <svg
            width="100%"
            height="100%"
            viewBox={viewBox}
            preserveAspectRatio="xMidYMid meet"
            className="max-h-[600px]"
          >
            <g>
              {layoutWords.map((word) => {
                const cluster = clusters[word.clusterIndex];
                const isActive = activeIndex === word.clusterIndex;
                const isDimmed = activeIndex !== null && !isActive;
                const visible = isWordVisible(word);

                return (
                  <g
                    key={word.clusterIndex}
                    style={{ cursor: 'pointer', pointerEvents: visible ? 'auto' : 'none' }}
                    onMouseEnter={(e) => {
                      if (!visible) return;
                      setActiveIndex(word.clusterIndex);
                      const el = e.currentTarget as SVGGElement;
                      const container = containerRef.current;
                      if (!el || !container) return;
                      const rect = el.getBoundingClientRect();
                      const containerRect = container.getBoundingClientRect();
                      const TOOLTIP_W = 288;
                      const TOOLTIP_H_EST = 280;
                      const GAP = 12;
                      const spaceRight = containerRect.right - rect.right;
                      const spaceLeft = rect.left - containerRect.left;
                      const side = spaceRight >= TOOLTIP_W + GAP || spaceRight >= spaceLeft ? 'right' : 'left';
                      const x = side === 'right' ? rect.right - containerRect.left + GAP : rect.left - containerRect.left - TOOLTIP_W - GAP;
                      let y = rect.top - containerRect.top + rect.height / 2;
                      y = Math.max(TOOLTIP_H_EST / 2, Math.min(containerRect.height - TOOLTIP_H_EST / 2, y));
                      setTooltipAnchor({ x, y });
                    }}
                    onMouseLeave={() => {
                      setActiveIndex(null);
                      setTooltipAnchor(null);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!visible) return;
                      setActiveIndex((prev) =>
                        prev === word.clusterIndex ? null : word.clusterIndex
                      );
                    }}
                  >
                    <text
                      x={word.x}
                      y={word.y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      style={{
                        fontSize: `${word.size}px`,
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                        fontWeight: 500,
                        fill: getWordColor(word),
                        opacity: !visible ? 0.06 : isDimmed ? 0.15 : 0.9,
                        transition: 'opacity 0.3s ease',
                      }}
                    >
                      {word.text}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        ) : null}
        {activeIndex !== null && tooltipAnchor && (() => {
          const cluster = clusters[activeIndex];
          if (!cluster) return null;
          return (
            <div
              className="absolute z-50 w-72 bg-card rounded-xl border border-border shadow-xl"
              style={{
                left: tooltipAnchor.x,
                top: tooltipAnchor.y,
                transform: 'translateY(-50%)',
                padding: '16px',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">
                  {uniqueParticipantCount(cluster)}
                </span>
                <h3 className="font-semibold text-foreground text-sm truncate">
                  {cluster.label}
                </h3>
              </div>
              <p
                className="text-xs text-muted-foreground leading-relaxed mb-3"
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {cluster.summary}
              </p>
              <div className="space-y-1.5">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Extraits ({cluster.excerpts.length})
                </h4>
                {cluster.excerpts.slice(0, 3).map((excerpt, i) => (
                  <div key={i} className="bg-muted/50 rounded-md px-3 py-2 text-xs">
                    <span className="font-medium text-foreground">{excerpt.participant_name}</span>
                    <span className="text-muted-foreground"> : </span>
                    <span
                      className="text-foreground/80 italic"
                      style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      &quot;{excerpt.excerpt}&quot;
                    </span>
                  </div>
                ))}
                {cluster.excerpts.length > 3 && (
                  <p className="text-xs text-muted-foreground text-center pt-1">
                    +{cluster.excerpts.length - 3} extrait{cluster.excerpts.length - 3 > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

function ClusterCard({
  cluster,
  index,
}: {
  cluster: Cluster;
  index: number;
}) {
  const [expanded, setExpanded] = useState(index < 3);

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-5 py-4 flex items-center justify-between hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-semibold flex items-center justify-center">
            {uniqueParticipantCount(cluster)}
          </span>
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground truncate">
              {cluster.label}
            </h3>
          </div>
        </div>
        <svg
          className={`h-5 w-5 text-muted-foreground flex-shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-border pt-4">
          <p className="text-sm text-muted-foreground">{cluster.summary}</p>

          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Extraits ({cluster.excerpts.length})
            </h4>
            {cluster.excerpts.map((excerpt, i) => (
              <div
                key={i}
                className="bg-muted/50 rounded-lg px-4 py-3 text-sm"
              >
                <span className="font-medium text-foreground">
                  {excerpt.participant_name}
                </span>
                <span className="text-muted-foreground"> : </span>
                <span className="text-foreground/80 italic">
                  &quot;{excerpt.excerpt}&quot;
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RawDataView({ responses }: { responses: WorkshopResponse[] }) {
  if (responses.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        En attente de réponses des participants...
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground w-40">
                Participant
              </th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                Réponse
              </th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground w-36">
                Date
              </th>
            </tr>
          </thead>
          <tbody>
            {responses.map((r) => (
              <tr key={r.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium text-foreground align-top">
                  {r.participant_name}
                </td>
                <td className="px-4 py-3 text-foreground/80 align-top whitespace-pre-wrap">
                  {r.response_text}
                </td>
                <td className="px-4 py-3 text-muted-foreground align-top text-xs">
                  {new Date(r.created_at).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
