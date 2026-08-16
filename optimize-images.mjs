// Compress + resize the heavy images served by the API (seed uploads)
// and used by the public site. Run: node optimize-images.mjs
import { readdirSync, mkdirSync, renameSync, statSync } from "fs";
import path from "path";
import sharp from "sharp";

const targets = [
  {
    dir: "backend/uploads/seed",
    out: "backend/uploads/seed",
    maxWidth: 1600,
    quality: 78,
  },
  {
    dir: "frontend/public/assets/img/hero",
    out: "frontend/public/assets/img/hero",
    maxWidth: 900,
    quality: 72,
  },
  {
    dir: "frontend/public/assets/img/news",
    out: "frontend/public/assets/img/news",
    maxWidth: 1200,
    quality: 75,
  },
];

async function processDir({ dir, out, maxWidth, quality }) {
  mkdirSync(out, { recursive: true });
  let saved = 0;
  let totalBefore = 0;
  let totalAfter = 0;
  for (const name of readdirSync(dir)) {
    const file = path.join(dir, name);
    if (!/\.(jpe?g|png|webp)$/i.test(name)) continue;
    const before = statSync(file).size;
    const ext = path.extname(name).toLowerCase();
    const outName = name.replace(/\.[^.]+$/, ext === ".png" ? ".png" : ".jpg");
    const outFile = path.join(out, outName);

    const img = sharp(file, { failOn: "none" }).rotate();
    const meta = await img.metadata();
    const width = meta.width ?? maxWidth;
    const resizeWidth = Math.min(width, maxWidth);

    let pipeline = img;
    if (resizeWidth < width) pipeline = pipeline.resize({ width: resizeWidth });
    if (ext === ".png" && meta.format === "png") {
      pipeline = pipeline.png({ quality, compressionLevel: 9, palette: true });
    } else {
      pipeline = pipeline.jpeg({ quality, mozjpeg: true });
    }
    const tmpFile = outFile + ".tmp";
    await pipeline.toFile(tmpFile);
    await renameSync(tmpFile, outFile);
    const after = statSync(outFile).size;
    totalBefore += before;
    totalAfter += after;
    if (after < before) saved += before - after;
    console.log(
      `  ${name}: ${(before / 1024).toFixed(0)}KB -> ${(after / 1024).toFixed(0)}KB (${Math.round((1 - after / before) * 100)}% saved)`
    );
  }
  console.log(
    `${dir}: total ${(totalBefore / 1024 / 1024).toFixed(2)}MB -> ${(totalAfter / 1024 / 1024).toFixed(2)}MB (${Math.round((1 - totalAfter / totalBefore) * 100)}% saved)\n`
  );
}

for (const t of targets) await processDir(t);
console.log("Done.");
