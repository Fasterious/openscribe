#!/usr/bin/env node
/**
 * Capture pleine page — style GoFullPage (scroll + bandes sans duplication).
 *
 * Algorithme :
 * 1. Scroll par pas (viewportHeight - overlap)
 * 2. Capture viewport
 * 3. Bande 0 : image entière (hauteur = min(viewport, page))
 * 4. Bandes suivantes : rogner les `overlap` px du haut (zone déjà capturée)
 * 5. Coller les bandes à offsetTop cumulé (pas à scrollY brut)
 *
 * Usage (cible en ligne, pas besoin de npm run dev) :
 *   npx playwright install chromium
 *   node scripts/capture-fullpage-stitch.mjs --url https://www.openscribe.fr/ --out docs/screenshots/landing.png
 *   node scripts/capture-fullpage-stitch.mjs --url https://www.openscribe.fr/ --out out.png --method playwright-fullpage
 */

import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdir, writeFile } from 'fs/promises';
import { dirname, resolve } from 'path';

function parseArgs(argv) {
  const args = {
    url: '',
    out: 'capture.png',
    width: 1440,
    height: 900,
    overlap: 0,
    wait: 400,
    method: 'playwright-fullpage',
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--url') args.url = argv[++i];
    else if (a === '--out') args.out = argv[++i];
    else if (a === '--width') args.width = Number(argv[++i]);
    else if (a === '--height') args.height = Number(argv[++i]);
    else if (a === '--overlap') args.overlap = Number(argv[++i]);
    else if (a === '--wait') args.wait = Number(argv[++i]);
    else if (a === '--method') args.method = argv[++i];
  }
  if (!args.url) {
    console.error('Missing --url');
    process.exit(1);
  }
  if (args.overlap === 0) args.overlap = Math.round(args.height * 0.08);
  return args;
}

async function hideFixedChrome(page) {
  await page.evaluate(() => {
    for (const el of document.querySelectorAll('header, nav, [role="banner"]')) {
      const pos = getComputedStyle(el).position;
      if (pos === 'fixed' || pos === 'sticky') {
        el.dataset.captureHidden = '1';
        el.style.setProperty('visibility', 'hidden', 'important');
      }
    }
  });
}

async function restoreFixedChrome(page) {
  await page.evaluate(() => {
    for (const el of document.querySelectorAll('[data-capture-hidden="1"]')) {
      el.style.removeProperty('visibility');
      delete el.dataset.captureHidden;
    }
  });
}

/** GoFullPage-style: append strips only, crop overlap from 2nd strip onward */
async function captureStitch(page, { width, height, overlap, wait }) {
  await page.setViewportSize({ width, height });
  await page.waitForTimeout(wait);

  const scrollHeight = await page.evaluate(() =>
    Math.max(
      document.documentElement.scrollHeight,
      document.body?.scrollHeight ?? 0,
      document.documentElement.offsetHeight
    )
  );

  if (scrollHeight <= height + 2) {
    return page.screenshot({ type: 'png', fullPage: false });
  }

  const scrollStep = height - overlap;
  const strips = [];
  let scrollY = 0;
  let offsetTop = 0;

  while (offsetTop < scrollHeight - 1) {
    await page.evaluate((y) => window.scrollTo({ top: y, left: 0, behavior: 'instant' }), scrollY);
    await page.waitForTimeout(wait);

    if (scrollY > 0) await hideFixedChrome(page);
    else await restoreFixedChrome(page);

    const buffer = await page.screenshot({ type: 'png', animations: 'disabled' });
    if (scrollY > 0) await restoreFixedChrome(page);

    const meta = await sharp(buffer).metadata();
    const isFirst = strips.length === 0;
    const cropTop = isFirst ? 0 : overlap;
    const remaining = scrollHeight - offsetTop;
    const maxStrip = isFirst ? height : height - overlap;
    const cropHeight = Math.min(maxStrip, remaining, (meta.height ?? height) - cropTop);

    if (cropHeight <= 0) break;

    const strip = await sharp(buffer)
      .extract({
        left: 0,
        top: cropTop,
        width: meta.width,
        height: cropHeight,
      })
      .toBuffer();

    strips.push({ buffer: strip, top: offsetTop, width: meta.width, height: cropHeight });
    offsetTop += cropHeight;
    scrollY += scrollStep;

    if (cropHeight < maxStrip - 2) break;
  }

  const canvasWidth = Math.max(...strips.map((s) => s.width));
  const composites = strips.map((s) => ({ input: s.buffer, top: s.top, left: 0 }));

  return sharp({
    create: {
      width: canvasWidth,
      height: offsetTop,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite(composites)
    .png()
    .toBuffer();
}

async function capturePlaywrightFullPage(page) {
  return page.screenshot({ type: 'png', fullPage: true, animations: 'disabled' });
}

async function main() {
  const args = parseArgs(process.argv);
  const outPath = resolve(args.out);
  await mkdir(dirname(outPath), { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: args.width, height: args.height },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await page.goto(args.url, { waitUntil: 'networkidle', timeout: 90_000 });
  await page.waitForTimeout(args.wait);

  let png;
  try {
    if (args.method === 'stitch') {
      png = await captureStitch(page, args);
    } else {
      png = await capturePlaywrightFullPage(page);
    }
  } catch (err) {
    if (args.method !== 'stitch') {
      console.warn('playwright-fullpage failed, fallback stitch:', err.message);
      png = await captureStitch(page, args);
    } else throw err;
  }

  await writeFile(outPath, png);
  const meta = await sharp(png).metadata();
  console.log(
    `Saved ${outPath} (${meta.width}x${meta.height}) method=${args.method} overlap=${args.overlap}`
  );

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
