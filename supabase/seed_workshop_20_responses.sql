-- Seed 20 réponses de test pour la session "Vos retours • 20 participants"
-- À exécuter dans l'éditeur SQL Supabase (Dashboard > SQL Editor)
--
-- Prérequis : une session avec question = 'Vos retours • 20 participants' doit exister.
-- Si le titre diffère, utilisez la version alternative ci-dessous avec votre session_id.
--
-- Pour trouver votre session_id : SELECT id, question FROM workshop_sessions;

INSERT INTO public.workshop_responses (session_id, participant_name, response_text)
SELECT
  s.id,
  r.participant_name,
  r.response_text
FROM public.workshop_sessions s
CROSS JOIN (
  VALUES
    ('Alice', 'On ne sait jamais ce que font les autres équipes. J''ai déjà passé deux semaines sur un livrable pour découvrir qu''une autre équipe avait fait exactement la même chose en parallèle. C''est frustrant et c''est un gaspillage de ressources énorme.'),
    ('Bruno', 'Les informations se perdent entre les services, il n''y a pas de canal centralisé. On jongle entre les mails, Teams, le chat interne et les Post-it. Résultat : personne n''a la même version de l''info.'),
    ('Claire', 'Je trouve que les réunions hebdo ne suffisent pas pour avoir une vraie visibilité. On a besoin d''outils de communication asynchrone qui permettent de suivre les avancées sans multiplier les réunions.'),
    ('David', 'Le manque de transparence crée de la frustration au quotidien. J''ai l''impression qu''il y a deux mondes : ceux qui savent et ceux qui subissent les décisions. Ça nuit clairement à l''engagement.'),
    ('Emma', 'J''aimerais avoir accès à plus de formations sur les outils qu''on utilise au quotidien. On a déployé un nouveau CRM il y a 3 mois et je n''ai eu que 30 minutes de démo. Je n''utilise probablement que 20% des fonctionnalités.'),
    ('François', 'On nous demande d''utiliser de nouveaux logiciels sans formation préalable. Le résultat c''est qu''on perd du temps à bidouiller au lieu d''être efficaces. Un parcours de formation structuré pour chaque outil serait un minimum.'),
    ('Géraldine', 'La formation initiale à l''arrivée est correcte, mais ensuite il n''y a rien. Les métiers évoluent vite, et après 2-3 ans on se retrouve avec des compétences qui ne sont plus à jour. Il faudrait un plan de développement continu.'),
    ('Hugo', 'Il faudrait un budget formation individuel pour se perfectionner sur les sujets qui nous intéressent. D''autres entreprises proposent 1000-1500€ par an de budget personnel, c''est un vrai levier de motivation et de fidélisation.'),
    ('Isabelle', 'Notre CRM est lent et ne correspond plus à nos besoins actuels. Il plante régulièrement, l''interface date des années 2010, et il nous manque des fonctionnalités basiques comme le suivi des interactions multicanal. Il est temps de migrer.'),
    ('Julien', 'Il faudrait moderniser notre intranet, personne ne l''utilise. La dernière mise à jour date de 2019. Quand je cherche un document, c''est plus rapide de demander à un collègue que de naviguer dans l''arborescence.'),
    ('Karine', 'Pourquoi ne pas adopter des outils collaboratifs modernes comme Notion, Slack ou Figma ? On utilise encore des fichiers Word partagés par mail pour collaborer. En 2026, c''est aberrant.'),
    ('Léo', 'Les outils de reporting sont trop complexes pour un usage quotidien. Chaque rapport nécessite 3h de manipulation Excel. Un outil de BI en self-service avec des dashboards pré-configurés changerait tout.'),
    ('Marie', 'Où va-t-on exactement ? La vision à 3 ans n''est pas claire. On entend parler de transformation digitale, d''internationalisation, d''innovation, mais concrètement quelles sont les priorités ? J''aimerais comprendre comment mon travail s''inscrit dans cette vision.'),
    ('Nicolas', 'Les priorités changent trop souvent, c''est déstabilisant. En 6 mois, on a eu 3 réorganisations et 2 changements de cap. Les équipes ont besoin de stabilité pour être performantes.'),
    ('Ophélie', 'La stratégie devrait être co-construite avec les collaborateurs. On a une expertise terrain que la direction n''a pas. Des ateliers de co-construction stratégique créeraient de l''adhésion et de meilleures décisions.'),
    ('Pierre', 'L''ambiance dans l''équipe est vraiment top, c''est ce qui me fait rester. Même dans les périodes de rush, on garde le sourire et on s''entraide. C''est rare et précieux.'),
    ('Quentin', 'Je me sens bien au travail grâce à mes collègues bienveillants. Il y a un vrai respect mutuel et une écoute sincère. Quand j''ai traversé une période difficile personnellement, tout le monde a été là.'),
    ('Roxane', 'L''entraide est naturelle ici, c''est appréciable. Quand quelqu''un est en difficulté sur un sujet, il y a toujours un collègue pour proposer son aide sans qu''on ait besoin de demander.'),
    ('Sébastien', 'On n''arrive pas à recruter assez vite, les postes restent vacants 4 à 6 mois en moyenne. Pendant ce temps, l''équipe absorbe la charge, ce qui crée de l''épuisement et de la démotivation. C''est un cercle vicieux.'),
    ('Théo', 'On perd des bons candidats à cause de nos délais de réponse. La dernière fois, un excellent profil a signé ailleurs pendant qu''on attendait le retour du comité de validation. Il faut raccourcir le process à 2 semaines max.')
) AS r(participant_name, response_text)
WHERE s.question = 'Vos retours • 20 participants';

-- Si aucune ligne n'est insérée : vérifiez le titre exact avec
--   SELECT id, question FROM workshop_sessions;
-- puis remplacez la chaîne dans le WHERE par votre question exacte.
