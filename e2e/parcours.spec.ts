import { expect, test, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'

const shot = (page: Page, name: string) => page.screenshot({ path: `e2e/screenshots/${test.info().project.name}-${name}.png`, fullPage: true })

/** Aucune page ne doit défiler horizontalement (mobile surtout). */
async function noHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow, 'défilement horizontal').toBeLessThanOrEqual(1)
}

/** Nombre d'études enregistrées dans ce navigateur. */
async function projectCount(page: Page): Promise<number> {
  return page.evaluate(
    () =>
      new Promise<number>((resolve, reject) => {
        const req = indexedDB.open('openscribe')
        req.onsuccess = () => {
          const count = req.result.transaction('projects').objectStore('projects').count()
          count.onsuccess = () => resolve(count.result)
          count.onerror = () => reject(count.error)
        }
        req.onerror = () => reject(req.error)
      }),
  )
}

async function newStudy(page: Page, name: string) {
  await page.goto('/#/synthese')
  await page.getByRole('button', { name: 'Nouvelle synthèse' }).click()
  await page.getByLabel("Nom de la synthèse").fill(name)
  await page.getByRole('button', { name: 'Créer' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toContainText(name)
}

test('accueil : la promesse, la preuve dépliable, les sections de réassurance', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Des verbatims au rapport')
  // La preuve : un constat de l'exemple dont on déplie les verbatims.
  await page.getByRole('button', { name: 'Voir les 3 verbatims' }).click()
  await expect(page.getByText('surtout sur mon vieux téléphone.').first()).toBeVisible()
  for (const h of ['Comment ça marche', 'Un outil par étape de votre recherche', 'Vos données, vos règles', 'Questions fréquentes', 'Ce qui arrive'])
    await expect(page.getByRole('heading', { name: h })).toBeVisible()
  // Pas encore de travail en cours : pas de bandeau « Reprendre ».
  await expect(page.getByText('Reprendre là où vous en étiez')).toHaveCount(0)
  await noHorizontalScroll(page)
  await shot(page, '1-accueil')

  // Le module Synthèse est cliquable et mène à son espace.
  await page.getByRole('link', { name: /Ouvrir l'espace Synthèse/ }).click()
  await expect(page.getByRole('heading', { name: 'Vos synthèses' })).toBeVisible()
})

test('exemple : de l’accueil au rapport, verbatims dépliés sur place et exports', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Voir un exemple de rapport' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toContainText('médiathèque')
  await expect(page.getByRole('heading', { name: 'Résumé' })).toBeVisible()
  await expect(page.getByText("Rapport d'exemple")).toBeVisible()
  await expect(page.getByText('À vérifier')).toHaveCount(0)
  // Le second niveau existe : des thèmes rapprochent les groupes.
  expect(await page.locator('section h2').count()).toBeGreaterThan(3)
  await noHorizontalScroll(page)
  await shot(page, '3-rapport')

  // Une référence de la synthèse déplie ses verbatims juste en dessous, sans fenêtre.
  await page
    .getByRole('button', { name: /Voir \d+ verbatims?/ })
    .first()
    .click()
  await expect(page.getByRole('button', { name: /Masquer \d+ verbatims?/ })).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.locator('article mark').first()).toBeVisible()
  await shot(page, '4-verbatims')

  // Export Markdown.
  await page.getByRole('button', { name: /Exporter/ }).click()
  const [md] = await Promise.all([page.waitForEvent('download'), page.getByRole('menuitem', { name: /Markdown/ }).click()])
  const text = readFileSync((await md.path())!, 'utf8')
  expect(text).toContain('## Résumé')
  expect(text).toContain('Méthode')

  // À l'impression, tous les groupes sont dépliés.
  await page.emulateMedia({ media: 'print' })
  await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')))
  expect(await page.locator('article details:not([open])').count()).toBe(0)
})

test('sources multiples : un questionnaire et deux entretiens déposés ensemble, renommés, analysés', async ({ page }) => {
  await newStudy(page, 'Étude mixte')
  const interview = (who: string, said: string) => ({
    name: `entretien-${who}.txt`,
    mimeType: 'text/plain',
    buffer: Buffer.from(
      `Animatrice : Comment trouvez-vous la médiathèque ?\n${who} : ${said}\nAnimatrice : Autre chose ?\n${who} : Les horaires du samedi sont trop courts pour moi.`,
    ),
  })
  // Trois fichiers d'un coup : le questionnaire, puis chaque entretien, aucun n'est perdu.
  await page
    .getByLabel('Fichier à importer')
    .setInputFiles([
      { name: 'mediatheque.csv', mimeType: 'text/csv', buffer: readFileSync('fixtures/mediatheque.csv') },
      interview('Julie', "J'aime beaucoup l'accueil, les bibliothécaires sont très disponibles."),
      interview('Marc', "Le site de réservation est lent, j'abandonne souvent avant la fin."),
    ])
  await page.getByRole('button', { name: /Importer les réponses à \d+ questions? · fichier suivant ensuite \(2\)/ }).click()
  // Un entretien est nommé « Entretien 1 » par défaut, pas par son nom de fichier (qui contient le prénom).
  await expect(page.getByLabel('Nom de la source')).toHaveValue('Entretien 1')
  await expect(page.getByText('Fichier : entretien-Julie.txt')).toBeVisible()
  await page.getByRole('checkbox', { name: /Animatrice/ }).uncheck()
  await page.getByRole('button', { name: /Importer · fichier suivant ensuite/ }).click()
  await expect(page.getByLabel('Nom de la source')).toHaveValue('Entretien 2')
  // L'animatrice reste décochée d'un entretien à l'autre.
  await expect(page.getByRole('checkbox', { name: /Animatrice/ })).not.toBeChecked()
  await page.getByRole('button', { name: 'Importer', exact: true }).click()
  await expect(page.getByText(/14 participants/).first()).toBeVisible()
  await expect(page.getByText(/3 sources/).first()).toBeVisible()

  // Renommer une source.
  await page.getByRole('button', { name: 'Renommer Entretien 1' }).click()
  await page.getByLabel('Nom de la source').fill('Entretien du 18 mai')
  await page.getByRole('button', { name: 'Renommer', exact: true }).click()
  await expect(page.getByText('Entretien du 18 mai')).toBeVisible()
  // Les relances de l'animatrice ne sont pas des questions à choisir.
  await expect(page.getByRole('group', { name: 'Questions à analyser' }).getByText('Comment trouvez-vous la médiathèque ?')).toHaveCount(0)
  await noHorizontalScroll(page)

  // L'analyse lit les trois sources ; le rapport dit d'où vient un verbatim d'entretien.
  await page.getByRole('tab', { name: /Analyse/ }).click()
  await page.getByRole('button', { name: "Lancer l'analyse" }).click()
  await page.getByRole('button', { name: 'Voir le rapport' }).click()
  await expect(page.getByText(/Entretien du 18 mai \(1 participant\)/)).toBeVisible()

  // Une source retirée après l'analyse : la liste des études ne dit plus « Rapport prêt ».
  await page.getByRole('tab', { name: /Données/ }).click()
  await page.getByRole('button', { name: 'Retirer Entretien 2' }).click()
  await page.getByRole('button', { name: 'Retirer', exact: true }).click()
  await page.getByRole('link', { name: /Vos synthèses/ }).click()
  const card = page.getByRole('link', { name: /Étude mixte/ })
  await expect(card).toContainText('Rapport à relancer')
  await expect(card).not.toContainText('Rapport prêt')
})

test('un fichier vide dans une série est sauté et signalé, jamais l’entretien précédent importé deux fois', async ({ page }) => {
  await newStudy(page, 'Série avec un fichier vide')
  const file = (name: string, text: string) => ({ name, mimeType: 'text/plain', buffer: Buffer.from(text) })
  await page
    .getByLabel('Fichier à importer')
    .setInputFiles([
      file('sophie.txt', 'Animatrice : Votre avis ?\nSophie : Le catalogue est clair.'),
      file('vide.txt', '   '),
      file('lea.txt', 'Animatrice : Votre avis ?\nLéa : La réservation est lente.'),
    ])
  await page.getByRole('checkbox', { name: /Animatrice/ }).uncheck()
  await page.getByRole('button', { name: /Importer · fichier suivant ensuite/ }).click()
  await expect(page.getByText(/Ignoré : vide\.txt/)).toBeVisible()
  await expect(page.getByText('Fichier : lea.txt')).toBeVisible()
  await expect(page.getByLabel('Nom de la source')).toHaveValue('Entretien 2')
  await page.getByRole('button', { name: 'Importer', exact: true }).click()
  await expect(page.getByText(/2 participants/).first()).toBeVisible()
  await expect(page.getByText(/2 sources/).first()).toBeVisible()
})

test('nouvelle étude : import CSV, puis l’utilisateur qui revient retrouve son étude', async ({ page }) => {
  await newStudy(page, 'Étude test CSV')
  await page.getByLabel('Fichier à importer').setInputFiles('fixtures/mediatheque.csv')
  await expect(page.getByRole('button', { name: /Importer les réponses à \d+ questions?/ })).toBeVisible()
  await noHorizontalScroll(page)
  await shot(page, '5-colonnes')
  await page.getByRole('button', { name: /Importer les réponses à \d+ questions?/ }).click()
  await expect(page.getByText('Vos données', { exact: true }).first()).toBeVisible()
  await expect(page.getByText(/12 participants/).first()).toBeVisible()
  await shot(page, '6-donnees')

  // Sans moteur configuré, on est invité à en choisir un ; la simulation reste là pour découvrir.
  await page.getByRole('tab', { name: /Analyse/ }).click()
  await expect(page.getByRole('link', { name: 'Choisir un moteur' })).toBeVisible()
  await expect(page.getByText('La simulation fonctionne')).toBeVisible()
  await shot(page, '2-analyse')
  await page.getByRole('button', { name: "Lancer l'analyse" }).click()
  await page.getByRole('button', { name: 'Voir le rapport' }).click()
  await expect(page.getByText('Rapport de démonstration')).toBeVisible()

  // De retour sur l'accueil, le bandeau « Reprendre » ramène à l'étude.
  await page.goto('/#/')
  await expect(page.getByText('Reprendre là où vous en étiez')).toBeVisible()
  await expect(page.getByText('« Étude test CSV »')).toBeVisible()
  await page.getByRole('link', { name: "Ouvrir la synthèse" }).click()
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Étude test CSV')
})

test('import de texte : l’animateur est exclu, sa question devient le contexte', async ({ page }) => {
  await newStudy(page, 'Entretiens')
  await page.getByRole('button', { name: 'Coller du texte' }).click()
  await page
    .getByLabel('Texte')
    .fill(
      [
        'Animatrice : Qu’avez-vous pensé de l’atelier ?',
        'Julie : J’ai trouvé les échanges riches, mais la salle était trop petite.',
        'Animatrice : Et la suite ?',
        'Marc : Il faudrait refaire un atelier au printemps.',
      ].join('\n'),
    )
  await page.getByRole('checkbox', { name: /Animatrice/ }).uncheck()
  await shot(page, '7-texte')
  await page.getByRole('button', { name: 'Importer', exact: true }).click()
  await expect(page.getByText(/2 participants/).first()).toBeVisible()
})

test('moteurs d’IA : catalogue visible, guide pas à pas, et retour à l’étude', async ({ page }) => {
  await newStudy(page, 'Étude moteur')
  const studyUrl = page.url()
  await page.getByLabel('Fichier à importer').setInputFiles('fixtures/mediatheque.csv')
  await page.getByRole('button', { name: /Importer les réponses à \d+ questions?/ }).click()
  await page.getByRole('tab', { name: /Analyse/ }).click()
  await page.getByRole('link', { name: 'Choisir un moteur' }).click()

  // Les fournisseurs sont visibles d'emblée, sans clic préalable.
  await expect(page.getByRole('heading', { name: "Moteurs d'IA" })).toBeVisible()
  for (const name of ['Mistral AI', 'Groq', 'Ollama']) await expect(page.getByText(name, { exact: true }).first()).toBeVisible()
  await expect(page.getByText(/Pas encore installé ou pas ouvert/)).toBeVisible()
  await noHorizontalScroll(page)
  await shot(page, '8-moteurs')

  // Le guide Groq mène directement à la page des clés.
  await page.getByRole('listitem').filter({ hasText: 'Groq' }).getByRole('button', { name: 'Configurer' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('link', { name: /Aller aux clés Groq/ })).toHaveAttribute('href', 'https://console.groq.com/keys')
  await dialog.getByLabel("Clé d'accès").fill('cle-de-test')
  await shot(page, '9-guide')
  // Le test échoue (fausse clé, pas de réseau) : on peut quand même enregistrer.
  await dialog.getByRole('button', { name: 'Enregistrer et tester' }).click()
  await dialog.getByRole('button', { name: 'Enregistrer quand même' }).click()
  // Non vérifié : enregistré, mais ni annoncé prêt ni choisi par défaut.
  await expect(page.getByText("N'a pas répondu au test", { exact: true })).toBeVisible()

  // Retour à l'étude en un clic.
  await page.getByRole('link', { name: 'Revenir à votre synthèse' }).first().click()
  expect(page.url()).toContain(studyUrl.split('#')[1].split('/').slice(0, 3).join('/'))
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Étude moteur')
  await page.goto('/#/moteurs')
  await expect(page.getByRole('heading', { name: 'Vos moteurs' })).toBeVisible()
  await expect(page.getByText(/Modèle : openai\/gpt-oss-120b/)).toBeVisible()
})

test('moteurs d’IA : le modèle se choisit dans une liste expliquée, le recommandé en tête', async ({ page }) => {
  await page.goto('/#/moteurs')
  await page.getByRole('listitem').filter({ hasText: 'Mistral AI' }).getByRole('button', { name: 'Configurer' }).click()
  const dialog = page.getByRole('dialog')
  const picker = dialog.getByRole('button', { name: 'Choisir le modèle' })
  await expect(picker).toContainText('Ministral 14B')
  await picker.click()
  // Ouvrir la liste n'envoie pas le formulaire (pas de test de connexion lancé).
  await expect(dialog.getByRole('button', { name: /Test en cours|Enregistrer quand même/ })).toHaveCount(0)
  await expect(dialog.getByRole('menuitemradio', { name: /Ministral 14B.*Recommandé/ })).toHaveAttribute('aria-checked', 'true')
  await expect(dialog.getByText('Avec le paiement à l’usage activé')).toBeVisible()
  await shot(page, '9b-modeles')
  await dialog.getByRole('menuitemradio', { name: /Ministral 8B/ }).click()
  await expect(picker).toContainText('Ministral 8B')
  // Un modèle absent de la liste se saisit librement.
  await picker.click()
  await dialog.getByRole('menuitemradio', { name: /Autre modèle/ }).click()
  await dialog.getByLabel('Nom du modèle').fill('mon-modele-2027')
  await expect(dialog.getByLabel('Nom du modèle')).toHaveValue('mon-modele-2027')
})

test('Ollama absent : l’erreur dit quoi faire', async ({ page }) => {
  await page.goto('/#/moteurs')
  await page.getByRole('listitem').filter({ hasText: 'Ollama' }).getByRole('button', { name: 'Configurer' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('link', { name: /Télécharger Ollama/ })).toBeVisible()
  await expect(dialog.getByText('ollama pull qwen3:8b')).toBeVisible()
  await dialog.getByRole('button', { name: 'Enregistrer et tester' }).click()
  await expect(dialog.getByText(/ne répond pas sur cet ordinateur/)).toBeVisible()
  await expect(dialog.getByText(/Suivez les étapes 1 et 2/)).toBeVisible()
})

test('étude : sauvegarder puis rouvrir avec son rapport', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Voir un exemple de rapport' }).click()
  await expect(page.getByRole('heading', { name: 'Résumé' })).toBeVisible()
  // Sur le rapport, la sauvegarde de l'étude est dans le menu « Exporter ».
  await page.getByRole('button', { name: /Exporter/ }).click()
  const [file] = await Promise.all([page.waitForEvent('download'), page.getByRole('menuitem', { name: /Sauvegarder la synthèse/ }).click()])
  const path = (await file.path())!

  await page.goto('/#/synthese')
  await page
    .getByLabel("Fichier de synthèse OpenScribe")
    .setInputFiles({ name: 'projet.openscribe.json', mimeType: 'application/json', buffer: readFileSync(path) })
  await expect(page.getByRole('heading', { name: 'Résumé' })).toBeVisible()
})

test('un double clic sur l’exemple ne crée qu’une seule étude', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Voir un exemple de rapport' }).dblclick()
  await expect(page.getByRole('heading', { name: 'Résumé' })).toBeVisible()
  await page.goto('/#/synthese')
  await page.getByRole('button', { name: /Application de médiathèque/ }).click()
  await expect(page.getByRole('heading', { name: 'Résumé' })).toBeVisible()
  expect(await projectCount(page)).toBe(1)
})

test('relancer une analyse ne fait jamais disparaître le rapport précédent', async ({ page }) => {
  await newStudy(page, 'Étude relance')
  await page.getByLabel('Fichier à importer').setInputFiles('fixtures/mediatheque.csv')
  await page.getByRole('button', { name: /Importer les réponses à \d+ questions?/ }).click()
  await page.getByRole('tab', { name: /Analyse/ }).click()
  await page.getByRole('button', { name: "Lancer l'analyse" }).click()
  await page.getByRole('button', { name: 'Voir le rapport' }).click()
  await expect(page.getByText('Rapport de démonstration')).toBeVisible()

  // Nouvelle analyse : pendant qu'elle tourne, l'ancien rapport reste consultable.
  await page.getByRole('tab', { name: /Analyse/ }).click()
  await expect(page.getByText('Le rapport actuel reste consultable')).toBeVisible()
  // Un réglage différent : sinon les réponses gardées en mémoire rendent la relance instantanée.
  await page.getByLabel('Ce que vous cherchez à comprendre').fill('Ce qui freine les usagers')
  await page.getByRole('button', { name: 'Relancer une analyse' }).click()
  await page.getByRole('tab', { name: /Rapport/ }).click()
  await expect(page.getByText('Une nouvelle analyse est en cours')).toBeVisible()
  await expect(page.getByRole('heading', { name: "Vue d'ensemble" })).toBeVisible()
})

test('un double clic sur « Créer » ne crée qu’une étude, nommée par sa date', async ({ page }) => {
  await page.goto('/#/synthese')
  await page.getByRole('button', { name: 'Nouvelle synthèse' }).click()
  await page.getByRole('button', { name: 'Créer' }).dblclick()
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Synthèse du')
  expect(await projectCount(page)).toBe(1)
})

test('un moteur qui n’a pas répondu au test n’est ni annoncé prêt ni choisi d’office', async ({ page }) => {
  await newStudy(page, 'Étude moteur muet')
  await page.getByLabel('Fichier à importer').setInputFiles('fixtures/mediatheque.csv')
  await page.getByRole('button', { name: /Importer les réponses à \d+ questions?/ }).click()
  await page.getByRole('tab', { name: /Analyse/ }).click()
  await page.getByRole('link', { name: 'Choisir un moteur' }).click()
  await page.getByRole('listitem').filter({ hasText: 'Ollama' }).getByRole('button', { name: 'Configurer' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('button', { name: 'Enregistrer et tester' }).click()
  await dialog.getByRole('button', { name: 'Enregistrer quand même' }).click()
  await expect(page.getByText("N'a pas répondu au test", { exact: true })).toBeVisible()
  await expect(page.getByText(/enregistré, mais il n'a pas répondu au test/)).toBeVisible()
  await expect(page.getByText('Votre moteur est prêt')).toHaveCount(0)
  await page.getByRole('link', { name: 'Revenir à votre synthèse' }).first().click()
  await expect(page.getByLabel("Moteur d'IA")).toHaveValue('simulation')
})

test('vos études : renommer, dupliquer et supprimer depuis le menu d’une étude', async ({ page }) => {
  await newStudy(page, 'Étude à ranger')
  await page.goto('/#/synthese')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Synthèse')
  await expect(page.getByRole('heading', { name: 'Vos synthèses' })).toBeVisible()

  await page.getByRole('button', { name: 'Actions sur Étude à ranger' }).click()
  await page.getByRole('menuitem', { name: 'Renommer' }).click()
  await page.getByLabel('Nouveau nom').fill('Étude rangée')
  await page.getByRole('button', { name: 'Renommer', exact: true }).click()
  await expect(page.getByRole('link', { name: /Étude rangée/ })).toBeVisible()

  await page.getByRole('button', { name: 'Actions sur Étude rangée' }).click()
  await page.getByRole('menuitem', { name: 'Dupliquer' }).click()
  await expect(page.getByRole('link', { name: /Étude rangée \(copie\)/ })).toBeVisible()

  await page.getByRole('button', { name: 'Actions sur Étude rangée (copie)' }).click()
  await page.getByRole('menuitem', { name: 'Supprimer' }).click()
  await page.getByRole('button', { name: 'Supprimer', exact: true }).click()
  await expect(page.getByRole('link', { name: /Étude rangée \(copie\)/ })).toHaveCount(0)
  await expect(page.getByRole('link', { name: /Étude rangée/ })).toBeVisible()
})
