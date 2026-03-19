import { expect, test } from '@playwright/test';

test('landing page renders the hero heading', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('h1')).toContainText('Andrea');
});

test('menu navigation closes the menu and scrolls to the section', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/');

	await page.getByRole('button', { name: 'Toggle Menu' }).click();
	await expect(page.locator('.menu')).toBeVisible();

	await page.getByRole('link', { name: 'Experience' }).click();
	await page.waitForFunction(() => window.location.hash === '#experience');
	await page.waitForTimeout(500);

	const sectionTop = await page
		.locator('#experience')
		.evaluate((node) => Math.round(node.getBoundingClientRect().top));
	const htmlClasses = await page.evaluate(() => document.documentElement.className);

	expect(sectionTop).toBeLessThanOrEqual(32);
	expect(sectionTop).toBeGreaterThanOrEqual(-32);
	expect(htmlClasses).not.toContain('no-scroll');
	await expect(page.locator('.menu')).not.toBeVisible();
});
