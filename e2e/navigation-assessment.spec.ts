import { expect, test } from '@playwright/test';
import {
  attemptAddress,
  clickBack,
  clickForward,
  closeHistory,
  expectNotFound,
  expectPageAddress,
  expectValidationMessage,
  followLink,
  followLinkToNotFound,
  goToAddress,
  openBrowser,
  openHistory,
  selectPerson,
  siteFrame,
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

test('5. ghostport.zz shows not-found, stays in address bar, and records typed visit', async ({
  page,
}) => {
  await goToAddress(page, 'ghostport.zz');
  await expectNotFound(page, 'ghostport.zz');
  await expect(page.locator('#browser-address')).toHaveValue('ghostport.zz');

  await openHistory(page);
  const history = page.getByTestId('history-list');
  await expect(history).toContainText('ghostport.zz');
  await expect(history).toContainText(/via typed/i);
  await expect(history).toContainText(/not found/i);
  await closeHistory(page);
});

test('6-9. Invalid addresses are rejected without navigation or visits', async ({
  page,
}) => {
  await goToAddress(page, 'tidepool.zz');
  await expectPageAddress(page, 'tidepool.zz');

  const rejected = [
    {
      address: 'https://google.com',
      message: /must not include a scheme/i,
    },
    {
      address: 'tidepool.zz/about',
      message: /must not include a path/i,
    },
    {
      address: 'example.com',
      message: /single valid \.zz address/i,
    },
    { address: 'tide_pool.zz', message: /single valid \.zz address/i },
    { address: '-tidepool.zz', message: /single valid \.zz address/i },
    { address: 'tidepool-.zz', message: /single valid \.zz address/i },
    { address: 'tide pool.zz', message: /must not include whitespace/i },
  ];

  for (const item of rejected) {
    await attemptAddress(page, item.address);
    await expectValidationMessage(page, item.message);
    await expect(page.getByTestId('site-viewport')).toBeVisible();
    await expect(
      siteFrame(page).getByRole('heading', { name: 'Tidepool Journal' }),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/$/);
  }

  await openHistory(page);
  const historyText = await page.getByTestId('history-list').innerText();
  expect(historyText).not.toContain('google.com');
  expect(historyText).not.toContain('example.com');
  expect(historyText).not.toContain('tide_pool.zz');
  expect(historyText).not.toContain('tidepool.zz/about');
  await closeHistory(page);
});

test('10. Following a valid in-app link records via: link', async ({ page }) => {
  await goToAddress(page, 'tidepool.zz');
  await followLink(page, 'Night Train Notes', 'nighttrain.zz');
  await expect(
    siteFrame(page).getByRole('heading', { name: 'Night Train Notes' }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/$/);

  await openHistory(page);
  await expect(page.getByTestId('history-list')).toContainText(/via link/i);
  await expect(page.getByTestId('history-list')).toContainText('nighttrain.zz');
  await closeHistory(page);
});

test('11. Four-deep trail enables Back and leaves Forward disabled', async ({
  page,
}) => {
  await goToAddress(page, 'tidepool.zz');
  await expect(page.getByRole('button', { name: /Back/i })).toBeDisabled();
  await expect(page.getByRole('button', { name: /Forward/i })).toBeDisabled();

  await followLink(page, 'Night Train Notes', 'nighttrain.zz');
  await followLink(page, 'Paper Kite Studio', 'paperkite.zz');
  await followLink(page, 'Observatory Annex', 'observatory.zz');
  await followLink(page, 'Moss Library', 'moss-library.zz');

  await expect(page.getByRole('button', { name: /Back/i })).toBeEnabled();
  await expect(page.getByRole('button', { name: /Forward/i })).toBeDisabled();
});

test('12. Broken internal link shows not-found via link and Back restores page', async ({
  page,
}) => {
  await goToAddress(page, 'tidepool.zz');
  await followLink(page, 'Night Train Notes', 'nighttrain.zz');
  await followLinkToNotFound(page, 'Ghostport (missing)', 'ghostport.zz');

  await expectNotFound(page, 'ghostport.zz');
  await expect(page).toHaveURL(/\/$/);

  await openHistory(page);
  const history = page.getByTestId('history-list');
  await expect(history).toContainText('ghostport.zz');
  await expect(history).toContainText(/via link/i);
  await expect(history).toContainText(/not found/i);
  await closeHistory(page);

  await clickBack(page);
  await expectPageAddress(page, 'nighttrain.zz');
});

test('13. Circular revisits are not deduplicated', async ({ page }) => {
  await selectPerson(page, 'Jon Bell');
  await goToAddress(page, 'tidepool.zz');
  await goToAddress(page, 'kettleclub.zz');
  await followLink(page, 'Tidepool Journal', 'tidepool.zz');

  await openHistory(page);
  const tidepoolRows = page
    .getByTestId('history-list')
    .locator('li')
    .filter({ hasText: 'tidepool.zz' });
  // Seed may already include tidepool visits; circular nav must add another.
  await expect
    .poll(async () => tidepoolRows.count())
    .toBeGreaterThanOrEqual(2);
  await closeHistory(page);
});

test('14-16. Back and Forward restore snapshots without refetching', async ({
  page,
}) => {
  let siteFetches = 0;
  page.on('request', (request) => {
    if (
      request.method() === 'GET' &&
      /\/api\/sites\/[^/?]+$/.test(request.url())
    ) {
      siteFetches += 1;
    }
  });

  await goToAddress(page, 'tidepool.zz');
  await goToAddress(page, 'nighttrain.zz');
  await goToAddress(page, 'paperkite.zz');
  const afterForwardNav = siteFetches;

  await clickBack(page);
  await expectPageAddress(page, 'nighttrain.zz');
  await expect(page.getByRole('button', { name: /Back/i })).toBeEnabled();
  await expect(page.getByRole('button', { name: /Forward/i })).toBeEnabled();
  expect(siteFetches).toBe(afterForwardNav);

  await clickBack(page);
  await expectPageAddress(page, 'tidepool.zz');
  await expect(page.getByRole('button', { name: /Back/i })).toBeDisabled();
  await expect(page.getByRole('button', { name: /Forward/i })).toBeEnabled();
  expect(siteFetches).toBe(afterForwardNav);

  await clickForward(page);
  await expectPageAddress(page, 'nighttrain.zz');
  await expect(page.getByRole('button', { name: /Back/i })).toBeEnabled();
  await expect(page.getByRole('button', { name: /Forward/i })).toBeEnabled();

  await clickForward(page);
  await expectPageAddress(page, 'paperkite.zz');
  await expect(page.getByRole('button', { name: /Forward/i })).toBeDisabled();
  expect(siteFetches).toBe(afterForwardNav);
});

test('17. Navigating after Back drops forward stack but keeps visit history', async ({
  page,
}) => {
  await goToAddress(page, 'tidepool.zz');
  await goToAddress(page, 'nighttrain.zz');
  await goToAddress(page, 'paperkite.zz');

  await clickBack(page);
  await expectPageAddress(page, 'nighttrain.zz');
  await goToAddress(page, 'kettleclub.zz');

  await expect(page.getByRole('button', { name: /Forward/i })).toBeDisabled();
  await page.getByRole('button', { name: /Forward/i }).click({ force: true });
  await expectPageAddress(page, 'kettleclub.zz');

  await openHistory(page);
  const history = page.getByTestId('history-list');
  await expect(history).toContainText('paperkite.zz');
  await expect(history).toContainText('kettleclub.zz');
  await closeHistory(page);
});
