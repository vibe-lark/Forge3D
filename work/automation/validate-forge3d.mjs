import { chromium } from 'playwright-core';
import { readFile } from 'node:fs/promises';

const baseUrl = process.argv[2] || 'http://127.0.0.1:4173/forge3d-magic.html';
const launchOptions = {
  headless: true,
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  args: ['--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'],
};
let browser = await chromium.launch(launchOptions);

const failures = [];
const robotFixture = await readFile(new URL('./downloads/run-2026-07-20-2100/character.glb', import.meta.url));
const colormapFixture = await readFile(new URL('./downloads/run-2026-07-20-1800/platformer-colormap.png', import.meta.url));
const steampunkCameraFixture = await readFile(new URL('./downloads/run-2026-07-21-1500/steampunk-camera/steampunk_camera.glb', import.meta.url));

async function waitForStats(page) {
  await page.waitForFunction(() => {
    const meshes = document.querySelector('#meta-meshes')?.textContent?.trim();
    const triangles = document.querySelector('#meta-triangles')?.textContent?.trim();
    return meshes && triangles && meshes !== '—' && triangles !== '—';
  }, null, { timeout: 90000 });
  return page.evaluate(() => ({
    name: document.querySelector('#detail-name')?.textContent?.trim(),
    meshes: document.querySelector('#meta-meshes')?.textContent?.trim(),
    triangles: document.querySelector('#meta-triangles')?.textContent?.trim(),
    source: document.querySelector('#viewer-source')?.textContent?.trim(),
  }));
}

async function createPage(viewport, { ignoreExpectedNetworkError = false } = {}) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  page.on('pageerror', (error) => failures.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    if (ignoreExpectedNetworkError && /net::ERR_(FAILED|TIMED_OUT)/.test(message.text())) return;
    failures.push(`console.error: ${message.text()}`);
  });
  return { context, page };
}

const desktop = await createPage({ width: 1536, height: 864 });
await desktop.page.goto(baseUrl, { waitUntil: 'commit', timeout: 30000 });
await desktop.page.waitForSelector('.asset-list', { timeout: 30000 });
const existing = await waitForStats(desktop.page);
await desktop.page.route('**/steampunk-camera.glb', (route) => route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: steampunkCameraFixture }));
await desktop.page.locator('[data-asset-id="steampunk-camera"]').click();
const newAsset = await waitForStats(desktop.page);
await desktop.page.locator('[data-asset-id="sheen-cloth"]').click();
await desktop.page.route('**/SheenCloth-complete.zip', (route) => route.fulfill({
  status: 200,
  contentType: 'application/zip',
  body: Buffer.from('PK\u0005\u0006\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000'),
}));
const packageDownloadPromise = desktop.page.waitForEvent('download', { timeout: 90000 });
await desktop.page.locator('#download-asset').click();
const packageDownload = await packageDownloadPromise;
const packageFilename = packageDownload.suggestedFilename();
if (packageFilename !== 'sheen-cloth-complete.zip') failures.push(`package filename unexpected: ${packageFilename}`);
const desktopMetrics = await desktop.page.evaluate(() => {
  const list = document.querySelector('.asset-list');
  const detail = document.querySelector('.asset-detail');
  return {
    viewportHeight: window.innerHeight,
    documentScrollHeight: document.documentElement.scrollHeight,
    listClientHeight: list?.clientHeight,
    listScrollHeight: list?.scrollHeight,
    detailBottom: Math.round(detail?.getBoundingClientRect().bottom || 0),
    resultText: document.querySelector('#results-status')?.textContent?.trim(),
  };
});
if (desktopMetrics.documentScrollHeight !== desktopMetrics.viewportHeight) failures.push('desktop document scrolls');
if (!(desktopMetrics.listScrollHeight > desktopMetrics.listClientHeight)) failures.push('desktop list is not independently scrollable');
if (desktopMetrics.detailBottom > desktopMetrics.viewportHeight) failures.push('desktop detail is below viewport');
if (!newAsset.source.includes('妙笔 TOS')) failures.push(`new asset source unexpected: ${newAsset.source}`);

let antiqueRequests = 0;
desktop.page.on('request', (request) => {
  if (request.url().includes('AntiqueCamera.glb')) antiqueRequests += 1;
});
await desktop.page.locator('[data-asset-id="antique-camera"]').click();
await desktop.page.waitForSelector('#load-overlay.visible.large');
if (antiqueRequests !== 0) failures.push('large model requested before confirmation');

await desktop.context.close();

// 真实网络加载：确认新素材的 TOS glTF、BIN 和纹理能被浏览器中的 Three.js 一起解析。
const direct = await createPage({ width: 1536, height: 864 });
await direct.page.goto(baseUrl, { waitUntil: 'commit', timeout: 30000 });
await direct.page.waitForSelector('.asset-list', { timeout: 30000 });
await waitForStats(direct.page);
const directAssets = [];
for (const [id, expectedName] of [
  ['steampunk-camera', '蒸汽朋克相机'],
  ['primary-ion-drive', '初级离子推进器'],
  ['fire-truck', '消防车'],
  ['iridescent-dish', '虹彩橄榄餐盘'],
]) {
  await direct.page.locator(`[data-asset-id="${id}"]`).click();
  await direct.page.waitForFunction((name) => {
    const detailName = document.querySelector('#detail-name')?.textContent?.trim();
    const meshes = document.querySelector('#meta-meshes')?.textContent?.trim();
    return detailName === name && meshes && meshes !== '—';
  }, expectedName, { timeout: 90000 });
  const stats = await waitForStats(direct.page);
  directAssets.push({ id, ...stats });
  if (!stats.source.includes('妙笔 TOS')) failures.push(`direct new asset source unexpected for ${id}: ${stats.source}`);
}
await direct.context.close();

const fallback = await createPage({ width: 1536, height: 864 }, { ignoreExpectedNetworkError: true });
await fallback.page.route('**/platformer-robot.glb', async (route) => {
  if (route.request().url().includes('magic-builder.tos-cn-beijing.volces.com')) await route.abort('failed');
  else await route.continue();
});
await fallback.page.route('**/character.glb', (route) => route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: robotFixture }));
await fallback.page.route('**/Textures/colormap.png', (route) => route.fulfill({ status: 200, contentType: 'image/png', body: colormapFixture }));
await fallback.page.goto(baseUrl, { waitUntil: 'commit', timeout: 30000 });
await fallback.page.waitForSelector('.asset-list', { timeout: 30000 });
await waitForStats(fallback.page);
await fallback.page.locator('[data-asset-id="platformer-robot"]').click();
const fallbackStats = await waitForStats(fallback.page);
if (!fallbackStats.source.includes('jsDelivr 回退')) failures.push(`fallback source unexpected: ${fallbackStats.source}`);
const fallbackDownloadPromise = fallback.page.waitForEvent('download', { timeout: 90000 });
await fallback.page.locator('#download-asset').click();
const fallbackDownload = await fallbackDownloadPromise;
const fallbackFilename = fallbackDownload.suggestedFilename();
if (fallbackFilename !== 'character.glb') failures.push(`fallback download filename unexpected: ${fallbackFilename}`);
await fallback.context.close();

// 故障注入会主动中止网络请求；移动端使用新浏览器进程，避免连接池残留影响布局验证。
await browser.close();
browser = await chromium.launch(launchOptions);

const mobile = await createPage({ width: 390, height: 844 });
await mobile.page.goto(baseUrl, { waitUntil: 'commit', timeout: 30000 });
await mobile.page.waitForSelector('.asset-list', { timeout: 30000 });
const mobileStats = await waitForStats(mobile.page);
const mobileMetrics = await mobile.page.evaluate(() => {
  const list = document.querySelector('.asset-list');
  return {
    viewportHeight: window.innerHeight,
    documentScrollHeight: document.documentElement.scrollHeight,
    listClientHeight: list?.clientHeight,
    listScrollHeight: list?.scrollHeight,
    bodyOverflow: getComputedStyle(document.body).overflow,
  };
});
if (!(mobileMetrics.documentScrollHeight > mobileMetrics.viewportHeight)) failures.push('mobile page does not scroll naturally');
await mobile.context.close();

await browser.close();

console.log(JSON.stringify({
  baseUrl,
  existing,
  newAsset,
  directAssets,
  packageFilename,
  fallback: fallbackStats,
  fallbackFilename,
  stallFallback: '复用上一轮通过结果；本轮未修改加载超时逻辑',
  desktop: desktopMetrics,
  mobile: { ...mobileMetrics, stats: mobileStats },
  failures,
}, null, 2));

if (failures.length) process.exit(1);
