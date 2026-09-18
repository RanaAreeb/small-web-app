import { expect, type FrameLocator, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const MALICIOUS_HTML = readFileSync(
  resolve(__dirname, '../apps/api/src/sites/fixtures/malicious.html'),
  'utf8',
);

export async function openBrowser(page: Page) {
  await page.goto('/');
  await expect(page.getByTestId('browser-app')).toHaveAttribute(
    'data-ready',
    'true',
    { timeout: 60_000 },
  );
  await expect(page.getByTestId('browser-preparing')).toHaveCount(0);
  await expect(page.locator('#person-selector')).toBeEnabled();
}

export async function selectPerson(page: Page, name: string) {
  await page.locator('#person-selector').selectOption({ label: name });
  await expect(page.locator('#person-selector')).toContainText(name);
}

export async function waitUntilIdle(page: Page) {
  await expect(page.getByText('Loading', { exact: true })).toHaveCount(0, {
    timeout: 30_000,
  });
}

export async function goToAddress(page: Page, address: string) {
  await page.locator('#browser-address').fill(address);
  await page.getByRole('button', { name: 'Go', exact: true }).click();
  await expect(page.locator('#browser-address')).toHaveValue(address, {
    timeout: 30_000,
  });
  await waitUntilIdle(page);
}

export async function expectPageAddress(page: Page, address: string) {
  await expect(page.locator('#browser-address')).toHaveValue(address, {
    timeout: 30_000,
  });
  await expect(page.getByTestId('site-viewport')).toBeVisible();
  // Ensure the sandboxed document (and bridge) finished loading.
  await expect(siteFrame(page).locator('h1')).toBeVisible({ timeout: 15_000 });
}

export async function expectNotFound(page: Page, address: string) {
  await expect(page.getByTestId('not-found-view')).toBeVisible();
  await expect(page.getByTestId('not-found-view')).toContainText(address);
}

export function siteFrame(page: Page): FrameLocator {
  return page.frameLocator('[data-testid="site-viewport"]');
}

/** Playwright Frame for the sandboxed srcDoc viewport (opaque origin). */
export async function siteContentFrame(page: Page) {
  await expect(page.getByTestId('site-viewport')).toBeVisible();
  const handle = await page.getByTestId('site-viewport').elementHandle();
  const frame = await handle?.contentFrame();
  if (!frame) {
    throw new Error('Site viewport frame is not available');
  }
  return frame;
}

export async function followLink(page: Page, linkName: string, nextAddress: string) {
  const frame = await siteContentFrame(page);
  const link = frame.getByRole('link', { name: linkName, exact: true });
  await expect(link).toBeVisible({ timeout: 15_000 });
  await link.click();
  await expect(page.locator('#browser-address')).toHaveValue(nextAddress, {
    timeout: 30_000,
  });
  await waitUntilIdle(page);
  await expectPageAddress(page, nextAddress);
}

export async function clickBack(page: Page) {
  await page.getByRole('button', { name: /Back/i }).click();
  await waitUntilIdle(page);
}

export async function clickForward(page: Page) {
  await page.getByRole('button', { name: /Forward/i }).click();
  await waitUntilIdle(page);
}

export async function openHistory(page: Page) {
  await page.getByRole('button', { name: 'History' }).click();
  await expect(page.getByRole('dialog', { name: 'Browsing history' })).toBeVisible();
  await expect(page.getByTestId('history-list')).toBeVisible();
}

export async function closeHistory(page: Page) {
  await page.getByRole('button', { name: 'Close history', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Browsing history' })).toHaveCount(0);
}

export async function publishSite(
  page: Page,
  input: { address: string; title: string; html: string },
) {
  await page.getByRole('button', { name: 'Publish' }).click();
  await expect(page.getByRole('dialog', { name: 'Publish' })).toBeVisible();
  await page.locator('#publish-address').fill(input.address);
  await page.locator('#publish-title').fill(input.title);
  await page.locator('#publish-html').fill(input.html);
  await page.getByRole('button', { name: 'Publish site' }).click();
  await waitUntilIdle(page);
  await expectPageAddress(page, input.address);
}

export async function runSearch(page: Page, query: string) {
  await page.getByRole('button', { name: 'Search' }).click();
  await page.locator('#site-search').fill(query);
  await page.getByRole('button', { name: 'Run search' }).click();
  await waitUntilIdle(page);
  await expect(page.getByRole('heading', { name: new RegExp(`Results for`) })).toBeVisible();
}

export function uniqueAddress(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e4)}.zz`;
}
