import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('main page and planner meet automated WCAG 2.1 AA checks', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  const audit = () =>
    new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  const home = await audit();
  expect(
    home.violations.map((item) => ({
      id: item.id,
      description: item.description,
      nodes: item.nodes.map((node) => ({ target: node.target, failure: node.failureSummary })),
    })),
  ).toEqual([]);
  await page.locator('.route-card').first().click();
  await page.getByRole('button', { name: 'Make this my adventure' }).click();
  const planner = await audit();
  expect(
    planner.violations.map((item) => ({
      id: item.id,
      nodes: item.nodes.map((node) => ({ target: node.target, failure: node.failureSummary })),
    })),
  ).toEqual([]);
});
