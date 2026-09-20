import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
const root = 'public/images';
let written = 0;
async function walk(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    if (entry.name === 'responsive') continue;
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(file);
      continue;
    }
    if (!/\.(jpg|jpeg|png)$/i.test(file)) continue;
    const relative = path.relative(root, file).replace(/\.(jpg|jpeg|png)$/i, '');
    const source = await fs.stat(file);
    for (const width of relative === 'hero' ? [480, 960, 1600] : [480, 640, 960]) {
      const output = path.join(root, 'responsive', `${relative}-${width}.webp`);
      const stat = await fs.stat(output).catch(() => null);
      if (stat && stat.mtimeMs >= source.mtimeMs) continue;
      await fs.mkdir(path.dirname(output), { recursive: true });
      await sharp(file)
        .rotate()
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: 78, effort: 4 })
        .toFile(output);
      written++;
    }
    if (relative === 'hero') {
      for (const width of [480, 800]) {
        const output = path.join(root, 'responsive', `hero-mobile-${width}.webp`);
        const stat = await fs.stat(output).catch(() => null);
        if (stat && stat.mtimeMs >= source.mtimeMs) continue;
        await sharp(file)
          .rotate()
          .resize({ width, height: Math.round((width * 4) / 3), fit: 'cover' })
          .webp({ quality: 75, effort: 4 })
          .toFile(output);
        written++;
      }
    }
  }
}
await walk(root);
console.log(`Responsive photographs ready (${written} variants updated).`);
