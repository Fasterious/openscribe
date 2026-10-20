import { expect, test, type Locator, type Page } from '@playwright/test'
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

// Les parcours ne dépendent pas de la machine : Ollama est réputé absent, même s'il tourne ici.
test.beforeEach(async ({ page }) => {
  await page.route(/localhost:11434|127\.0\.0\.1:11434/, (route) => route.abort())
})

async function newStudy(page: Page, name: string) {
  await page.goto('/#/synthese')
  await page.getByRole('button', { name: 'Nouvelle synthèse' }).click()
  await page.getByLabel("Nom de la synthèse").fill(name)
  await page.getByRole('button', { name: 'Créer' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toContainText(name)
}

test('accueil : la promesse, la preuve dépliable, les sections de réassurance', async ({ page }, testInfo) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Des verbatims au rapport')
  // La preuve : un constat de l'exemple dont on déplie les verbatims.
  // (La même pastille que dans le rapport : « ● 3 », les verbatims de 3 participants.)
  await page.getByRole('button', { name: 'Voir les verbatims de 3 participants : avis négatifs' }).click()
  await expect(page.getByText('surtout sur mon vieux téléphone.').first()).toBeVisible()
  for (const h of ['Comment ça marche', 'Un outil par étape de votre recherche', 'Vos données, vos règles', 'Questions fréquentes', 'Ce qui arrive'])
    await expect(page.getByRole('heading', { name: h })).toBeVisible()
  // Pas encore de travail en cours : pas de bandeau « Reprendre ».
  await expect(page.getByText('Reprendre là où vous en étiez')).toHaveCount(0)
  await noHorizontalScroll(page)
  await shot(page, '1-accueil')

  // Un clic sur une étude de l'Observatoire l'ouvre dans l'application, avec le même menu que partout.
  const tap = async (l: Locator) => (testInfo.project.name === 'mobile' ? l.tap() : l.click())
  await page.getByRole('link', { name: /L'école vue par les familles/ }).click()
  await expect(page).toHaveURL(/#\/observatoire\/ecole-grand-debat-2019$/)
  await expect(page.getByRole('heading', { name: 'Résumé' })).toBeVisible()
  // Un seul résumé, et les chiffres dans la ligne grise de l'en-tête.
  await expect(page.getByRole('heading', { name: 'En bref' })).toHaveCount(0)
  await expect(page.getByText(/Publiée le .* participants sur .* tirés au sort .* idées/)).toBeVisible()
  // L'écart entre les réponses tirées au sort et les participants comptés s'explique au toucher comme au survol.
  await page.getByRole('button', { name: /participants sur .* tirés au sort/ }).click()
  await expect(page.getByRole('tooltip')).toContainText('aucune idée sur la question')
  await page.keyboard.press('Escape')
  await expect(page).toHaveTitle(/L'Observatoire OpenScribe/)
  await noHorizontalScroll(page)
  // Une ligne des listes : sa phrase, et ❝ N déroule les verbatims des N participants comptés.
  const line = page.locator('#saillants').locator('..').getByRole('button', { name: /Voir les verbatims de \d+ participants?/ }).first()
  await tap(line)
  await expect(page.locator('#saillants').locator('..').getByRole('button', { name: /^«/ }).first()).toBeVisible()
  // Dans le résumé, une pastille qui suit un nombre déroule tout le camp compté.
  await expect(page.locator('section[aria-labelledby="resume"]').getByRole('button', { name: /les verbatims de \d+ participants/ }).first()).toBeVisible()
  // Depuis une liste, on va lire le motif en détail, puis on revient à la ligne de départ.
  const go = page.getByRole('button', { name: 'Lire le thème en détail →' }).first()
  await tap(go)
  // Le motif est ouvert, à l'écran, et son titre a le focus (passe testeur du 18/10 : la page ne bougeait pas).
  const arrived = page.locator('details[data-fold="motif"][open] > summary').first()
  await expect(arrived).toBeFocused()
  // Un saut court défile en douceur : la position se vérifie une fois le défilement fini.
  await expect.poll(async () => (await arrived.boundingBox())!.y).toBeGreaterThanOrEqual(0)
  await expect.poll(async () => (await arrived.boundingBox())!.y).toBeLessThan(page.viewportSize()!.height / 2)
  // Il arrive juste sous son grand thème, resté visible : on sait où l'on est (passe testeur du 18/10 : grand thème effacé, trou au-dessus).
  const gap = () =>
    arrived.evaluate((el) => {
      const head = el.parentElement?.parentElement?.closest('details[data-fold="theme"]')?.querySelector(':scope > summary')
      return head ? Math.round(el.getBoundingClientRect().top - head.getBoundingClientRect().bottom) : 0
    })
  await expect.poll(async () => Math.abs(await gap())).toBeLessThanOrEqual(2)
  const backTo = page.getByRole('button', { name: /← Revenir à « Ce qui a marché »/ })
  await tap(backTo)
  await expect(backTo).toHaveCount(0)
  expect(await go.evaluate((el) => el === document.activeElement)).toBe(true)
  await page.locator('details[data-fold="motif"][open] > summary').first().click()
  await page.locator('details[data-fold="theme"][open] > summary').first().click()
  // Un motif, dans son thème : sa définition pliée, un verbatim qui se replace dans sa réponse.
  const theme = page.locator('details[data-fold="theme"]').first()
  await tap(theme.locator(':scope > summary'))
  const motif = theme.locator('details[data-fold="motif"]').first()
  await tap(motif.locator(':scope > summary'))
  await expect(motif.getByText('Ce qui compte comme positif ou négatif dans ce thème')).toBeVisible()
  await tap(motif.getByRole('button', { name: /^«/ }).first())
  await expect(motif.locator('mark').first()).toBeVisible()
  // Ce que l'article d'une page avait en plus est dans l'application : la méthode détaillée, et l'impression.
  await expect(page.getByText(/^Renvois vérifiés/)).toBeAttached()
  await expect(page.getByRole('button', { name: 'Imprimer ou enregistrer en PDF' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Lire en une page' })).toHaveCount(0)
  // La liste des études est dans l'application ; le menu ramène partout.
  await page.getByRole('link', { name: "Toutes les études de l'Observatoire" }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText("L'Observatoire")
  await page.getByRole('navigation', { name: 'Modules' }).getByRole('link', { name: 'Accueil', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Des verbatims au rapport')
  await page.getByRole('navigation', { name: 'Modules' }).getByRole('link', { name: 'Observatoire' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText("L'Observatoire")
  // L'ancienne adresse de l'article ouvre l'étude dans l'application.
  await page.goto('/observatoire/ecole-grand-debat-2019/')
  await expect(page).toHaveURL(/#\/observatoire\/ecole-grand-debat-2019$/)
  await expect(page.getByRole('heading', { name: 'Résumé' })).toBeVisible()
  await page.getByRole('navigation', { name: 'Modules' }).getByRole('link', { name: 'Synthèse' }).click()
  await expect(page.getByRole('heading', { name: 'Vos synthèses' })).toBeVisible()
  await page.goto('/')

  // Le module Synthèse est cliquable et mène à son espace.
  await page.getByRole('link', { name: /Ouvrir l'espace Synthèse/ }).click()
  await expect(page.getByRole('heading', { name: 'Vos synthèses' })).toBeVisible()
})

test('exemple : de l’accueil au rapport, verbatims dépliés sur place et exports', async ({ page }, testInfo) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Voir un exemple de rapport' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toContainText('médiathèque')
  await expect(page.getByRole('heading', { name: 'Résumé' })).toBeVisible()
  await expect(page.getByText("Rapport d'exemple")).toBeVisible()
  await expect(page.getByText('À vérifier', { exact: true })).toHaveCount(0)
  // Le second niveau existe : des thèmes rapprochent les motifs, dans « Le détail, thème par thème ».
  await expect(page.getByRole('heading', { name: 'Le détail, par grand thème' })).toBeVisible()
  expect(await page.locator('details[data-fold="theme"]').count()).toBeGreaterThan(1)
  await noHorizontalScroll(page)
  await shot(page, '3-rapport')

  // La ligne fermée d'un thème, puis d'un motif, est une seule cible : la toucher l'ouvre (au doigt aussi, sur l'étiquette).
  const tap = async (l: Locator) => (testInfo.project.name === 'mobile' ? l.tap() : l.click())
  const theme = page.locator('details[data-fold="theme"]').first()
  await tap(theme.locator(':scope > summary'))
  await expect(theme).toHaveAttribute('open', '')
  const motif = theme.locator('details[data-fold="motif"]').first()
  await tap(motif.locator(':scope > summary').getByText(/unanime|majorité|Avis partagés|Peu d'avis/i).first())
  await expect(motif).toHaveAttribute('open', '')
  // L'étiquette s'explique dans le motif ouvert, plus dans une infobulle.
  await motif.getByText('Que veut dire cette étiquette ?').click()
  await expect(motif.getByText(/donnent un avis/).first()).toBeVisible()
  // Replier depuis l'en-tête du motif rend le focus à son titre.
  await motif.locator(':scope > summary').click()
  await expect(motif).not.toHaveAttribute('open', '')
  expect(await motif.locator(':scope > summary').evaluate((el) => el === document.activeElement)).toBe(true)

  // Une référence de la synthèse déplie ses verbatims juste en dessous, sans fenêtre.
  // (Une pastille par camp : un point à la couleur du camp et le nombre de personnes.)
  await motif.locator(':scope > summary').click()
  await motif
    .getByRole('button', { name: /^Voir les verbatims de \d+ participants? : / })
    .first()
    .click()
  await expect(motif.getByRole('button', { name: /^Masquer les verbatims de \d+ participants? : / })).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  // Une ligne par participant ; un verbatim se replace dans sa réponse, le passage cité en gras.
  await page.locator('article').getByRole('button', { name: /^«/ }).first().click()
  await expect(page.locator('article mark').first()).toBeVisible()
  await shot(page, '4-verbatims')

  // Export Markdown.
  await page.getByRole('button', { name: /Exporter/ }).click()
  const [md] = await Promise.all([page.waitForEvent('download'), page.getByRole('menuitem', { name: /Markdown/ }).click()])
  const text = readFileSync((await md.path())!, 'utf8')
  expect(text).toContain('## Résumé')
  expect(text).toContain('Méthode')

  // À l'impression, tous les groupes sont dépliés, et chaque camp (même fermé à l'écran) montre ses verbatims.
  await page.emulateMedia({ media: 'print' })
  await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')))
  expect(await page.locator('article details:not([open])').count()).toBe(0)
  const hiddenOnPaper = await page.locator('article [data-print-open]').evaluateAll((els) => els.filter((e) => getComputedStyle(e).display === 'none').length)
  expect(hiddenOnPaper).toBe(0)
})

test('replier des verbatims ramène le lecteur là où il les avait dépliés', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Voir un exemple de rapport' }).click()
  // Une pastille du rapport (l'accueil en a une aussi : on attend d'être dans le résumé).
  const pill = page.locator('section[aria-labelledby="resume"]').getByRole('button', { name: /^Voir les verbatims de \d+ participants? : / }).first()
  await pill.scrollIntoViewIfNeeded()
  const before = (await pill.boundingBox())!.y
  await pill.click()
  const opened = page.getByRole('button', { name: /^Masquer les verbatims de \d+ participants? : / }).first()
  // Le lecteur parcourt les verbatims plus bas, puis replie.
  await page.mouse.wheel(0, 400)
  await page.waitForTimeout(200)
  await page.getByRole('button', { name: 'Replier', exact: true }).first().click()
  await expect(opened).toHaveCount(0)
  const after = (await pill.boundingBox())!.y
  expect(Math.abs(after - before)).toBeLessThan(4)
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
  for (const name of ['Mistral AI', 'Google Gemini', 'Groq', 'Ollama']) await expect(page.getByText(name, { exact: true }).first()).toBeVisible()
  // Seuil de qualité : Gemini est vérifié ; Mistral et Ollama restent visibles, à l'étude, avec la raison, et ne se configurent pas.
  const card = (name: string) => page.getByRole('listitem').filter({ hasText: name })
  await expect(card('Google Gemini')).toContainText('Qualité vérifiée')
  await expect(card('Mistral AI')).toContainText("À l'étude")
  await expect(card('Mistral AI')).toContainText('sous le niveau')
  await expect(card('Mistral AI').getByRole('button', { name: /à l'étude/ })).toBeDisabled()
  await expect(card('Ollama').first()).toContainText('24 Go')
  await noHorizontalScroll(page)
  await shot(page, '8-moteurs')

  // Le guide Gemini mène directement à la page des clés.
  await card('Google Gemini').getByRole('button', { name: 'Configurer' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('link', { name: /Ouvrir Google AI Studio/ })).toHaveAttribute('href', 'https://aistudio.google.com/api-keys')
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
  await expect(page.getByText(/Modèle : gemini-3.5-flash-lite/)).toBeVisible()
})

test('moteurs d’IA : le modèle se choisit dans une liste expliquée, le recommandé en tête', async ({ page }) => {
  await page.goto('/#/moteurs')
  await page.getByRole('listitem').filter({ hasText: 'Google Gemini' }).getByRole('button', { name: 'Configurer' }).click()
  const dialog = page.getByRole('dialog')
  const picker = dialog.getByRole('button', { name: 'Choisir le modèle' })
  await expect(picker).toContainText('Gemini 3.5 Flash-Lite')
  await picker.click()
  // Ouvrir la liste n'envoie pas le formulaire (pas de test de connexion lancé).
  await expect(dialog.getByRole('button', { name: /Test en cours|Enregistrer quand même/ })).toHaveCount(0)
  await expect(dialog.getByRole('menuitemradio', { name: /Gemini 3.5 Flash-Lite.*Recommandé/ })).toHaveAttribute('aria-checked', 'true')
  await expect(dialog.getByText('Avec la facturation activée')).toBeVisible()
  // Un modèle pas encore évalué est visible, avec la raison, mais ne se choisit pas.
  await expect(dialog.getByRole('menuitemradio', { name: /Gemini 3.8 Flash.*À l'étude/ })).toBeDisabled()
  await shot(page, '9b-modeles')
  // Un modèle absent de la liste se saisit librement.
  await dialog.getByRole('menuitemradio', { name: /Autre modèle/ }).click()
  await dialog.getByLabel('Nom du modèle').fill('mon-modele-2027')
  await expect(dialog.getByLabel('Nom du modèle')).toHaveValue('mon-modele-2027')
})

test('qui fait quoi : le moteur en ligne est annoncé, et le mode Confidentiel ne s’affiche pas sans moteur local', async ({ page }) => {
  // Un moteur en ligne, enregistré sans test réussi (pas de réseau ici).
  await page.goto('/#/moteurs')
  await page.getByRole('listitem').filter({ hasText: 'Google Gemini' }).getByRole('button', { name: 'Configurer' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel("Clé d'accès").fill('cle-de-test')
  await dialog.getByRole('button', { name: 'Enregistrer et tester' }).click()
  await dialog.getByRole('button', { name: 'Enregistrer quand même' }).click()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('heading', { name: "Moteur d'IA par tâche" })).toBeVisible()
  await expect(page.getByText('En ligne').first()).toBeVisible()
  await expect(page.getByRole('checkbox', { name: /Confidentiel/ })).toHaveCount(0)

  await newStudy(page, 'Étude en ligne')
  await page.getByLabel('Fichier à importer').setInputFiles('fixtures/mediatheque.csv')
  await page.getByRole('button', { name: /Importer les réponses à \d+ questions?/ }).click()
  await page.getByRole('tab', { name: /Analyse/ }).click()
  await page.getByLabel("Moteur d'IA pour analyser et rédiger").selectOption({ label: 'Google Gemini · gemini-3.5-flash-lite' })
  await expect(page.getByText(/En ligne · les réponses des participants sont envoyées à Google Gemini/)).toBeVisible()
  await expect(page.getByRole('checkbox', { name: /Confidentiel/ })).toHaveCount(0)
  await noHorizontalScroll(page)
  await shot(page, '10-en-ligne')
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
  await expect(page.getByRole('heading', { name: /Le détail, (par grand thème|thème par thème)/ })).toBeVisible()
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
  await page.getByRole('listitem').filter({ hasText: 'Google Gemini' }).getByRole('button', { name: 'Configurer' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel("Clé d'accès").fill('cle-de-test')
  await dialog.getByRole('button', { name: 'Enregistrer et tester' }).click()
  await dialog.getByRole('button', { name: 'Enregistrer quand même' }).click()
  await expect(page.getByText("N'a pas répondu au test", { exact: true })).toBeVisible()
  await expect(page.getByText(/enregistré, mais il n'a pas répondu au test/)).toBeVisible()
  await expect(page.getByText('Votre moteur est prêt')).toHaveCount(0)
  await page.getByRole('link', { name: 'Revenir à votre synthèse' }).first().click()
  await expect(page.getByLabel("Moteur d'IA pour analyser et rédiger")).toHaveValue('simulation')
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
  // La fenêtre fermée d'abord : tant qu'elle est ouverte, la liste derrière est cachée aux lecteurs d'écran (compte nul trompeur).
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByRole('link', { name: /Étude rangée \(copie\)/ })).toHaveCount(0)
  await expect(page.getByRole('link', { name: /Étude rangée/ })).toBeVisible()
})

test('menu : sur un petit téléphone, aucun lien du menu n’en recouvre un autre', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile')
  for (const width of [360, 390]) {
    await page.setViewportSize({ width, height: 800 })
    await page.goto('/')
    const modules = (await page.getByRole('navigation', { name: 'Modules' }).boundingBox())!
    const settings = (await page.getByRole('navigation', { name: 'Réglages' }).boundingBox())!
    expect(modules.x + modules.width).toBeLessThanOrEqual(settings.x)
    await expect(page.getByRole('navigation', { name: 'Modules' }).getByRole('link', { name: 'Observatoire' })).toBeVisible()
    await noHorizontalScroll(page)
  }
})

test('lire un grand thème : il reste collé, s’efface quand on lit un thème ouvert, revient quand on remonte ; la barre suit l’en-tête', async ({ page }) => {
  await page.goto('/#/observatoire/ecole-grand-debat-2019')
  const theme = page.locator('details[data-fold="theme"]').nth(1)
  const themeHead = theme.locator(':scope > summary')
  await themeHead.scrollIntoViewIfNeeded()
  await themeHead.click()
  await expect(theme).toHaveAttribute('open', '')
  // La barre du grand thème reste dans son en-tête ouvert (Arnaud, 18/10) ; sur un écran large, le compte des thèmes aussi.
  await expect(themeHead.locator('[data-bar]')).toBeVisible()
  // L'en-tête collé est la ligne fermée elle-même : titre, barre, et la ligne des verdicts dessous (Arnaud, 18/10).
  await expect(themeHead).toContainText(/\d+ thèmes\u00a0:/)
  // Plus de « Replier » en bas du bloc : celui de l'en-tête collé suffit.
  await expect(theme.getByRole('button', { name: /^Replier/ })).toHaveCount(0)
  const top = (l: Locator) => l.evaluate((el) => Math.round(el.getBoundingClientRect().top))
  const scroll = async (dy: number) => {
    for (let i = 0; i < 4; i++) {
      await page.evaluate((d) => window.scrollBy(0, d / 4), dy)
      await page.waitForTimeout(60)
    }
  }
  const barBottom = () => page.locator('body header').evaluate((el) => Math.max(0, Math.round(el.getBoundingClientRect().bottom)))
  // Dans le grand thème, thèmes fermés : on descend, son en-tête reste collé sous la barre de l'application (cachée ou non).
  await scroll(500)
  await expect.poll(async () => Math.abs((await top(themeHead)) - (await barBottom()))).toBeLessThanOrEqual(2)
  // Un thème ouvert, et on le lit en descendant : le grand thème s'efface, le thème prend le haut de l'écran.
  const motif = theme.locator('details[data-fold="motif"]').first()
  const motifHead = motif.locator(':scope > summary')
  await motifHead.click()
  await expect(motif).toHaveAttribute('open', '')
  await expect(motifHead.locator('[data-bar]')).toBeVisible()
  await scroll(600)
  await expect.poll(() => top(themeHead)).toBeLessThan(0)
  await expect.poll(() => top(motifHead)).toBeLessThanOrEqual(2)
  // On remonte : le grand thème redescend au rythme du défilement, pixel pour pixel (il ne réapparaît pas d'un coup),
  // puis la barre de l'application (Arnaud, 19/10 : les en-têtes se poussent comme des objets).
  const themeHeight = () => themeHead.evaluate((el) => Math.round(el.getBoundingClientRect().height))
  const pushed = await top(themeHead)
  await scroll(-40)
  await expect.poll(async () => Math.abs((await top(themeHead)) - Math.min(0, pushed + 40))).toBeLessThanOrEqual(3)
  await scroll(-(await themeHeight()) - 80)
  await expect.poll(() => top(themeHead)).toBeGreaterThanOrEqual(50)
  // Le thème se range juste sous l'en-tête du grand thème, qui est sa ligne entière (titre, barre, verdicts).
  await expect.poll(async () => (await top(motifHead)) - (await top(themeHead)) - (await themeHeight())).toBe(0)
  // Replier le thème rend la place au grand thème, et le titre replié reste sous lui.
  await motifHead.click()
  await expect(motif).not.toHaveAttribute('open', '')
  await expect(motifHead).toBeFocused()
  await expect.poll(async () => (await top(motifHead)) - (await top(themeHead)) - (await themeHeight())).toBeGreaterThanOrEqual(-1)
  // Le rouvrir aussitôt le laisse sur place : la page ne saute pas au bloc suivant (passe testeur du 18/10, +1197 px).
  // Un clic à l'endroit du titre, comme un lecteur (le clic de Playwright recentrerait la page d'abord).
  const clickAt = async (l: Locator) => {
    const b = (await l.boundingBox())!
    await page.mouse.click(b.x + 40, b.y + b.height / 2)
  }
  const before = await top(motifHead)
  await clickAt(motifHead)
  await expect(motif).toHaveAttribute('open', '')
  await page.waitForTimeout(500)
  expect(Math.abs((await top(motifHead)) - before)).toBeLessThanOrEqual(2)
  // Pareil pour le grand thème, replié d'en bas puis rouvert.
  // (On remonte un peu pour que le grand thème, effacé pendant la lecture du thème, revienne.)
  await scroll(400)
  await scroll(-(await themeHeight()) - 40)
  await expect.poll(() => top(themeHead)).toBeGreaterThanOrEqual(0)
  await clickAt(themeHead)
  await expect(theme).not.toHaveAttribute('open', '')
  await page.waitForTimeout(500)
  const themeBefore = await top(themeHead)
  // Au clavier : Entrée sur le titre replié (il a le focus) le rouvre sur place.
  await expect(themeHead).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(theme).toHaveAttribute('open', '')
  await page.waitForTimeout(500)
  expect(Math.abs((await top(themeHead)) - themeBefore)).toBeLessThanOrEqual(2)
})

test('résumé : la pastille « ● N », le volet replié revient à elle ; « À vérifier » s’explique juste dessous ; défiler vite ne décroche rien', async ({ page }) => {
  await page.goto('/#/observatoire/ecole-grand-debat-2019')
  const resume = page.locator('section[aria-labelledby="resume"]')
  const chip = resume.getByRole('button', { name: /^Voir les verbatims de \d+ participants? : / }).first()
  await chip.scrollIntoViewIfNeeded()
  await page.waitForTimeout(300)
  const at = () => chip.evaluate((el) => Math.round(el.getBoundingClientRect().top))
  const before = await at()
  const b = (await chip.boundingBox())!
  await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2)
  // L'intitulé du volet reprend le point du camp, pas un guillemet.
  const head = resume.getByRole('button', { name: 'Replier', exact: true }).first()
  await expect(head).toBeVisible()
  await expect(head.locator('xpath=..').locator('span.rounded-full').first()).toBeVisible()
  // On lit plus bas, puis on replie depuis l'en-tête collé : la pastille revient où elle était, avec le focus et un contour.
  await page.evaluate(() => window.scrollBy(0, 700))
  await page.waitForTimeout(300)
  const hb = (await head.boundingBox())!
  await page.mouse.click(hb.x + hb.width / 2, hb.y + hb.height / 2)
  await expect(resume.getByRole('button', { name: /^Masquer les verbatims/ })).toHaveCount(0)
  await expect.poll(async () => Math.abs((await at()) - before)).toBeLessThanOrEqual(4)
  await expect(chip).toBeFocused()
  await expect(chip).toHaveClass(/chip-seen/)

  // « À vérifier » dans une liste : enfoncé une fois ouvert, son explication juste dessous, avant « Lire le thème en détail ».
  const doubt = page.locator('li').getByRole('button', { name: /^À vérifier/ }).first()
  if (await doubt.count()) {
    await doubt.scrollIntoViewIfNeeded()
    await doubt.click()
    await expect(doubt).toHaveAttribute('aria-expanded', 'true')
    const li = doubt.locator('xpath=ancestor::li[1]')
    const why = li.getByText('Pourquoi cette étiquette ?')
    await expect(why).toBeVisible()
    const gap = (await why.boundingBox())!.y - ((await doubt.boundingBox())!.y + (await doubt.boundingBox())!.height)
    expect(gap).toBeLessThan(40)
    expect((await why.boundingBox())!.y).toBeLessThan((await li.getByRole('button', { name: 'Lire le thème en détail →' }).boundingBox())!.y)
    // Les verbatims en cause, par camp : « ● N avis … ».
    await expect(li.getByRole('button', { name: /^Voir les verbatims de \d+ participants? : / }).first()).toBeVisible()
    await doubt.click()
    // Refermée : le volet se replie (sa hauteur tombe à 0) et sort du parcours clavier.
    await expect(doubt).toHaveAttribute('aria-expanded', 'false')
    const panel = li.locator(`[id="${await doubt.getAttribute('aria-controls')}"]`)
    await expect(panel).toHaveAttribute('inert', '')
    await expect.poll(() => panel.evaluate((el) => Math.round(el.getBoundingClientRect().height))).toBe(0)
  }

  // Défiler vite dans un grand thème ouvert : son en-tête reste collé contre la barre, sans interstice.
  const theme = page.locator('details[data-fold="theme"]').nth(1)
  const th = theme.locator(':scope > summary')
  await th.scrollIntoViewIfNeeded()
  const tb = (await th.boundingBox())!
  await page.mouse.click(tb.x + 30, tb.y + 12)
  await expect(theme).toHaveAttribute('open', '')
  await page.evaluate(() => window.scrollBy(0, 300))
  for (const dy of [400, -250, 500, -300, 350, -120]) {
    await page.evaluate((d) => window.scrollBy(0, d), dy)
    const gap = await page.evaluate(
      () =>
        new Promise<number>((res) =>
          requestAnimationFrame(() => {
            const bar = Math.max(0, document.querySelector('body header')!.getBoundingClientRect().bottom)
            const t = document.querySelector('details[data-fold="theme"][open] > summary')!.getBoundingClientRect().top
            res(Math.round(t - bar))
          }),
        ),
    )
    // Le grand thème touche la barre (ou passe dessous pendant qu'elle se cache), jamais plus bas : aucun texte visible entre les deux.
    expect(gap).toBeLessThanOrEqual(1)
  }
})

test('replier un thème lu depuis son en-tête collé : sa ligne reste visible sous le grand thème, la barre ne revient pas la couvrir', async ({ page }) => {
  await page.goto('/#/observatoire/ecole-grand-debat-2019')
  const go = page.getByRole('button', { name: 'Lire le thème en détail →' }).first()
  await go.scrollIntoViewIfNeeded()
  const g = (await go.boundingBox())!
  await page.mouse.click(g.x + 20, g.y + g.height / 2)
  const opened = page.locator('details[data-fold="motif"][open]').first()
  await expect(opened).toBeVisible()
  const motif = page.locator(`[id="${await opened.getAttribute('id')}"]`)
  const head = motif.locator(':scope > summary')
  await expect(head).toBeFocused()
  // On lit le thème : barre et grand thème sont poussés, le thème est en haut.
  for (let i = 0; i < 8; i++) {
    await page.mouse.wheel(0, 50)
    await page.waitForTimeout(40)
  }
  await page.waitForTimeout(300)
  // Un processeur lent (téléphone modeste) : la transition de repli dure plus longtemps que le gel du défilement.
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 })
  const h = (await head.boundingBox())!
  await page.mouse.click(h.x + 30, h.y + h.height / 2)
  await expect(motif).not.toHaveAttribute('open', '')
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 })
  // Longtemps après (la transition de repli peut tarder) : la ligne repliée est toujours dégagée, sous le grand thème.
  await page.waitForTimeout(1500)
  const gap = await head.evaluate((el) => {
    const theme = el.parentElement!.parentElement!.closest('details[data-fold="theme"]')!.querySelector(':scope > summary')!
    const bar = document.querySelector('body header')!.getBoundingClientRect().bottom
    return Math.round(el.getBoundingClientRect().top - Math.max(theme.getBoundingClientRect().bottom, bar))
  })
  expect(gap).toBeGreaterThanOrEqual(-1)
  await expect(head).toBeFocused()
})
