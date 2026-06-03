#!/usr/bin/env node

const { chromium } = require('playwright');

const BASE_URL = process.env.MAFIA_BASE_URL || 'http://127.0.0.1:8000';

async function waitForConnected(page, timeoutMs = 20000) {
  const start = Date.now();
  while ((Date.now() - start) < timeoutMs) {
    const status = await page.locator('text=Connection:').first().innerText().catch(() => '');
    if (/connected/i.test(status)) return true;
    await page.waitForTimeout(120);
  }
  return false;
}

async function readRoomCode(page) {
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

async function main() {
  const browser = await chromium.launch({ headless: true });
  const hostContext = await browser.newContext();
  const joinContextA = await browser.newContext();
  const joinContextB = await browser.newContext();
  const host = await hostContext.newPage();
  const joinA = await joinContextA.newPage();
  const joinB = await joinContextB.newPage();
  const errors = [];

  try {
    await host.goto(`${BASE_URL}/host.html`, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await host.getByRole('button', { name: 'Host Game' }).click();
    if (!await waitForConnected(host)) errors.push('host did not connect');
    const roomCode = await readRoomCode(host);
    if (!roomCode) errors.push('could not read room code');

    await joinA.goto(`${BASE_URL}/join.html`, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await joinA.fill('#joinCodeInput', roomCode);
    await joinA.getByRole('button', { name: 'Join Game' }).click();
    if (!await waitForConnected(joinA)) errors.push('joiner A did not connect');

    await joinB.goto(`${BASE_URL}/join.html`, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await joinB.fill('#joinCodeInput', roomCode);
    await joinB.getByRole('button', { name: 'Join Game' }).click();
    if (!await waitForConnected(joinB)) errors.push('joiner B did not connect');

    await host.waitForTimeout(500);
    const deviceText = await host.locator('.card:has(.section-label:has-text("🧩 Devices and Players"))').innerText().catch(() => '');
    if (!/Device 1/i.test(deviceText)) errors.push('Device 1 label missing');
    if (!/Device 2/i.test(deviceText)) errors.push('Device 2 label missing');
    if (!/Device 3/i.test(deviceText)) errors.push('Device 3 label missing');
  } catch (error) {
    errors.push(`fatal: ${error.message}`);
  } finally {
    await hostContext.close();
    await joinContextA.close();
    await joinContextB.close();
    await browser.close();
  }

  if (errors.length > 0) {
    console.error('[device-sequence] FAIL');
    errors.forEach(item => console.error(item));
    process.exitCode = 1;
    return;
  }
  console.log('[device-sequence] PASS');
}

main();
