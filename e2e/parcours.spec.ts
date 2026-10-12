import { expect, test, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'

const shot = (page: Page, name: string) =>
  page.screenshot({ path: `e2e/screenshots/${test.info().project.name}-${name}.png`, fullPage: true })

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
  await page.getByLabel("Nom de l'étude").fill(name)
  await page.getByRole('button', { name: 'Créer' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toContainText(name)
}

test('accueil : la promesse, la preuve dépliable, les sections de réassurance', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Des verbatims au rapport')
  // La preuve : un constat de l'exemple dont on déplie les verbatims.
  await page.getByRole('button', { name: 'Voir les 3 verbatims' }).click()
  await expect(page.getByText('surtout sur mon vieux téléphone.').first()).toBeVisible()
  for (const h of ['Comment ça marche', 'De A à Z, un outil à la fois', 'Vos données, vos règles', 'Questions fréquentes', 'Ce qui arrive'])
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
  await expect(page.getByText('Exemple enregistré')).toBeVisible()
  await expect(page.getByText('À vérifier')).toHaveCount(0)
  // Le second niveau existe : des thèmes rapprochent les groupes.
  expect(await page.locator('section h2').count()).toBeGreaterThan(3)
  await noHorizontalScroll(page)
  await shot(page, '3-rapport')

  // Une référence de la synthèse déplie ses verbatims juste en dessous, sans fenêtre.
  await page.getByRole('button', { name: /Voir \d+ verbatims?/ }).first().click()
  await expect(page.getByRole('button', { name: /Masquer \d+ verbatims?/ })).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.locator('article mark').first()).toBeVisible()
  await shot(page, '4-verbatims')

  // Export Markdown.
  const [md] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Markdown' }).click()])
  const text = readFileSync((await md.path())!, 'utf8')
  expect(text).toContain('## Résumé')
  expect(text).toContain('Méthode')

  // À l'impression, tous les groupes sont dépliés.
  await page.emulateMedia({ media: 'print' })
  await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')))
  expect(await page.locator('article details:not([open])').count()).toBe(0)
})

test('nouvelle synthèse : import CSV, puis l’utilisateur qui revient retrouve son étude', async ({ page }) => {
  await newStudy(page, 'Étude test CSV')
  await page.getByLabel('Fichier à importer').setInputFiles('fixtures/mediatheque.csv')
  await expect(page.getByRole('button', { name: /Importer \d+ questions?/ })).toBeVisible()
  await noHorizontalScroll(page)
  await shot(page, '5-colonnes')
  await page.getByRole('button', { name: /Importer \d+ questions?/ }).click()
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
  await page.getByRole('link', { name: "Ouvrir l'étude" }).click()
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Étude test CSV')
})

test('import de texte : l’animateur est exclu, sa question devient le contexte', async ({ page }) => {
  await newStudy(page, 'Entretiens')
  await page.getByRole('button', { name: 'Coller du texte' }).click()
  await page.getByLabel('Texte').fill(
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
  await page.getByRole('button', { name: /Importer \d+ questions?/ }).click()
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
  await expect(page.getByText('Utilisé par défaut')).toBeVisible()

  // Retour à l'étude en un clic.
  await page.getByRole('link', { name: 'Revenir à votre étude' }).first().click()
  expect(page.url()).toContain(studyUrl.split('#')[1].split('/').slice(0, 3).join('/'))
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Étude moteur')
  await page.reload()
  await expect(page.getByRole('navigation').getByText('Groq')).toBeVisible()
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
  const [file] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: "Sauvegarder l'étude" }).click()])
  const path = (await file.path())!

  await page.goto('/#/synthese')
  await page.getByLabel("Fichier d'étude OpenScribe").setInputFiles({ name: 'projet.openscribe.json', mimeType: 'application/json', buffer: readFileSync(path) })
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
