import { expect, test } from '@playwright/test';
import {
  MALICIOUS_HTML,
  clickBack,
  clickForward,
  closeHistory,
  expectNotFound,
  expectPageAddress,
  followLink,
  goToAddress,
  openBrowser,
  openHistory,
  publishSite,
  runSearch,
  selectPerson,
  siteContentFrame,
  siteFrame,
  uniqueAddress,
  waitUntilIdle,
} from './helpers';

test.describe.configure({ mode: 'serial' });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      window.localStorage.clear();
    } catch {
      // ignore
    }
  });
  await openBrowser(page);
  await selectPerson(page, 'Ada Mercer');
});

test('1. Select Ada and type tidepool.zz', async ({ page }) => {
  await goToAddress(page, 'tidepool.zz');
  await expectPageAddress(page, 'tidepool.zz');
  await expect(
    siteFrame(page).getByRole('heading', { name: 'Tidepool Journal' }),
  ).toBeVisible();
});

test('2. Follow a four-deep link trail', async ({ page }) => {
  await goToAddress(page, 'tidepool.zz');
  await followLink(page, 'Night Train Notes', 'nighttrain.zz');
  await followLink(page, 'Paper Kite Studio', 'paperkite.zz');
  await followLink(page, 'Observatory Annex', 'observatory.zz');
  await followLink(page, 'Moss Library', 'moss-library.zz');
  await expect(
    siteFrame(page).getByRole('heading', { name: 'Moss Library' }),
  ).toBeVisible();
});

test('3. Back twice and forward once', async ({ page }) => {
  await goToAddress(page, 'tidepool.zz');
  await followLink(page, 'Night Train Notes', 'nighttrain.zz');
  await followLink(page, 'Paper Kite Studio', 'paperkite.zz');

  await clickBack(page);
  await expectPageAddress(page, 'nighttrain.zz');
  await clickBack(page);
  await expectPageAddress(page, 'tidepool.zz');
  await clickForward(page);
  await expectPageAddress(page, 'nighttrain.zz');
});

test('4. Go back, navigate elsewhere, and confirm Forward is disabled', async ({
  page,
}) => {
  await goToAddress(page, 'tidepool.zz');
  await followLink(page, 'Night Train Notes', 'nighttrain.zz');
  await followLink(page, 'Paper Kite Studio', 'paperkite.zz');

  await clickBack(page);
  await expectPageAddress(page, 'nighttrain.zz');
  await expect(page.getByRole('button', { name: /Forward/i })).toBeEnabled();

  await goToAddress(page, 'kettleclub.zz');
  await expectPageAddress(page, 'kettleclub.zz');
  await expect(page.getByRole('button', { name: /Forward/i })).toBeDisabled();
});

test('5. Scroll a page, leave it, go Back, and confirm scroll restoration', async ({
  page,
}) => {
  const address = uniqueAddress('scroll');
  const lines = Array.from(
    { length: 80 },
    (_, index) => `<p>Scroll line ${index + 1} for restoration coverage.</p>`,
  ).join('\n');
  const tallHtml = `<h1>Tall page</h1>
${lines}
<p>Bottom of the tall page</p>`;

  await publishSite(page, {
    address,
    title: 'Tall Scroll Page',
    html: tallHtml,
  });

  let site = await siteContentFrame(page);
  await expect(site.getByText('Bottom of the tall page')).toBeVisible();
  await site.evaluate(() => {
    window.scrollTo(0, 900);
  });

  await expect
    .poll(async () => site.evaluate(() => window.scrollY || window.pageYOffset || 0))
    .toBeGreaterThanOrEqual(800);

  // Allow the iframe bridge (100ms debounce) to persist scrollY on the parent entry.
  await page.waitForTimeout(300);

  await goToAddress(page, 'tidepool.zz');
  await expectPageAddress(page, 'tidepool.zz');

  await clickBack(page);
  await expectPageAddress(page, address);

  site = await siteContentFrame(page);
  await expect
    .poll(async () => site.evaluate(() => window.scrollY || window.pageYOffset || 0), {
      timeout: 10_000,
    })
    .toBeGreaterThanOrEqual(800);
});

test('6. Search for a phrase appearing only in body text', async ({ page }) => {
  await runSearch(page, 'glass float');
  await expect(page.getByTestId('search-result-count')).toContainText(/result/);
  await expect(page.getByTestId('search-result-tidepool.zz')).toBeVisible();
  await expect(page.getByTestId('search-results')).toContainText('Tidepool Journal');
});

test('7. Open a search result and Back to the same result set', async ({ page }) => {
  await runSearch(page, 'glass float');
  await page.getByTestId('search-result-tidepool.zz').click();
  await waitUntilIdle(page);
  await expectPageAddress(page, 'tidepool.zz');

  await clickBack(page);
  await expect(page.locator('#browser-address')).toHaveValue('');
  await expect(page.getByRole('heading', { name: /Results for/ })).toBeVisible();
  await expect(page.getByTestId('search-result-tidepool.zz')).toBeVisible();
  await expect(page.getByTestId('search-result-count')).toBeVisible();
});

test('8. Publish a new page and navigate to it', async ({ page }) => {
  const address = uniqueAddress('publish');
  await publishSite(page, {
    address,
    title: 'E2E Published Page',
    html: `<h1>E2E Published Page</h1><p>Hello from the assessment suite.</p><p><a href="tidepool.zz">Tidepool</a></p>`,
  });
  await expect(
    siteFrame(page).getByRole('heading', { name: 'E2E Published Page' }),
  ).toBeVisible();
  await expect(siteFrame(page).getByText('Hello from the assessment suite.')).toBeVisible();
});

test('9. Open ghostport.zz and show the not-found state', async ({ page }) => {
  await goToAddress(page, 'ghostport.zz');
  await expectNotFound(page, 'ghostport.zz');
});

test('10. Confirm the not-found attempt appears in history', async ({ page }) => {
  await goToAddress(page, 'ghostport.zz');
  await expectNotFound(page, 'ghostport.zz');

  await openHistory(page);
  const history = page.getByTestId('history-list');
  await expect(history).toContainText('ghostport.zz');
  await expect(history).toContainText(/not found/i);
  await closeHistory(page);
});

test('11. Switch people and confirm histories are separate', async ({ page }) => {
  const marker = uniqueAddress('ada-only');
  await goToAddress(page, marker);
  await expectNotFound(page, marker);

  await openHistory(page);
  await expect(page.getByTestId('history-list')).toContainText(marker);
  await closeHistory(page);

  await selectPerson(page, 'Jon Bell');
  await openHistory(page);
  await expect(page.getByTestId('history-list')).not.toContainText(marker);
  await closeHistory(page);

  await selectPerson(page, 'Ada Mercer');
  await openHistory(page);
  await expect(page.getByTestId('history-list')).toContainText(marker);
  await closeHistory(page);
});

test('12. Publish malicious fixture and confirm sandbox protections', async ({
  page,
}) => {
  const address = uniqueAddress('malicious');
  const parentMarker = `parent-marker-${Date.now()}`;

  await page.evaluate((marker) => {
    const el = document.createElement('div');
    el.id = marker;
    el.textContent = 'parent-safe';
    document.body.appendChild(el);
    (window as unknown as { __e2eParentIntact?: boolean }).__e2eParentIntact =
      true;
  }, parentMarker);

  const blockedRequests: string[] = [];
  page.on('request', (request) => {
    const url = request.url();
    if (url.includes('evil.example')) {
      blockedRequests.push(url);
    }
  });

  const dialogs: string[] = [];
  page.on('dialog', async (dialog) => {
    dialogs.push(dialog.message());
    await dialog.dismiss();
  });

  await publishSite(page, {
    address,
    title: 'Malicious Fixture',
    html: MALICIOUS_HTML,
  });

  await expect(siteFrame(page).getByRole('heading', { name: 'Welcome' })).toBeVisible();
  await expect(
    siteFrame(page).getByText('Visible content for search indexing.'),
  ).toBeVisible();

  // Sanitized output must not retain executable or external payloads.
  const frameHtml = await page
    .locator('[data-testid="site-viewport"]')
    .evaluate((iframe: HTMLIFrameElement) => iframe.srcdoc || '');
  expect(frameHtml).not.toMatch(/<script(?![^>]*nonce=)/i);
  expect(frameHtml.toLowerCase()).not.toContain('onclick');
  expect(frameHtml.toLowerCase()).not.toContain('onerror');
  expect(frameHtml).not.toContain('javascript:');
  expect(frameHtml).not.toContain('https://evil.example');
  expect(frameHtml).toContain('friend.zz');

  await siteFrame(page).getByText('Hover me').hover({ force: true });
  await siteFrame(page).getByRole('heading', { name: 'Welcome' }).click();
  const badLink = siteFrame(page).getByText('Bad link');
  if (await badLink.count()) {
    await badLink.click({ force: true });
  }
  const external = siteFrame(page).getByText('External');
  if (await external.count()) {
    await external.click({ force: true });
  }

  await expect(page.locator('#browser-address')).toHaveValue(address);
  await expect(page.locator(`#${parentMarker}`)).toHaveText('parent-safe');
  expect(
    await page.evaluate(
      () => (window as unknown as { __e2eParentIntact?: boolean }).__e2eParentIntact,
    ),
  ).toBe(true);
  expect(dialogs).toEqual([]);
  expect(blockedRequests).toEqual([]);
});

test('responsive chrome remains usable at 390, 768, and 1440', async ({ page }) => {
  for (const width of [390, 768, 1440] as const) {
    await page.setViewportSize({ width, height: 844 });
    await expect(page.getByTestId('browser-app')).toBeVisible();
    await expect(page.locator('#browser-address')).toBeVisible();
    await expect(page.locator('#person-selector')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Go', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Search' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'History' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Publish' })).toBeVisible();
  }
});
