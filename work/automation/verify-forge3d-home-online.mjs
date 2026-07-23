import { chromium } from 'playwright-core';

const url = process.argv[2] || 'https://magic.solutionsuite.cn/html-box/vqbtFtT6VWt';
const browser = await chromium.launch({
  headless: true,
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  args: ['--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'],
});
const failures = [];

async function verify(viewport, mobile = false) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });

  let appFrame;
  for (let attempt = 0; attempt < 120; attempt += 1) {
    for (const frame of page.frames()) {
      if (await frame.locator('.home-shell').count().catch(() => 0)) { appFrame = frame; break; }
    }
    if (appFrame) break;
    await page.waitForTimeout(500);
  }
  if (!appFrame) throw new Error('Magic app iframe did not become ready');
  await appFrame.waitForFunction(() => window.__HOME_QA__?.ready && window.__HOME_QA__.loadedIds.length >= 8, null, { timeout: 90000 });
  await appFrame.locator('[data-zone="study"]').click();
  await appFrame.waitForFunction(() => window.__HOME_QA__?.activeZone === 'study');

  const result = await appFrame.evaluate(() => ({
    title: document.title,
    heading: document.querySelector('.brand strong')?.textContent?.trim(),
    zone: document.querySelector('#zoneName')?.textContent?.trim(),
    qa: { ...window.__HOME_QA__, loadedIds: [...window.__HOME_QA__.loadedIds], errors: [...window.__HOME_QA__.errors] },
    viewportHeight: window.innerHeight,
    documentScrollHeight: document.documentElement.scrollHeight,
    navButtons: document.querySelectorAll('[data-zone]').length,
    licenseItems: document.querySelectorAll('.license-list article').length,
  }));

  if (result.heading !== '拾光之家') failures.push(`${mobile ? 'mobile' : 'desktop'} heading unexpected: ${result.heading}`);
  if (result.zone !== '书房') failures.push(`${mobile ? 'mobile' : 'desktop'} zone switch failed`);
  if (result.qa.loadedIds.length < 8 || result.qa.meshes <= 0 || result.qa.triangles <= 0) failures.push(`${mobile ? 'mobile' : 'desktop'} model stats missing`);
  if (result.qa.tosLoads < 1) failures.push(`${mobile ? 'mobile' : 'desktop'} TOS loading not observed`);
  if (result.navButtons !== 5 || result.licenseItems !== 11) failures.push(`${mobile ? 'mobile' : 'desktop'} content count mismatch`);
  if (mobile && !(result.documentScrollHeight > result.viewportHeight)) failures.push('online mobile does not scroll naturally');
  if (!mobile && result.documentScrollHeight !== result.viewportHeight) failures.push('online desktop iframe scrolls');
  if (pageErrors.length) failures.push(...pageErrors.map((message) => `${mobile ? 'mobile' : 'desktop'} pageerror: ${message}`));
  await context.close();
  return { frameUrl: appFrame.url(), ...result, pageErrors };
}

const desktop = await verify({ width: 1536, height: 864 });
const mobile = await verify({ width: 390, height: 844 }, true);
await browser.close();
console.log(JSON.stringify({ url, desktop, mobile, failures }, null, 2));
if (failures.length) process.exit(1);
