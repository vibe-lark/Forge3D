import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');
const output = path.join(root, 'outputs', 'forge3d-magic.html');
let html = await readFile(path.join(dist, 'index.html'), 'utf8');

const cssMatch = html.match(/<link[^>]+href="([^"]+\.css)"[^>]*>/);
const jsMatch = html.match(/<script[^>]+src="([^"]+\.js)"[^>]*><\/script>/);

if (!cssMatch || !jsMatch) {
  throw new Error('Could not locate Vite CSS/JS assets in dist/index.html');
}

const assetPath = (url) => path.join(dist, url.replace(/^\//, ''));
const [css, rawJs] = await Promise.all([
  readFile(assetPath(cssMatch[1]), 'utf8'),
  readFile(assetPath(jsMatch[1]), 'utf8'),
]);
const js = rawJs.replace(/<\/script/gi, '<\\/script');

html = html
  .replace(cssMatch[0], () => `<style>${css}</style>`)
  .replace(jsMatch[0], () => `<script type="module">${js}</script>`)
  .replace(/<link rel="icon"[^>]*>/, '<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 64 64%22%3E%3Crect width=%2264%22 height=%2264%22 rx=%2216%22 fill=%22%2317191d%22/%3E%3Cpath d=%22M20 16h27v9H30v8h14v9H30v16H20z%22 fill=%22white%22/%3E%3C/svg%3E">');

await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, html);
console.log(output);
