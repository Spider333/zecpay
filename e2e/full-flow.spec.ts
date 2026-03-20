import { test, expect } from '@playwright/test';

test.describe('ZecPay Full Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to start fresh
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('Landing page shows user guide', async ({ page }) => {
    await page.goto('/');

    // User guide section
    await expect(page.getByText('How it works')).toBeVisible();
    await expect(page.getByText('Upload a CSV')).toBeVisible();

    // 4 feature cards
    await expect(page.getByText('Employee Roster')).toBeVisible();
    await expect(page.getByText('Batch History')).toBeVisible();
    await expect(page.getByText('Scheduling')).toBeVisible();
    await expect(page.getByText('Local Encryption')).toBeVisible();
  });

  test('Full payroll flow — CSV to payment to history', async ({ page }) => {
    await page.goto('/');

    // Step 1: Unlock with password
    await page.locator('input[type="password"]').fill('test1234');
    await page.getByRole('button', { name: 'Start' }).click();

    // Step 2: Wait for upload screen, load sample CSV
    await expect(page.getByText('Load sample CSV (demo)')).toBeVisible({ timeout: 15_000 });
    await page.getByText('Load sample CSV (demo)').click();

    // Step 3: Preview screen — verify employees and rate
    await expect(page.getByText('Alice Johnson')).toBeVisible();
    await expect(page.getByText('Bob Smith')).toBeVisible();
    await expect(page.getByText('Carol Dev')).toBeVisible();
    await expect(page.getByText('Dave Ops')).toBeVisible();
    await expect(page.getByText('Eve Designer')).toBeVisible();
    // ZEC rate should be displayed
    await expect(page.locator('text=ZEC/USD')).toBeVisible();

    // Step 4: Save roster
    await page.getByText('+ Save these employees as your team').click();
    // After save, the "save" button should disappear
    await expect(page.getByText('+ Save these employees as your team')).toBeHidden();

    // Step 5: Skip tests, generate URI
    await page.getByText('Skip Tests & Generate URI').click();

    // Step 6: Payment screen — verify ZIP-321 URI and QR
    await expect(page.locator('text=ZIP-321 Ready')).toBeVisible();
    await expect(page.locator('svg').first()).toBeVisible(); // QR code SVG
    // URI starts with zcash:
    await expect(page.locator('.font-mono.text-amber-400.break-all')).toContainText('zcash:');

    // Step 7: Mark All paid
    await page.getByText('Mark All').click();
    await expect(page.getByText('All payments confirmed')).toBeVisible();

    // Step 8: Download Receipt button appears
    await expect(page.getByRole('button', { name: 'Download Receipt' })).toBeVisible();

    // Step 9: New Batch
    await page.getByRole('button', { name: 'New Batch' }).click();

    // Step 10: Upload screen — Use saved team button appears
    await expect(page.getByText(/Use saved team/)).toBeVisible();
    await page.getByText(/Use saved team/).click();

    // Step 11: Preview — same employees loaded from roster
    await expect(page.getByText('Alice Johnson')).toBeVisible();
    await expect(page.getByText('Eve Designer')).toBeVisible();
  });

  test('Batch history persists after lock/unlock', async ({ page }) => {
    await page.goto('/');

    // Unlock
    await page.locator('input[type="password"]').fill('test1234');
    await page.getByRole('button', { name: 'Start' }).click();

    // Load sample CSV
    await expect(page.getByText('Load sample CSV (demo)')).toBeVisible({ timeout: 15_000 });
    await page.getByText('Load sample CSV (demo)').click();

    // Skip to payment
    await expect(page.getByText('Skip Tests & Generate URI')).toBeVisible();
    await page.getByText('Skip Tests & Generate URI').click();

    // Mark all paid to create a history record
    await expect(page.getByText('Mark All')).toBeVisible();
    await page.getByText('Mark All').click();
    await expect(page.getByText('All payments confirmed')).toBeVisible();

    // Navigate to History via header
    await expect(page.getByText(/History \(1\)/)).toBeVisible();
    await page.getByText(/History \(1\)/).click();

    // Verify completed batch appears with employee count
    await expect(page.getByText('5 employees')).toBeVisible();

    // Lock
    await page.getByText('Lock').click();

    // Re-enter password and unlock
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await page.locator('input[type="password"]').fill('test1234');
    await page.getByRole('button', { name: 'Unlock' }).click();

    // History count should still show in header after unlock
    await expect(page.getByText(/History \(1\)/)).toBeVisible({ timeout: 15_000 });
  });
});
