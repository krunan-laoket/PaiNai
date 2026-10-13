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
  const section = (heading) => {
    const block = content.split(/^## /m).find(part => part.split(/\r?\n/)[0].trim() === heading);
    return block ? block.split(/\r?\n/).slice(1).join('\n').trim() : '';
  };
  const bulletList = (heading) => section(heading).split('\n').filter(line => line.startsWith('- ')).map(line => line.slice(2));
  const guide = {
    about: section('รู้จักสถานที่'),
    activities: section('ไปแล้วทำอะไรได้'),
    pros: bulletList('ข้อดี'),
    cons: bulletList('ข้อเสียและข้อจำกัด'),
    cautions: bulletList('ข้อควรระวัง'),
    audience: section('เหมาะกับใคร'),
    notice: section('สถานะที่ควรรู้')
  };
  if (!guide.about || !guide.activities || !guide.pros.length || !guide.cons.length || !guide.cautions.length || !guide.audience) throw Error('Incomplete visitor guide: ' + file);
  const referencesText = ['แหล่งข้อมูล', 'แหล่งข้อมูลอ้างอิง', 'แหล่งอ้างอิง', 'อ้างอิง'].map(section).join('\n');
  const seenReferences = new Set();
  const references = [...referencesText.matchAll(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g)].filter(match => {
    if (seenReferences.has(match[2])) return false;
    seenReferences.add(match[2]);
    return true;
  }).map(match => ({ label: match[1], url: match[2] }));
  const maps = content.match(/\]\((https:\/\/(?:www\.google\.com\/maps|maps\.app\.goo\.gl)[^)]+)\)/)?.[1];
  const coordinateText = field('พิกัดแสดงบนแผนที่');
  const mapCoords = coordinateText ? coordinateText.split(',').map(value => Number(value.trim())) : undefined;
  if (mapCoords && (mapCoords.length !== 2 || !mapCoords.every(Number.isFinite) || Math.abs(mapCoords[0]) > 90 || Math.abs(mapCoords[1]) > 180)) throw Error('Invalid map coordinates: ' + file);
  places.push({ id: Number(id), title, category, file, zone: field('โซน'), address: field('ที่ตั้ง'), description: guide.about, time: field('เวลาเผื่อ'), guide, references, mapCoords, mapQuery: field('คำค้นแผนที่') || undefined, maps });
}
if (places.length !== 32 || new Set(places.map(p => p.id)).size !== 32) throw Error('Expected 32 unique places');
const template = fs.readFileSync(path.join(root, 'page-template.html'), 'utf8');
fs.writeFileSync(path.join(root, 'index.html'), template);
fs.writeFileSync(path.join(root, 'places-data.js'), 'window.KHAOYAI_PLACES = ' + JSON.stringify(places, null, 2).replaceAll('<', '\\u003c') + ';\n');
console.log(`Created index.html with ${places.length} places in ${new Set(places.map(p => p.category)).size} categories`);
