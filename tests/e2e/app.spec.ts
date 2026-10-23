import { test, expect } from '@playwright/test';

test.describe('Clinical Dataset Checker main flow', () => {
  test('home page loads with English as default language', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Clinical Dataset Checker' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Try Sample Dataset' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Check My File' })).toBeVisible();
  });

  test('sample dataset -> preview -> check -> results -> export (JSON)', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Try Sample Dataset' }).click();

    // Import page with configuration shown
    await expect(page.getByRole('heading', { name: 'Import Data' })).toBeVisible();
    await page.getByRole('button', { name: 'Preview Data' }).click();

    // Preview page
    await expect(page.getByRole('heading', { name: 'Data Preview' })).toBeVisible();
    await page.getByRole('button', { name: 'Start Quality Check' }).click();

    // Results page
    await expect(page.getByRole('heading', { name: 'Quality Check Results' })).toBeVisible();
    await page.getByRole('button', { name: 'Go to Export' }).click();

    // Export page — JSON download works
    await expect(page.getByRole('heading', { name: 'Export Results' })).toBeVisible();
    const downloadPromise = page.waitForEvent('download');
    await page
      .getByRole('heading', { name: 'JSON Data' })
      .locator('..')
      .getByRole('button', { name: 'Download' })
      .click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('dataset_check_report.json');
  });

  test('language switch to Chinese and back', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Switch language' }).click();
    await expect(page.getByRole('heading', { name: '临床数据集检查器' })).toBeVisible();
    await page.getByRole('button', { name: 'Switch language' }).click();
    await expect(page.getByRole('heading', { name: 'Clinical Dataset Checker' })).toBeVisible();
  });

  test('about and privacy pages are reachable from home', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'About', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'About' })).toBeVisible();
    await page.getByRole('button', { name: 'Back' }).click();
    await page.getByRole('button', { name: 'Privacy' }).click();
    await expect(page.getByRole('heading', { name: 'Privacy & Data Handling' })).toBeVisible();
  });

  test('no user data is sent to external servers during the full flow', async ({ page }) => {
    const externalRequests: string[] = [];
    page.on('request', (request) => {
      const url = request.url();
      if (
        !url.startsWith('http://localhost') &&
        !url.startsWith('data:') &&
        !url.startsWith('blob:')
      ) {
        externalRequests.push(url);
      }
    });

    await page.goto('/');
    await page.getByRole('button', { name: 'Try Sample Dataset' }).click();
    await page.getByRole('button', { name: 'Preview Data' }).click();
    await page.getByRole('button', { name: 'Start Quality Check' }).click();
    await page.getByRole('button', { name: 'Go to Export' }).click();

    expect(externalRequests).toEqual([]);
  });
});
