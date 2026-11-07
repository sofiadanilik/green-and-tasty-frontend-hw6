import { test, expect } from '@playwright/test';
import { api, haveOwner, loginPage, signIn, headers, sumGuestDishes } from './helpers.js';

const reservationId = process.env.AQA_L1_RESERVATION_ID;
const groupId = process.env.AQA_L1_GROUP_ID;

test('@l1 @api anonymous user cannot read Owner participant sessions', async ({ request }) => {
  const r = await request.get(`${api}/guest/groups/nonexistent-group/sessions`);
  expect([401, 403]).toContain(r.status());
});

test('@l1 @api Owner sees participants and mathematically correct per-person totals', async ({ request }) => {
  test.skip(!haveOwner || !groupId, 'Configure AQA_OWNER_EMAIL/PASSWORD and AQA_L1_GROUP_ID');
  const tokens = await signIn(request);
  const r = await request.get(`${api}/guest/groups/${groupId}/sessions`, { headers: headers(tokens) });
  expect(r.status()).toBe(200);
  const snapshot = await r.json();
  expect(Array.isArray(snapshot.participants)).toBeTruthy();
  expect(snapshot.participants.length).toBeGreaterThanOrEqual(1);
  const total = sumGuestDishes(snapshot);
  expect(Math.abs(Number(snapshot.total) - total)).toBeLessThanOrEqual(0.011);
});

test('@l1 @ui Owner sees participant cards and Grand Total', async ({ page, request }) => {
  test.skip(!haveOwner || !reservationId, 'Configure an existing Owner reservation ID');
  await loginPage(page, request);
  await page.goto(`/reservations/${reservationId}/group-order`);
  await expect(page.getByRole('heading', { name: 'Group Pre-Order' })).toBeVisible();
  await expect(page.getByText('Grand Total')).toBeVisible();
  await expect(page.locator('.participants li').first()).toBeVisible();
});

test('@l1 @ui Owner group view respects order status and polls when collecting', async ({ page, request }) => {
  test.skip(!haveOwner || !reservationId, 'Requires an Owner account and group reservation');

  await loginPage(page, request);

  let refreshes = 0;
  page.on('request', req => {
    if (req.method() === 'GET' && req.url().includes('/sessions')) refreshes++;
  });

  await page.goto(`/reservations/${reservationId}/group-order`);
  await expect(page.getByRole('heading', { name: 'Group Pre-Order' })).toBeVisible();

  if (await page.getByText('Sent to Restaurant').isVisible()) {
    await expect(page.getByText('Grand Total')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Submit Pre-Order' })).toBeDisabled();
    return;
  }

  await expect(page.getByText('Collecting pre-orders')).toBeVisible();
  await expect.poll(() => refreshes, { timeout: 20_000 }).toBeGreaterThanOrEqual(2);
});

test('@l1 @api non-existent group is rejected for Owner', async ({ request }) => {
  test.skip(!haveOwner, 'Requires an Owner account');
  const tokens = await signIn(request);
  const missing = `missing-${Date.now()}`;
  const r = await request.get(`${api}/guest/groups/${missing}/sessions`, { headers: headers(tokens) });
  expect(r.status()).toBe(404);
});
