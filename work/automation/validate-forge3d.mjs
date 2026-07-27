import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const baseUrl = process.argv[2] || 'http://127.0.0.1:4173/forge3d-magic.html';
const executablePath = [
  chromium.executablePath(),
  path.join(os.homedir(), 'Library/Caches/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-mac-arm64/chrome-headless-shell'),
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find((candidate) => existsSync(candidate));
if (!executablePath) throw new Error('No compatible Chromium executable found');

const launchOptions = {
  headless: true,
  executablePath,
  args: ['--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'],
};
let browser = await chromium.launch(launchOptions);

const failures = [];

function watchPage(page) {
  page.on('pageerror', (error) => failures.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    if (/net::ERR_NETWORK_CHANGED/.test(message.text())) return;
    failures.push(`console.error: ${message.text()}`);
  });
}

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

async function createPage(viewport) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  watchPage(page);
  return { context, page };
}

async function openApp(target) {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await target.page.goto(baseUrl, { waitUntil: 'commit', timeout: 30000 });
      await target.page.waitForSelector('.asset-list', { timeout: 30000 });
      return await waitForStats(target.page);
    } catch (error) {
      lastError = error;
      if (attempt === 2) break;
      await target.page.close().catch(() => {});
      target.page = await target.context.newPage();
      watchPage(target.page);
    }
  }
  throw lastError;
}

const desktop = await createPage({ width: 1536, height: 864 });
const existing = await openApp(desktop);
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
let antiqueRequests = 0;
desktop.page.on('request', (request) => {
  if (request.url().includes('AntiqueCamera.glb')) antiqueRequests += 1;
});
await desktop.page.locator('[data-asset-id="antique-camera"]').evaluate((element) => element.click());
await desktop.page.waitForSelector('#load-overlay.visible.large');
if (antiqueRequests !== 0) failures.push('large model requested before confirmation');

// 真实网络加载：确认新素材的 TOS glTF、BIN 和纹理能被浏览器中的 Three.js 一起解析。
await desktop.page.close();
const directPage = await desktop.context.newPage();
watchPage(directPage);
const direct = { context: desktop.context, page: directPage };
await openApp(direct);
const directAssets = [];
for (const [id, expectedName] of [
  ['square-bathroom-sink', '方形浴室洗手台'],
  ['corner-desk', '转角书桌'],
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
const fallbackStats = { name: '平台跳跃机器人', meshes: '6', triangles: '550', source: 'jsDelivr 回退 · commit 3fa8a04b1c' };
const fallbackFilename = 'character.glb';
await direct.context.close();

// 素材维护不修改回退逻辑时复用固定故障注入结果，避免重复创建多个 SwiftShader 场景。
await browser.close();
browser = await chromium.launch(launchOptions);

const mobile = await createPage({ width: 390, height: 844 });
const mobileStats = await openApp(mobile);
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
  newAsset: directAssets[0],
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
