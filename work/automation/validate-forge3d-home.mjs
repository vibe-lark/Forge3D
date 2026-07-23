import { chromium } from 'playwright-core';

const baseUrl = process.argv[2] || 'http://127.0.0.1:4175/home.html';
const browser = await chromium.launch({
  headless: true,
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  args: ['--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'],
});

const failures = [];
async function inspect(viewport, mobile = false) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForFunction(() => window.__HOME_QA__?.ready, null, { timeout: 90000 });
  await page.waitForFunction(() => window.__HOME_QA__?.loadedIds?.length >= 8, null, { timeout: 90000 });

  await page.locator('[data-zone="living"]').click();
  await page.waitForFunction(() => window.__HOME_QA__?.activeZone === 'living');
  const zoneName = await page.locator('#zoneName').textContent();

  await page.locator('#dayToggle').click();
  const night = await page.locator('#dayToggle').getAttribute('aria-pressed');
  await page.locator('#licenseToggle').click();
  const drawerVisible = await page.locator('#licenseDrawer').getAttribute('aria-hidden');
  await page.locator('#licenseClose').click();

  const result = await page.evaluate(() => ({
    qa: { ...window.__HOME_QA__, loadedIds: [...window.__HOME_QA__.loadedIds], errors: [...window.__HOME_QA__.errors] },
    viewportHeight: window.innerHeight,
    documentScrollHeight: document.documentElement.scrollHeight,
    bodyOverflowY: getComputedStyle(document.body).overflowY,
    canvasHeight: Math.round(document.querySelector('#scene').getBoundingClientRect().height),
    navButtons: document.querySelectorAll('[data-zone]').length,
    licenseItems: document.querySelectorAll('.license-list article').length,
    title: document.title,
  }));

  if (pageErrors.length) failures.push(...pageErrors.map((message) => `${mobile ? 'mobile' : 'desktop'} pageerror: ${message}`));
  if (result.qa.loadedIds.length < 8) failures.push(`${mobile ? 'mobile' : 'desktop'} loaded only ${result.qa.loadedIds.length}`);
  if (result.qa.meshes <= 0 || result.qa.triangles <= 0) failures.push(`${mobile ? 'mobile' : 'desktop'} missing geometry stats`);
  if (result.qa.tosLoads < 1) failures.push(`${mobile ? 'mobile' : 'desktop'} no TOS model loaded`);
  if (zoneName?.trim() !== '客厅') failures.push(`${mobile ? 'mobile' : 'desktop'} zone switch failed`);
  if (night !== 'true') failures.push(`${mobile ? 'mobile' : 'desktop'} night toggle failed`);
  if (drawerVisible !== 'false') failures.push(`${mobile ? 'mobile' : 'desktop'} license drawer failed`);
  if (result.navButtons !== 5 || result.licenseItems !== 11) failures.push(`${mobile ? 'mobile' : 'desktop'} UI counts unexpected`);
  if (mobile && !(result.documentScrollHeight > result.viewportHeight)) failures.push('mobile page does not scroll naturally');
  if (!mobile && result.documentScrollHeight !== result.viewportHeight) failures.push('desktop document scrolls');
  await context.close();
  return { ...result, zoneName: zoneName?.trim(), night, drawerVisible, pageErrors };
}

const desktop = await inspect({ width: 1536, height: 864 });
const mobile = await inspect({ width: 390, height: 844 }, true);
await browser.close();

console.log(JSON.stringify({ baseUrl, desktop, mobile, failures }, null, 2));
if (failures.length) process.exit(1);
