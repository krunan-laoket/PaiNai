import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.dirname(fileURLToPath(import.meta.url));
const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
let category = '';
const places = [];
for (const line of readme.split(/\r?\n/)) {
  const heading = line.match(/^## (.+?) \(\d+ รายการ\)/);
  if (heading) category = heading[1];
  const row = line.match(/^\| (\d+) \| \[(.+?)\]\((.+?)\) \|/);
  if (!row) continue;
  const [, id, title, file] = row;
  const content = fs.readFileSync(path.join(root, file), 'utf8');
  const field = (prefix) => content.split(/\r?\n/).find(l => l.startsWith('- **' + prefix))?.replace(/^- \*\*[^*]+\*\*\s*/, '') || '';
  const maps = content.match(/\]\((https:\/\/(?:www\.google\.com\/maps|maps\.app\.goo\.gl)[^)]+)\)/)?.[1];
  const coordinateText = field('พิกัดแสดงบนแผนที่');
  const mapCoords = coordinateText ? coordinateText.split(',').map(value => Number(value.trim())) : undefined;
  if (mapCoords && (mapCoords.length !== 2 || !mapCoords.every(Number.isFinite) || Math.abs(mapCoords[0]) > 90 || Math.abs(mapCoords[1]) > 180)) throw Error('Invalid map coordinates: ' + file);
  places.push({ id: Number(id), title, category, file, zone: field('โซน'), address: field('ที่ตั้ง'), description: field('ลักษณะ'), time: field('เวลาเผื่อ'), mapCoords, mapQuery: field('คำค้นแผนที่') || undefined, maps, content });
}
if (places.length !== 32 || new Set(places.map(p => p.id)).size !== 32) throw Error('Expected 32 unique places');
const template = fs.readFileSync(path.join(root, 'page-template.html'), 'utf8');
fs.writeFileSync(path.join(root, 'index.html'), template);
fs.writeFileSync(path.join(root, 'places-data.js'), 'window.KHAOYAI_PLACES = ' + JSON.stringify(places, null, 2).replaceAll('<', '\\u003c') + ';\n');
console.log(`Created index.html with ${places.length} places in ${new Set(places.map(p => p.category)).size} categories`);
