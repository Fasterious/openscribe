import sharp from "sharp";
import { mkdir, readFile } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");
const iconsDir = join(publicDir, "icons");

await mkdir(iconsDir, { recursive: true });

const svgPath = join(publicDir, "logo.svg");
const svgBuffer = await readFile(svgPath);

// Bleu indigo du logo - fond 100% opaque, sans transparence
const backgroundColor = { r: 47, g: 64, b: 194, alpha: 1 }; // #2F40C2

for (const size of [192, 512]) {
  // 1. Créer un carré 100% bleu indigo (aucune transparence)
  const blueBackground = await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: backgroundColor,
    },
  })
    .png()
    .toBuffer();

  // 2. Logo centré (80% de la taille pour la safe zone maskable)
  const logoSize = Math.floor(size * 0.8);
  const padding = Math.floor((size - logoSize) / 2);
  const logoResized = await sharp(svgBuffer)
    .resize(logoSize, logoSize)
    .flatten({ background: backgroundColor })
    .toBuffer();

  // 3. Composer : fond bleu plein + logo centré
  await sharp(blueBackground)
    .composite([{ input: logoResized, top: padding, left: padding }])
    .png()
    .toFile(join(iconsDir, `icon-${size}.png`));

  console.log(`Generated icon-${size}.png`);
}
