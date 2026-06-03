#!/usr/bin/env node

const { chromium } = require('playwright');

const BASE_URL = process.env.MAFIA_BASE_URL || 'http://localhost:8000';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForConnected(page, timeoutMs = 15000) {
  const start = Date.now();
  while ((Date.now() - start) < timeoutMs) {
    const text = await page.locator('text=Connection:').first().innerText().catch(() => '');
    if (/connected/i.test(text)) return true;
    await page.waitForTimeout(200);
  }
  return false;
}

async function waitForJoinError(page, timeoutMs = 15000) {
  const start = Date.now();
  while ((Date.now() - start) < timeoutMs) {
    const detail = await page.locator('.card .footnote').last().innerText().catch(() => '');
    const connection = await page.locator('.card .footnote').first().innerText().catch(() => '');
    if (/room code not found/i.test(detail)) {
      return { detail, connection };
    }
    await page.waitForTimeout(200);
  }
  return null;
}

async function waitForJoinLobby(page, timeoutMs = 15000) {
  const start = Date.now();
  while ((Date.now() - start) < timeoutMs) {
    const selectedSettingVisible = await page.getByText('Selected Setting').first().isVisible().catch(() => false);
    if (selectedSettingVisible) return true;
    const detail = await page.locator('.card .footnote').last().innerText().catch(() => '');
    if (/room code not found|could not join|could not reach|room is not ready/i.test(detail)) {
      return false;
    }
    await page.waitForTimeout(200);
  }
  return false;
}

async function readRoomCodeFromHost(page) {
  const rows = page.locator('.realtime-row');
  const count = await rows.count();
  for (let i = 0; i < count; i++) {
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
  const joinContext = await browser.newContext();
  const host = await hostContext.newPage();
  const join = await joinContext.newPage();
  const errors = [];

  host.on('console', msg => {
    if (msg.type() === 'error') errors.push(`host console: ${msg.text()}`);
  });
  join.on('console', msg => {
    if (msg.type() === 'error') errors.push(`join console: ${msg.text()}`);
  });
  host.on('pageerror', err => errors.push(`host pageerror: ${err.message}`));
  join.on('pageerror', err => errors.push(`join pageerror: ${err.message}`));

  try {
    await host.goto(`${BASE_URL}/host.html`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await host.getByRole('button', { name: 'Host Game' }).click();
    if (!await waitForConnected(host)) errors.push('host failed to connect');
    const roomCode = await readRoomCodeFromHost(host);
    if (!roomCode) errors.push('failed to read host room code');
    const joinPortalValue = await host.locator('.portal-copy-row input[readonly]').first().inputValue().catch(() => '');
    if (/join\.html/i.test(joinPortalValue)) {
      errors.push(`join portal URL still includes join.html (${joinPortalValue})`);
    }

    await join.goto(`${BASE_URL}/join.html`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await join.waitForSelector('#joinCodeInput', { timeout: 8000 }).catch(() => {});

    if (await join.getByRole('button', { name: 'Host Game' }).isVisible().catch(() => false)) {
      errors.push('join page exposed Host Game button');
    }

    const joinInput = join.locator('#joinCodeInput').first();
    const hasJoinInput = await joinInput.isVisible().catch(() => false);
    if (!hasJoinInput) {
      errors.push('join code input not visible on join entry');
    } else {
      await joinInput.click();
      await join.keyboard.type('A');
      await sleep(40);
      const focusedIdA = await join.evaluate(() => document.activeElement?.id || '');
      if (focusedIdA !== 'joinCodeInput') errors.push(`focus dropped after first key (${focusedIdA || 'none'})`);
      await join.keyboard.type('B');
      await sleep(40);
      const focusedIdB = await join.evaluate(() => document.activeElement?.id || '');
      if (focusedIdB !== 'joinCodeInput') errors.push(`focus dropped after second key (${focusedIdB || 'none'})`);
    }

    if (hasJoinInput) {
      await joinInput.fill('ZZZZZZ');
      await join.getByRole('button', { name: 'Join Game' }).click();
      const invalidResult = await waitForJoinError(join, 16000);
      const statusDetail = invalidResult?.detail || '';
      if (!invalidResult || !/room code not found/i.test(statusDetail)) {
        errors.push(`invalid code did not show room-not-found error: "${statusDetail || 'missing status'}"`);
      }
      const statusLine = invalidResult?.connection || '';
      if (/connected/i.test(statusLine)) {
        errors.push('invalid code incorrectly reported connected');
      }
      if (await join.locator('.host-device-banner').isVisible().catch(() => false)) {
        errors.push('join page showed host device banner after invalid code');
      }

      await joinInput.fill(roomCode);
      await join.getByRole('button', { name: 'Join Game' }).click();
      const joinedLobby = await waitForJoinLobby(join, 18000);
      if (!joinedLobby) errors.push('join page failed to enter lobby with valid room code');
      await join.waitForURL(/join\.html/, { timeout: 8000 });
    }

    const lobbyJoinInputVisible = await join.locator('#joinCodeInput').first().isVisible().catch(() => false);
    if (lobbyJoinInputVisible) {
      errors.push('join code input should be hidden after successful join');
    }

    if (await join.getByRole('button', { name: 'Single-device' }).isVisible().catch(() => false)) {
      errors.push('join lobby exposed Single-device toggle');
    }
    if (await join.getByRole('button', { name: 'Multi-device' }).isVisible().catch(() => false)) {
      errors.push('join lobby exposed Multi-device toggle');
    }
    if (await join.getByRole('button', { name: 'Host Game' }).isVisible().catch(() => false)) {
      errors.push('join lobby exposed Host Game control');
    }
    if (await join.getByText('This page is locked to multi-device mode.').isVisible().catch(() => false)) {
      errors.push('legacy locked-mode text still visible');
    }
    if (await join.getByText('Hover to see the underline.').isVisible().catch(() => false)) {
      errors.push('legacy hover helper text still visible');
    }

    const setupHeading = await join.getByText('Selected Setting').isVisible().catch(() => false);
    if (!setupHeading) errors.push('join lobby missing Selected Setting read-only card');
    const disturbanceLine = await join.getByText('Disturbance range:').first().isVisible().catch(() => false);
    if (!disturbanceLine) errors.push('join lobby missing disturbance rule details');

    const storyCardCount = await join.locator('.story-card').count();
    if (storyCardCount > 0) errors.push('join lobby still shows selectable story cards');
    const roleAdjustCount = await join.locator('button.btn-adjust').count();
    if (roleAdjustCount > 0) errors.push('join lobby still shows role +/- controls');
    if (await join.getByRole('button', { name: 'Start Game' }).isVisible().catch(() => false)) {
      errors.push('join lobby exposed Start Game button');
    }

    await join.fill('#newPlayerInput', 'Join Tester');
    await join.press('#newPlayerInput', 'Enter');
    await join.waitForTimeout(120);
    const dragHandlesDevice = await join.locator('.card:has(.section-label:has-text("📱 Your Device")) .drag-handle').count();
    if (dragHandlesDevice === 0) errors.push('no drag handle shown in Your Device section');
    const dragHandlesGrouped = await join.locator('.card:has(.section-label:has-text("🧩 Devices and Players")) .drag-handle').count();
    if (dragHandlesGrouped > 0) errors.push('drag handles still shown in Devices and Players section');

    const pageText = await join.locator('body').innerText();
    if (/loud strikes/i.test(pageText)) {
      errors.push('preset text still references loud strikes');
    }
  } catch (error) {
    errors.push(`fatal: ${error.message}`);
  } finally {
    await hostContext.close();
    await joinContext.close();
    await browser.close();
  }

  if (errors.length > 0) {
    console.error('[join-guardrails] FAIL');
    errors.forEach(line => console.error(line));
    process.exitCode = 1;
    return;
  }
  console.log('[join-guardrails] PASS');
}

main();
