#!/usr/bin/env node

const { chromium } = require('playwright');

const BASE_URL = process.env.MAFIA_BASE_URL || 'http://localhost:8000';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForConnected(page, timeoutMs = 20000) {
  const start = Date.now();
  while ((Date.now() - start) < timeoutMs) {
    const text = await page.locator('text=Connection:').first().innerText().catch(() => '');
    if (/connected/i.test(text)) return true;
    await page.waitForTimeout(150);
  }
  return false;
}

async function readRoomCodeFromHost(page) {
  const rows = page.locator('.realtime-row');
  const count = await rows.count();
  for (let i = 0; i < count; i += 1) {
    const row = rows.nth(i);
    const label = (await row.locator('label').first().innerText().catch(() => '')).trim().toLowerCase();
    if (label !== 'room code') continue;
    return (await row.locator('input[readonly]').first().inputValue().catch(() => '')).trim();
  }
  return '';
}

function isAbsoluteHttpUrl(value) {
  return /^https?:\/\/[^/]+/i.test(String(value || '').trim());
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const hostContext = await browser.newContext();
  const joinContext = await browser.newContext();
  const host = await hostContext.newPage();
  const join = await joinContext.newPage();
  const errors = [];

  host.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error' && !/ERR_NETWORK_CHANGED/i.test(text)) {
      errors.push(`host console: ${text}`);
    }
  });
  join.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error' && !/ERR_NETWORK_CHANGED/i.test(text)) {
      errors.push(`join console: ${text}`);
    }
  });
  host.on('pageerror', err => errors.push(`host pageerror: ${err.message}`));
  join.on('pageerror', err => errors.push(`join pageerror: ${err.message}`));

  try {
    await host.goto(`${BASE_URL}/host.html`, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await host.getByRole('button', { name: 'Host Game' }).click();
    if (!await waitForConnected(host)) errors.push('host failed to connect');

    const roomCode = await readRoomCodeFromHost(host);
    if (!roomCode) errors.push('failed to read room code from host');

    const joinPortal = await host.locator('.portal-copy-row input[readonly]').first().inputValue().catch(() => '');
    if (!isAbsoluteHttpUrl(joinPortal)) errors.push(`join portal URL is not absolute http(s): ${joinPortal}`);
    if (/join\.html/i.test(joinPortal)) errors.push(`join portal URL still includes join.html: ${joinPortal}`);

    const fastJoinInput = host.locator('.card:has(.section-label:has-text("Fast Join Link")) input[readonly]').first();
    const fastJoinUrl = await fastJoinInput.inputValue().catch(() => '');
    if (!isAbsoluteHttpUrl(fastJoinUrl)) errors.push(`fast join link is not absolute http(s): ${fastJoinUrl}`);
    if (!/\bjoin=/.test(fastJoinUrl)) errors.push(`fast join link missing join code query: ${fastJoinUrl}`);
    if (/join\.html/i.test(fastJoinUrl)) errors.push(`fast join link still contains join.html: ${fastJoinUrl}`);

    const networkInfo = await host.evaluate(async () => {
      const response = await fetch('/api/network-info', { cache: 'no-store' });
      return response.json();
    });
    if (networkInfo?.preferredPortalUrl && joinPortal !== networkInfo.preferredPortalUrl) {
      errors.push(`host join portal URL does not match API preferred URL (${joinPortal} vs ${networkInfo.preferredPortalUrl})`);
    }
    if (/localhost|127\.0\.0\.1/i.test(BASE_URL) && /localhost|127\.0\.0\.1/i.test(networkInfo?.preferredPortalUrl || '')) {
      errors.push(`preferred portal URL should favor LAN address on localhost runs, got ${networkInfo.preferredPortalUrl}`);
    }

    const advancedToggleVisible = await host.locator('details.share-advanced-links').isVisible().catch(() => false);
    if (!advancedToggleVisible) {
      errors.push('advanced link options are missing');
    } else {
      const altInputs = host.locator('details.share-advanced-links input[readonly]');
      const altUrls = [];
      const altCount = await altInputs.count();
      for (let i = 0; i < altCount; i += 1) {
        altUrls.push(await altInputs.nth(i).inputValue().catch(() => ''));
      }
      if (altUrls.length === 0) {
        errors.push('advanced link options visible but no alternate URLs listed');
      }
      altUrls.forEach((url) => {
        if (!isAbsoluteHttpUrl(url)) errors.push(`alternate URL is not absolute http(s): ${url}`);
      });
    }

    const presetDescriptions = await host.evaluate(() => ROLE_PRESETS.map(preset => String(preset.description || '')));
    presetDescriptions.forEach((description, index) => {
      if (!description.startsWith('Role targets:')) {
        errors.push(`preset description ${index + 1} is not literal role-target text: ${description}`);
      }
      if (/loud strikes|cinematic|chaos mode|blood moon ambience/i.test(description)) {
        errors.push(`preset description ${index + 1} still has thematic language: ${description}`);
      }
    });

    const readMetrics = async () => host.evaluate(() => {
      const method = KILL_METHODS.find(item => item.id === 'incendiary') || KILL_METHODS[0];
      const testLocationId = '__profile_check_location__';
      if (!Array.isArray(state.selectedStory.locations)) state.selectedStory.locations = [];
      if (!state.selectedStory.locations.some(location => location.id === testLocationId)) {
        state.selectedStory.locations.push({
          id: testLocationId,
          name: 'Profile Check',
          exposure: 0.52,
          actions: [{ id: 'profile_check_action', exposure: 0.58 }]
        });
      }
      const plan = {
        location: testLocationId,
        action: { id: 'profile_check_action', exposure: 0.58 }
      };
      const player = { role: 'villager' };
      return {
        profile: state.settings.environmentProfile,
        disturbance: getAdjustedDisturbance(method),
        cureDifficulty: getAdjustedCureDifficulty(method),
        exposure: getPlanExposure(player, plan)
      };
    });

    await host.locator('button:has-text("⚙️")').first().click();
    await host.getByRole('button', { name: 'Midnight Silence' }).click();
    await sleep(120);
    const stealthMetrics = await readMetrics();
    await host.getByRole('button', { name: 'Panic Spiral' }).click();
    await sleep(120);
    const chaoticMetrics = await readMetrics();
    await host.evaluate(() => {
      if (typeof window.hideSettings === 'function') window.hideSettings();
    });

    if (!(stealthMetrics.disturbance < chaoticMetrics.disturbance)) {
      errors.push(`settings profile did not change disturbance math as expected (${stealthMetrics.disturbance} vs ${chaoticMetrics.disturbance})`);
    }
    if (!(stealthMetrics.cureDifficulty < chaoticMetrics.cureDifficulty)) {
      errors.push(`settings profile did not change doctor difficulty math as expected (${stealthMetrics.cureDifficulty} vs ${chaoticMetrics.cureDifficulty})`);
    }
    if (!(stealthMetrics.exposure < chaoticMetrics.exposure)) {
      errors.push(`settings profile did not change exposure math as expected (${stealthMetrics.exposure} vs ${chaoticMetrics.exposure})`);
    }

    await join.goto(`${BASE_URL}/join.html`, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await join.fill('#joinCodeInput', roomCode);
    await join.getByRole('button', { name: 'Join Game' }).click();
    if (!await waitForConnected(join)) errors.push('join page failed to connect to host');

    const environmentLineVisible = await join.getByText('Environment profile:').first().isVisible().catch(() => false);
    if (!environmentLineVisible) {
      errors.push('join read-only setup is missing environment profile rules line');
    }
    const profileNameVisible = await join.getByText('Panic Spiral').first().isVisible().catch(() => false);
    if (!profileNameVisible) {
      errors.push('join read-only setup is not showing the host-selected environment profile');
    }
  } catch (error) {
    errors.push(`fatal: ${error.message}`);
  } finally {
    await hostContext.close();
    await joinContext.close();
    await browser.close();
  }

  if (errors.length > 0) {
    console.error('[active-todos] FAIL');
    errors.forEach(line => console.error(line));
    process.exitCode = 1;
    return;
  }

  console.log('[active-todos] PASS');
}

main();
