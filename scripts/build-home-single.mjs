import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist-home');
const output = path.join(root, 'outputs', 'forge3d-home-magic.html');
let html = await readFile(path.join(dist, 'home.html'), 'utf8');

const cssMatch = html.match(/<link[^>]+href="([^"]+\.css)"[^>]*>/);
const jsMatch = html.match(/<script[^>]+src="([^"]+\.js)"[^>]*><\/script>/);
if (!cssMatch || !jsMatch) throw new Error('Could not locate home CSS/JS build assets');

const assetPath = (url) => path.join(dist, url.replace(/^\//, ''));
const [css, rawJs] = await Promise.all([
  readFile(assetPath(cssMatch[1]), 'utf8'),
  readFile(assetPath(jsMatch[1]), 'utf8'),
]);
const js = rawJs.replace(/<\/script/gi, '<\\/script');

html = html
  .replace(cssMatch[0], () => '<style>' + css + '</style>')
  .replace(jsMatch[0], () => '<script type="module">' + js + '</script>')
  .replace(/<link rel="icon"[^>]*>/, '<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 64 64%22%3E%3Crect width=%2264%22 height=%2264%22 rx=%2218%22 fill=%22%23211d19%22/%3E%3Cpath d=%22M14 31 32 16l18 15v21H37V39H27v13H14z%22 fill=%22%23f6efe5%22/%3E%3C/svg%3E">');

html = html.replace(/[ \t]+$/gm, '');

await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, html);
console.log(output);
