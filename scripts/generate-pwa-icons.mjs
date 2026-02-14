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

for (const size of [192, 512]) {
  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(join(iconsDir, `icon-${size}.png`));
  console.log(`Generated icon-${size}.png`);
}
