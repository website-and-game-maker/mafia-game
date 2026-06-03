#!/usr/bin/env node

const { chromium } = require('playwright');

const BASE_URL = process.env.MAFIA_BASE_URL || 'http://127.0.0.1:8000';
const EXPECT_STATIC = String(process.env.EXPECT_STATIC || '') === '1';
const EXPECT_AUTOSWITCH = String(process.env.EXPECT_AUTOSWITCH || '') === '1';

async function waitForConnected(page, timeoutMs = 20000) {
  const start = Date.now();
  while ((Date.now() - start) < timeoutMs) {
    const text = await page.locator('text=Connection:').first().innerText().catch(() => '');
    if (/connected/i.test(text)) return true;
    await page.waitForTimeout(150);
  }
  return false;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];

  page.on('pageerror', err => errors.push(`pageerror: ${err.message}`));
  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() !== 'error') return;
    if (/favicon\.ico|net::ERR_CONNECTION_REFUSED|WebSocket connection to|404 \(File not found\)|status of 404 \(Not Found\)/i.test(text) && EXPECT_STATIC) return;
    errors.push(`console: ${text}`);
  });

  try {
    await page.goto(`${BASE_URL}/host.html`, { waitUntil: 'domcontentloaded', timeout: 25000 });

    if (EXPECT_STATIC) {
      if (EXPECT_AUTOSWITCH) {
        await page.waitForTimeout(1200);
        const switched = await page.waitForURL(/127\.0\.0\.1:8000\/host\.html/i, { timeout: 10000 }).then(() => true).catch(() => false);
        if (!switched) {
          errors.push('expected autoswitch to local backend URL, but URL did not switch to :8000 host page');
        } else {
          await page.getByRole('button', { name: 'Host Game' }).click();
          if (!await waitForConnected(page, 18000)) errors.push('host did not connect after autoswitch');
        }
      } else {
        const staticPortal = await page.locator('.portal-copy-row input[readonly]').first().inputValue().catch(() => '');
        if (/127\.0\.0\.1|localhost/i.test(staticPortal)) {
          errors.push(`static host should not expose localhost/127 join URL: "${staticPortal}"`);
        }
        await page.getByRole('button', { name: 'Host Game' }).click();
        await page.waitForTimeout(2200);
        const detail = await page.locator('.realtime-status-line').nth(1).innerText().catch(() => '');
        if (!/Could not start room service automatically|Room service not ready/i.test(detail)) {
          errors.push(`static host diagnosis missing. got: "${detail}"`);
        }
        const launcherButton = page.getByRole('link', { name: /download room service starter/i }).first();
        if (!await launcherButton.isVisible().catch(() => false)) {
          errors.push('static host error state is missing room-service starter download link');
        } else {
          const href = await launcherButton.getAttribute('href');
          if (!/start_room_service\.(command|bat)$/i.test(String(href || ''))) {
            errors.push(`room-service starter link should target starter script, got "${href}"`);
          }
        }
      }
    } else {
      const response = await page.evaluate(async () => {
        const r = await fetch('/api/network-info', { cache: 'no-store' });
        return { ok: r.ok, payload: await r.json() };
      });
      if (!response.ok) errors.push('backend network-info endpoint is not reachable');
      const preferred = String(response.payload?.preferredPortalUrl || '');
      if (!/^https?:\/\//i.test(preferred)) {
        errors.push(`preferredPortalUrl is not absolute: "${preferred}"`);
      }

      await page.getByRole('button', { name: 'Host Game' }).click();
      if (!await waitForConnected(page)) errors.push('host did not connect in backend mode');

      const joinPortal = await page.locator('.portal-copy-row input[readonly]').first().inputValue().catch(() => '');
      if (!joinPortal) errors.push('join portal URL input missing');
      if (/join\.html/i.test(joinPortal)) errors.push(`join portal should not contain join.html: ${joinPortal}`);
      if (/127\.0\.0\.1|localhost/i.test(joinPortal)) errors.push(`join portal should not use localhost/127 for multiplayer: ${joinPortal}`);
      if (preferred && joinPortal !== preferred) {
        errors.push(`join portal does not match preferredPortalUrl (${joinPortal} vs ${preferred})`);
      }
      if (!/^https?:\/\//i.test(joinPortal)) errors.push(`join portal is not absolute: ${joinPortal}`);

      const hostBtnClass = await page.locator('button:has-text("Host Game")').first().getAttribute('class').catch(() => '');
      const disconnectBtnClass = await page.locator('button:has-text("Disconnect")').first().getAttribute('class').catch(() => '');
      if (!/\bbtn-lg\b/.test(hostBtnClass || '')) errors.push('Host Game button is not visually promoted (missing btn-lg)');
      if (!/\bbtn-lg\b/.test(disconnectBtnClass || '')) errors.push('Disconnect button is not visually promoted (missing btn-lg)');

      const qrCopyButtonCount = await page.locator('#copyQrBtn').count();
      if (qrCopyButtonCount > 0) errors.push('QR copy button should be removed');
      const qrTouch = page.locator('.qr-touch-copy').first();
      if (!await qrTouch.isVisible().catch(() => false)) {
        errors.push('QR touch-copy element is missing');
      } else {
        const title = await qrTouch.getAttribute('title');
        if (title !== 'Click to copy') errors.push(`QR tooltip should be "Click to copy", got "${title}"`);
      }
      const qrImageTagCount = await page.locator('.qr-copy-wrap img').count();
      if (qrImageTagCount > 0) errors.push('QR should not be rendered as draggable <img>');

      await page.getByRole('button', { name: '⚙️' }).first().click();
      const networkingHeaderVisible = await page.getByText('Networking (multi-device)').isVisible().catch(() => false);
      if (!networkingHeaderVisible) errors.push('Networking settings section missing');
      const lanButton = page.getByRole('button', { name: 'LAN Host URL' }).first();
      const sameButton = page.getByRole('button', { name: 'Same URL' }).first();
      const customButton = page.getByRole('button', { name: 'Custom' }).first();
      if (!await lanButton.isVisible().catch(() => false)) errors.push('LAN Host URL mode button missing');
      if (!await sameButton.isVisible().catch(() => false)) errors.push('Same URL mode button missing');
      if (!await customButton.isVisible().catch(() => false)) errors.push('Custom mode button missing');

      const backendNote = await page.locator('.settings-row .footnote').first().innerText().catch(() => '');
      if (!/Backend detected|Backend API not detected/i.test(backendNote)) {
        errors.push(`networking status note missing backend detection text: "${backendNote}"`);
      }

      const soloPage = await context.newPage();
      await soloPage.goto(`${BASE_URL}/solo.html`, { waitUntil: 'domcontentloaded', timeout: 25000 });
      await soloPage.getByRole('button', { name: '⚙️' }).first().click();
      const humanNarratorVisible = await soloPage.getByRole('button', { name: 'Human' }).isVisible().catch(() => false);
      if (humanNarratorVisible) {
        errors.push('Solo settings should not expose Human narrator mode');
      }
      const soloSettingsText = await soloPage.locator('.modal-content').innerText().catch(() => '');
      if (!/Solo mode uses Auto narrator only\./i.test(soloSettingsText)) {
        errors.push('Solo settings narrator restriction note missing');
      }
      await soloPage.close();
    }
  } catch (error) {
    errors.push(`fatal: ${error.message}`);
  } finally {
    await context.close();
    await browser.close();
  }

  if (errors.length > 0) {
    console.error('[network-overhaul] FAIL');
    errors.forEach(item => console.error(item));
    process.exitCode = 1;
    return;
  }
  console.log('[network-overhaul] PASS');
}

main();
