import { expect, test, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'

const shot = (page: Page, name: string) =>
  page.screenshot({ path: `e2e/screenshots/${test.info().project.name}-${name}.png`, fullPage: true })

/** Aucune page ne doit défiler horizontalement (mobile surtout). */
async function noHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow, 'défilement horizontal').toBeLessThanOrEqual(1)
}

test('exemple : de l’accueil au rapport enregistré, citations et exports', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Comprendre ce que les gens disent')
  await noHorizontalScroll(page)
  await shot(page, '1-accueil')

  await page.getByRole('button', { name: 'Essayer avec un exemple' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toContainText('médiathèque')
  await expect(page.getByRole('heading', { name: 'Résumé' })).toBeVisible()
  await expect(page.getByText('Exemple enregistré')).toBeVisible()
  await expect(page.getByText('À vérifier')).toHaveCount(0)
  await noHorizontalScroll(page)
  await shot(page, '3-rapport')

  // On ouvre un groupe : sa synthèse cite ses sources, qui ouvrent les phrases exactes dans leur contexte.
  await page.locator('article details summary').first().click()
  await page.getByRole('button', { name: /Voir \d+ citation/ }).first().click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.locator('mark').first()).toBeVisible()
  await shot(page, '4-citations')
  await page.keyboard.press('Escape')

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

test('nouvelle étude : import CSV avec choix des colonnes', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Nouvelle étude' }).click()
  await page.getByLabel("Nom de l'étude").fill('Étude test CSV')
  await page.getByRole('button', { name: 'Créer' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Étude test CSV')

  await page.getByLabel('Fichier à importer').setInputFiles('fixtures/mediatheque.csv')
  await expect(page.getByRole('button', { name: /Importer \d+ questions?/ })).toBeVisible()
  await noHorizontalScroll(page)
  await shot(page, '5-colonnes')
  await page.getByRole('button', { name: /Importer \d+ questions?/ }).click()
  await expect(page.getByText('Vos données', { exact: true }).first()).toBeVisible()
  await expect(page.getByText(/12 personnes/).first()).toBeVisible()
  await shot(page, '6-donnees')

  // Sans moteur configuré, l'analyse se lance avec la simulation, clairement signalée.
  await page.getByRole('tab', { name: /Analyse/ }).click()
  await expect(page.getByText('La simulation fonctionne')).toBeVisible()
  await shot(page, '2-analyse')
  await page.getByRole('button', { name: "Lancer l'analyse" }).click()
  await page.getByRole('button', { name: 'Voir le rapport' }).click()
  await expect(page.getByText('Rapport de démonstration')).toBeVisible()
})

test('import de texte : l’animateur est exclu, sa question devient le contexte', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Nouvelle étude' }).click()
  await page.getByLabel("Nom de l'étude").fill('Entretiens')
  await page.getByRole('button', { name: 'Créer' }).click()
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
  await expect(page.getByText(/2 personnes/).first()).toBeVisible()
})

test('moteurs d’IA : ajouter un fournisseur avec sa clé', async ({ page }) => {
  await page.goto('/#/reglages')
  await expect(page.getByRole('heading', { name: "Moteurs d'IA" })).toBeVisible()
  await page.getByRole('button', { name: 'Ajouter un moteur' }).click()
  await page.getByRole('dialog').getByRole('button', { name: /Groq/ }).click()
  await page.getByLabel("Clé d'accès").fill('cle-de-test')
  await noHorizontalScroll(page)
  await shot(page, '8-moteur')
  await page.getByRole('button', { name: 'Enregistrer' }).click()
  await expect(page.getByText('Par défaut')).toBeVisible()
  await page.reload()
  await expect(page.getByText(/Groq/).first()).toBeVisible()
})

test('projet : exporter puis rouvrir avec son rapport', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Essayer avec un exemple' }).click()
  await expect(page.getByRole('heading', { name: 'Résumé' })).toBeVisible()
  const [file] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: "Exporter l'étude" }).click()])
  const path = (await file.path())!

  await page.goto('/#/')
  await page.getByLabel("Fichier d'étude OpenScribe").setInputFiles({ name: 'projet.openscribe.json', mimeType: 'application/json', buffer: readFileSync(path) })
  await expect(page.getByRole('heading', { name: 'Résumé' })).toBeVisible()
})

test('un double clic sur l’exemple ne crée qu’une seule étude', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Essayer avec un exemple' }).dblclick()
  await expect(page.getByRole('heading', { name: 'Résumé' })).toBeVisible()
  await page.goto('/#/')
  await page.getByRole('button', { name: 'Essayer avec un exemple' }).click()
  await page.goto('/#/')
  await expect(page.getByRole('link', { name: /Exemple — application de médiathèque/ })).toHaveCount(1)
})
