import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const url = 'https://magic.solutionsuite.cn/html-box/vpwMy2lUl3K';
const executablePath = [
  chromium.executablePath(),
  path.join(os.homedir(), 'Library/Caches/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-mac-arm64/chrome-headless-shell'),
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find((candidate) => existsSync(candidate));
if (!executablePath) throw new Error('No compatible Chromium executable found');

const browser = await chromium.launch({
  headless: true,
  executablePath,
  args: ['--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'],
});
const context = await browser.newContext({ viewport: { width: 1536, height: 864 } });
const pageErrors = [];

function watchPage(page) {
  page.on('pageerror', (error) => pageErrors.push(error.message));
}

async function openMagicApp() {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const page = await context.newPage();
    watchPage(page);
    try {
      await page.goto(url, { waitUntil: 'commit', timeout: 30000 });
      let appFrame;
      for (let frameAttempt = 0; frameAttempt < 120; frameAttempt += 1) {
        for (const frame of page.frames()) {
          if (await frame.locator('.asset-list').count().catch(() => 0)) {
            appFrame = frame;
            break;
          }
        }
        if (appFrame) return { page, appFrame };
        await page.waitForTimeout(500);
      }
      throw new Error('Magic app iframe did not become ready');
    } catch (error) {
      lastError = error;
      await page.close().catch(() => {});
      if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 750));
    }
  }
  throw lastError;
}

const { page, appFrame } = await openMagicApp();

const count = await appFrame.locator('[data-asset-id]').count();
const chineseName = await appFrame.locator('[data-asset-id="square-bathroom-sink"] strong').textContent();
await appFrame.locator('[data-asset-id="square-bathroom-sink"]').evaluate((element) => element.click());
await appFrame.waitForFunction(() => {
  const name = document.querySelector('#detail-name')?.textContent?.trim();
  const meshes = document.querySelector('#meta-meshes')?.textContent?.trim();
  const source = document.querySelector('#viewer-source')?.textContent || '';
  return name === '方形浴室洗手台' && meshes && meshes !== '—' && source.includes('妙笔 TOS');
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
if (count !== 100) failures.push(`asset count ${count}`);
if (chineseName?.trim() !== '方形浴室洗手台') failures.push(`Chinese name ${chineseName}`);
if (result.documentScrollHeight !== result.viewportHeight) failures.push('online iframe document scrolls');
if (!(result.listScrollHeight > result.listClientHeight)) failures.push('online list not independently scrollable');
if (result.detailBottom > result.viewportHeight) failures.push('online detail below viewport');
if (pageErrors.length) failures.push(...pageErrors.map((item) => `pageerror: ${item}`));

console.log(JSON.stringify({ url, frameUrl: appFrame.url(), count, chineseName, result, pageErrors, failures }, null, 2));
await browser.close();
if (failures.length) process.exit(1);
