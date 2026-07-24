import { chromium } from 'playwright-core';
const url = 'https://magic.solutionsuite.cn/html-box/vpwMy2lUl3K';
const browser = await chromium.launch({
  headless: true,
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  args: ['--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'],
});
const context = await browser.newContext({ viewport: { width: 1536, height: 864 } });
const page = await context.newPage();
const pageErrors = [];
page.on('pageerror', (error) => pageErrors.push(error.message));
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });

let appFrame;
for (let attempt = 0; attempt < 90; attempt += 1) {
  for (const frame of page.frames()) {
    if (await frame.locator('.asset-list').count().catch(() => 0)) {
      appFrame = frame;
      break;
    }
  }
  if (appFrame) break;
  await page.waitForTimeout(500);
}
if (!appFrame) throw new Error('Magic app iframe did not become ready');

const count = await appFrame.locator('[data-asset-id]').count();
const chineseName = await appFrame.locator('[data-asset-id="countertop-blender"] strong').textContent();
await appFrame.locator('[data-asset-id="countertop-blender"]').click();
await appFrame.waitForFunction(() => {
  const name = document.querySelector('#detail-name')?.textContent?.trim();
  const meshes = document.querySelector('#meta-meshes')?.textContent?.trim();
  const source = document.querySelector('#viewer-source')?.textContent || '';
  return name === '台式搅拌机' && meshes && meshes !== '—' && source.includes('妙笔 TOS');
}, null, { timeout: 90000 });

const result = await appFrame.evaluate(() => {
  const list = document.querySelector('.asset-list');
  const detail = document.querySelector('.asset-detail');
  return {
    name: document.querySelector('#detail-name')?.textContent?.trim(),
    meshes: document.querySelector('#meta-meshes')?.textContent?.trim(),
    triangles: document.querySelector('#meta-triangles')?.textContent?.trim(),
    source: document.querySelector('#viewer-source')?.textContent?.trim(),
    viewportHeight: window.innerHeight,
    documentScrollHeight: document.documentElement.scrollHeight,
    listClientHeight: list?.clientHeight,
    listScrollHeight: list?.scrollHeight,
    detailBottom: Math.round(detail?.getBoundingClientRect().bottom || 0),
  };
});

const failures = [];
if (count !== 98) failures.push(`asset count ${count}`);
if (chineseName?.trim() !== '台式搅拌机') failures.push(`Chinese name ${chineseName}`);
if (result.documentScrollHeight !== result.viewportHeight) failures.push('online iframe document scrolls');
if (!(result.listScrollHeight > result.listClientHeight)) failures.push('online list not independently scrollable');
if (result.detailBottom > result.viewportHeight) failures.push('online detail below viewport');
if (pageErrors.length) failures.push(...pageErrors.map((item) => `pageerror: ${item}`));

console.log(JSON.stringify({ url, frameUrl: appFrame.url(), count, chineseName, result, pageErrors, failures }, null, 2));
await browser.close();
if (failures.length) process.exit(1);
