#!/usr/bin/env node

/*
  Button sweep regression script.
  Run with:
  npx --yes -p playwright node scripts/playwright_button_sweep.js
*/

const { chromium } = require('playwright');
const BASE_URL = process.env.MAFIA_BASE_URL || 'http://localhost:8000';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function clickIfVisible(page, selector) {
  const locator = page.locator(selector).first();
  if (!await locator.isVisible().catch(() => false)) return false;
  try {
    await locator.click({ timeout: 1200 });
    return true;
  } catch (error) {
    try {
      await locator.dispatchEvent('click');
      return true;
    } catch (dispatchError) {
      return false;
    }
  }
  return false;
}

async function chooseFirstIfNoneSelected(page, rootSelector, itemSelector) {
  const root = page.locator(rootSelector).first();
  if (!await root.isVisible().catch(() => false)) return false;
  if (await root.locator('.selected').count() > 0) return false;
  const first = root.locator(itemSelector).first();
  if (await first.isVisible().catch(() => false)) {
    try {
      await first.click({ timeout: 1200 });
      return true;
    } catch (error) {
      try {
        await first.dispatchEvent('click');
        return true;
      } catch (dispatchError) {
        return false;
      }
    }
  }
  return false;
}

async function clickLocatorIfVisible(locator) {
  if (!await locator.isVisible().catch(() => false)) return false;
  try {
    await locator.click({ timeout: 1200 });
    return true;
  } catch (error) {
    try {
      await locator.dispatchEvent('click');
      return true;
    } catch (dispatchError) {
      return false;
    }
  }
  return false;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(`console: ${msg.text()}`);
  });
  page.on('pageerror', err => {
    errors.push(`pageerror: ${err.message}`);
  });

  const log = (line) => console.log(`[sweep] ${line}`);

  try {
    await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    log('opened setup');

    await page.getByRole('button', { name: 'How to Play' }).click();
    await clickLocatorIfVisible(page.getByRole('button', { name: /Rules/i }).first());
    await clickLocatorIfVisible(page.getByRole('button', { name: /Modes/i }).first());
    await clickLocatorIfVisible(page.getByRole('button', { name: 'Got it!' }).first());
    log('checked instructions modal');

    await page.getByRole('button', { name: /Multiplayer/ }).click();
    await page.getByRole('button', { name: 'Host Game' }).waitFor({ state: 'visible', timeout: 5000 });
    await page.getByRole('button', { name: 'Join Game' }).waitFor({ state: 'visible', timeout: 5000 });
    await page.getByRole('button', { name: 'Host Game' }).click();
    await page.waitForURL(/host\.html/, { timeout: 8000 });

    await page.fill('#newPlayerInput', 'Alice');
    await page.press('#newPlayerInput', 'Enter');
    await page.fill('#newPlayerInput', 'Bob');
    await page.press('#newPlayerInput', 'Enter');
    await sleep(80);

    const activeId = await page.evaluate(() => document.activeElement && document.activeElement.id);
    if (activeId !== 'newPlayerInput') {
      errors.push(`focus: expected newPlayerInput after Enter, got ${activeId}`);
    }

    const dragHandles = page.locator('.player-item .drag-handle');
    if (await dragHandles.count() === 0) {
      errors.push('drag handles missing in multiplayer player list');
    }

    const singleDeviceToggle = page.getByRole('button', { name: 'Single-device' }).first();
    if (await singleDeviceToggle.isVisible().catch(() => false)) {
      await singleDeviceToggle.click();
      const multiDeviceToggle = page.getByRole('button', { name: 'Multi-device' }).first();
      if (await multiDeviceToggle.isVisible().catch(() => false)) {
        await multiDeviceToggle.click();
      }
    }
    const backOrHome = page.getByRole('button', { name: /Back|Home/ }).first();
    if (await backOrHome.isVisible().catch(() => false)) {
      await backOrHome.click();
    }
    await page.waitForURL(/index\.html/, { timeout: 8000 });
    log('checked multiplayer lobby navigation');

    const soloButton = page.getByRole('button', { name: /Solo/ }).first();
    if (await soloButton.isVisible().catch(() => false)) {
      await soloButton.click();
      await page.waitForURL(/solo\.html/, { timeout: 8000 });
    } else {
      await page.goto(`${BASE_URL}/solo.html`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    }
    const soloNameInput = page.locator('#soloNameInput').first();
    if (await soloNameInput.isVisible().catch(() => false)) {
      await soloNameInput.fill('Tester');
    } else {
      errors.push('solo name input not visible; continuing with default solo setup');
    }
    await page.getByRole('button', { name: '+ Add Bot' }).click();
    await page.getByRole('button', { name: '+ Add Bot' }).click();
    if (!await page.getByRole('button', { name: 'Start Game' }).isVisible().catch(() => false)) {
      await page.getByRole('button', { name: '+ Add Bot' }).click();
    }
    await page.getByRole('button', { name: 'Start Game' }).click();
    log('started solo game');

    for (let step = 0; step < 320; step++) {
      if (await page.getByRole('button', { name: 'New Game' }).isVisible().catch(() => false)) {
        log('reached game over');
        break;
      }

      if (await clickIfVisible(page, 'button:has-text("Continue to Player Turns")')) { await sleep(120); continue; }
      if (await clickIfVisible(page, 'button:has-text("Reveal My Role")')) { await sleep(120); continue; }
      if (await clickIfVisible(page, 'button:has-text("Got it!")')) { await sleep(120); continue; }
      if (await clickIfVisible(page, 'button:has-text("Plan My Night")')) { await sleep(120); continue; }
      if (await clickIfVisible(page, 'button:has-text("Open Night Console")')) { await sleep(120); continue; }
      if (await clickIfVisible(page, 'button:has-text("Choose Who to Save")')) { await sleep(120); continue; }
      if (await clickIfVisible(page, 'button:has-text("Cast My Vote")')) { await sleep(120); continue; }

      await chooseFirstIfNoneSelected(page, '.location-grid', '.location-card');
      await chooseFirstIfNoneSelected(page, '.action-list', '.action-card');
      await chooseFirstIfNoneSelected(page, '.target-grid', '.target-btn');
      await chooseFirstIfNoneSelected(page, '.target-list', '.target-card');

      if (await clickIfVisible(page, 'button:has-text("Confirm Route")')) { await sleep(140); continue; }
      if (await clickIfVisible(page, 'button:has-text("Confirm Plan")')) { await sleep(140); continue; }
      if (await clickIfVisible(page, 'button:has-text("Confirm Night Strike")')) { await sleep(140); continue; }
      if (await clickIfVisible(page, 'button:has-text("Confirm Night Stance")')) { await sleep(140); continue; }
      if (await clickIfVisible(page, 'button:has-text("Confirm Save")')) { await sleep(140); continue; }
      if (await clickIfVisible(page, 'button:has-text("Proceed to Voting")')) { await sleep(140); continue; }
      if (await clickIfVisible(page, 'button:has-text("Submit Vote")')) { await sleep(140); continue; }
      if (await clickIfVisible(page, 'button:has-text("See Results")')) { await sleep(140); continue; }
      if (await clickIfVisible(page, '.modal-content button:has-text("Continue")')) { await sleep(140); continue; }

      await sleep(260);
    }

    if (errors.length > 0) {
      console.error('[sweep] FAIL');
      errors.forEach(err => console.error(err));
      process.exitCode = 1;
    } else {
      console.log('[sweep] PASS');
    }
  } catch (error) {
    console.error('[sweep] FATAL', error);
    process.exitCode = 1;
  } finally {
    await context.close();
    await browser.close();
  }
})();
