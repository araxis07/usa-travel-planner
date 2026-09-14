import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { EMPTY_TRIP, type Trip } from '../../data/travel';
const user = {
  id: '11111111-1111-4111-8111-111111111111',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'traveler@example.test',
  created_at: '2026-09-10T00:00:00Z',
  app_metadata: { provider: 'email' },
  user_metadata: {},
};
const trip: Trip = {
  ...EMPTY_TRIP,
  name: 'Private road trip',
  checklist: [{ id: 'personal', label: 'Private booking reference', done: false }],
  stops: [
    {
      code: 'CA',
      days: 2,
      notes: 'Private hotel booking',
      activities: [
        {
          id: 'one',
          placeId: 'CA-0',
          day: 1,
          period: 'morning',
          title: 'San Francisco',
          minutes: 120,
          notes: 'Private activity note',
        },
      ],
    },
  ],
};
const token = '33333333-3333-4333-8333-333333333333';

test('account copy, revision conflict, explicit load, private-note-free sharing and revocation', async ({
  page,
  context,
}) => {
  let rows: unknown[] = [];
  let shares: { token: string; expires_at: string; payload: Trip }[] = [];
  let conflict = false;
  let lastPatch = '';
  let saved: Trip | undefined;
  await context.route('https://roam-test.supabase.co/**', async (route) => {
    const req = route.request(),
      url = new URL(req.url());
    let data: unknown = {};
    if (url.pathname === '/auth/v1/token')
      data = {
        access_token:
          'eyJhbGciOiJIUzI1NiJ9.' +
          Buffer.from(
            JSON.stringify({
              sub: user.id,
              role: 'authenticated',
              exp: Math.floor(Date.now() / 1000) + 3600,
            }),
          ).toString('base64url') +
          '.signature',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'mock-refresh',
        user,
      };
    else if (url.pathname === '/auth/v1/user') data = user;
    else if (url.pathname === '/auth/v1/logout') {
      await route.fulfill({ status: 204 });
      return;
    } else if (url.pathname === '/rest/v1/roam_trips') {
      if (req.method() === 'POST') {
        const body = req.postDataJSON();
        expect(Object.keys(body)).toEqual(['payload']);
        saved = body.payload;
        const row = {
          id: '22222222-2222-4222-8222-222222222222',
          revision: 1,
          updated_at: '2026-09-10T00:00:00Z',
          payload: body.payload,
        };
        rows = [row];
        data = row;
      } else if (req.method() === 'PATCH') {
        lastPatch = url.search;
        expect(req.postDataJSON()).toEqual({ payload: trip });
        data = conflict ? [] : rows[0];
      } else data = rows;
    } else if (url.pathname === '/rest/v1/roam_shares') {
      if (req.method() === 'POST') {
        const body = req.postDataJSON();
        const share = { token, expires_at: '2099-01-01T00:00:00Z', payload: body.payload };
        shares = [share];
        data = share;
      } else if (req.method() === 'DELETE') {
        expect(url.searchParams.get('token')).toBe(`eq.${token}`);
        shares = [];
        await route.fulfill({ status: 204 });
        return;
      } else data = shares;
    } else if (url.pathname === '/rest/v1/rpc/roam_read_shared_trip')
      data = shares.length ? { trip: shares[0].payload, expiresAt: shares[0].expires_at } : null;
    else throw Error('Unexpected cloud request ' + req.method() + ' ' + url.pathname);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(data),
    });
  });
  await page.goto('/en/?view=planner');
  await page.evaluate((value) => localStorage.setItem('roam.trip.v1', JSON.stringify(value)), trip);
  await page.reload();
  await page.getByRole('button', { name: 'Account & sharing' }).click();
  const panel = page.getByRole('dialog', { name: 'Your trips, together' });
  await panel.getByLabel('Email', { exact: true }).fill(user.email);
  await panel.getByLabel('Password', { exact: true }).fill('test-password-123');
  await panel.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(panel.getByText(user.email, { exact: true })).toBeVisible();
  await panel.getByRole('button', { name: 'Save a new copy' }).click();
  await expect(panel.getByText('Saved to your account.', { exact: true })).toBeVisible();
  expect(saved).toEqual(trip);
  conflict = true;
  await panel.getByRole('button', { name: 'Update selected trip' }).click();
  await expect(panel.getByText('A newer version exists.', { exact: false })).toBeVisible();
  expect(new URLSearchParams(lastPatch).get('revision')).toBe('eq.1');
  expect(new URLSearchParams(lastPatch).get('id')).toBe('eq.22222222-2222-4222-8222-222222222222');
  await panel.getByRole('button', { name: 'Create viewing link' }).click();
  await expect(panel.getByLabel('Share link', { exact: true })).toHaveValue(
    new RegExp(`#share=${token}$`),
  );
  expect(shares[0].payload.stops[0].notes).toBe('');
  expect(shares[0].payload.checklist).toBeUndefined();
  expect(shares[0].payload.stops[0].activities![0].notes).toBe('');
  const view = await context.newPage();
  await view.goto(`/?lang=en#share=${token}`);
  await expect(view.getByText('A shared copy · view only')).toBeVisible();
  await expect(view.locator('.shared-itinerary')).not.toContainText('Private hotel booking');
  await expect(view.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
  await view.getByRole('button', { name: 'Use this itinerary' }).click();
  expect(
    await view.evaluate(() => JSON.parse(localStorage.getItem('roam.trip.v1')!).stops[0].notes),
  ).toBe('Private hotel booking');
  await view.getByRole('button', { name: 'Replace current trip' }).click();
  await expect(view.locator('#planner-page')).toBeVisible();
  expect(
    await view.evaluate(() => JSON.parse(localStorage.getItem('roam.trip.v1')!).stops[0].notes),
  ).toBe('');
  await panel.getByRole('button', { name: 'Revoke link' }).click();
  await expect(panel.getByRole('button', { name: 'Revoke link' })).toHaveCount(0);
  await view.goto(`/?lang=en#share=${token}`);
  await expect(view.getByRole('heading', { name: 'This trip is unavailable' })).toBeVisible();
  rows = [
    {
      id: '22222222-2222-4222-8222-222222222222',
      revision: 2,
      updated_at: '2026-09-11T00:00:00Z',
      payload: { ...trip, name: 'Latest remote copy' },
    },
  ];
  await panel.getByRole('button', { name: 'Refresh', exact: true }).click();
  await expect(panel.getByText('Latest remote copy', { exact: true })).toBeVisible();
  await panel.getByRole('button', { name: 'Load trip', exact: true }).click();
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('roam.trip.v1')!).name),
  ).not.toBe('Latest remote copy');
  await panel.getByRole('button', { name: 'Replace current trip' }).click();
  await expect(panel.getByText('Trip loaded.', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('roam.trip.v1')!).name)).toBe(
    'Latest remote copy',
  );
  expect(
    (
      await new AxeBuilder({ page })
        .include('.cloud-panel')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
  await panel.getByRole('button', { name: 'Sign out' }).click();
  await expect(
    panel.getByText('Signed out. Your local trip remains on this device.'),
  ).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('roam.trip.v1')!).name)).toBe(
    'Latest remote copy',
  );
});

test('signup confirmation and password-reset email actions report success without sending real mail', async ({
  page,
}) => {
  const requests: string[] = [];
  await page.route('https://roam-test.supabase.co/**', async (route) => {
    const url = new URL(route.request().url());
    requests.push(url.pathname);
    expect(['/auth/v1/signup', '/auth/v1/recover']).toContain(url.pathname);
    expect(route.request().postDataJSON().email).toBe(user.email);
    expect(url.searchParams.get('redirect_to')).toBe(
      'http://127.0.0.1:5198/?lang=en&view=planner&account=1',
    );
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(url.pathname.endsWith('signup') ? { ...user, identities: [] } : {}),
    });
  });
  await page.goto('/en/?view=planner&account=1');
  const panel = page.getByRole('dialog', { name: 'Your trips, together' });
  await panel.getByRole('button', { name: 'Create account', exact: true }).click();
  await panel.getByLabel('Email', { exact: true }).fill(user.email);
  await panel.getByLabel('Password', { exact: true }).fill('test-password-123');
  await panel.getByRole('button', { name: 'Create account', exact: true }).click();
  await expect(panel.getByText('Check your email to confirm your account.')).toBeVisible();
  await panel.getByRole('button', { name: 'Reset password', exact: true }).click();
  await expect(panel.getByText('Check your email for the password reset link.')).toBeVisible();
  expect(requests).toEqual(['/auth/v1/signup', '/auth/v1/recover']);
});
