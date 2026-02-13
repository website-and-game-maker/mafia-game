#!/usr/bin/env node

/*
  Button sweep regression script.
  Run with:
  npx --yes -p playwright node scripts/playwright_button_sweep.js
*/

const { chromium } = require('playwright');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function clickIfVisible(page, selector) {
  const locator = page.locator(selector).first();
  if (await locator.isVisible().catch(() => false)) {
    await locator.click();
    return true;
  }
  return false;
}

async function chooseFirstIfNoneSelected(page, rootSelector, itemSelector) {
  const root = page.locator(rootSelector).first();
  if (!await root.isVisible().catch(() => false)) return false;
  if (await root.locator('.selected').count() > 0) return false;
  const first = root.locator(itemSelector).first();
  if (await first.isVisible().catch(() => false)) {
    await first.click();
    return true;
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
    await page.goto('http://localhost:8000', { waitUntil: 'domcontentloaded', timeout: 15000 });
    log('opened setup');

    await page.getByRole('button', { name: 'How to Play' }).click();
    await page.getByRole('button', { name: /Gameplay/ }).click();
    await page.getByRole('button', { name: /Modes/ }).click();
    await page.getByRole('button', { name: 'Got it!' }).click();
    log('checked instructions modal');

    await page.getByRole('button', { name: /Multiplayer/ }).click();
    await page.fill('#newPlayerInput', 'Alice');
    await page.press('#newPlayerInput', 'Enter');
  await page.fill('#newPlayerInput', 'Bob');
  await page.press('#newPlayerInput', 'Enter');
  await sleep(80);

  const activeId = await page.evaluate(() => document.activeElement && document.activeElement.id);
    if (activeId !== 'newPlayerInput') {
      errors.push(`focus: expected newPlayerInput after Enter, got ${activeId}`);
    }

    const downBtns = page.locator('.player-item .order-btn[title="Move down"]');
    if (await downBtns.count() > 0) await downBtns.first().click();

    await page.getByRole('button', { name: 'Multi-device' }).click();
    await page.getByRole('button', { name: 'Single-device' }).click();
    await page.getByRole('button', { name: /Back/ }).click();
    log('checked multiplayer lobby buttons');

    await page.getByRole('button', { name: /Solo/ }).click();
    await page.fill('#soloNameInput', 'Tester');
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
      if (await clickIfVisible(page, 'button:has-text("Confirm Medicine")')) { await sleep(140); continue; }
      if (await clickIfVisible(page, 'button:has-text("Confirm Save")')) { await sleep(140); continue; }
      if (await clickIfVisible(page, 'button:has-text("Proceed to Voting")')) { await sleep(140); continue; }
      if (await clickIfVisible(page, 'button:has-text("Submit Vote")')) { await sleep(140); continue; }
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
