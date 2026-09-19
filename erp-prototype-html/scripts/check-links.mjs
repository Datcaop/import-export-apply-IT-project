// Quét mọi file .html trong prototype, báo các link nội bộ (href/src) trỏ tới file không tồn tại.
// Chạy: node erp-prototype-html/scripts/check-links.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}

const pages = walk(ROOT).filter((f) => f.endsWith('.html'));
const broken = [];
let checked = 0;

for (const page of pages) {
  const html = fs.readFileSync(page, 'utf8');
  for (const [, attr, url] of html.matchAll(/\b(href|src)="([^"]*)"/g)) {
    if (/^(https?:|mailto:|tel:|data:|javascript:)/.test(url)) continue;
    if (url === '' || url === '#') {
      broken.push(`${path.relative(ROOT, page)}: ${attr}="${url}" (link trống)`);
      continue;
    }
    if (url.startsWith('#')) continue;
    const target = path.resolve(path.dirname(page), url.split(/[?#]/)[0]);
    checked++;
    if (!fs.existsSync(target)) broken.push(`${path.relative(ROOT, page)}: ${attr}="${url}"`);
  }
}

console.log(`${pages.length} trang, ${checked} link nội bộ đã kiểm tra.`);
if (broken.length) {
  console.error(`${broken.length} link hỏng:\n` + broken.map((b) => '  ' + b).join('\n'));
  process.exit(1);
}
console.log('Không có link hỏng.');
