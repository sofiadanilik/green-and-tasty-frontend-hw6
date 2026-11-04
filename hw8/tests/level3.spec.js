import { test, expect } from '@playwright/test';
import { api, liveMode, haveOwner, loginPage, signIn, headers } from './helpers.js';

const groupId = process.env.AQA_L3_GROUP_ID;
const reservationId = process.env.AQA_L3_RESERVATION_ID;

test('@l3 @api anonymous user cannot remove a guest', async ({ request }) => {
  const r = await request.delete(`${api}/guest/groups/nonexistent-group/sessions/nonexistent-guest`);
  expect([401, 403]).toContain(r.status());
});

test('@l3 @api Owner receives 404 for a non-existent guest', async ({ request }) => {
  test.skip(!haveOwner || !groupId, 'Requires Owner and existing group');
  const tokens = await signIn(request);
  const r = await request.delete(`${api}/guest/groups/${groupId}/sessions/missing-${Date.now()}`, {
    headers: headers(tokens),
  });
  expect(r.status()).toBe(404);
});

test('@l3 @api only Owner can remove an existing guest', async ({ request }) => {
  test.skip(!groupId || !process.env.AQA_L3_GUEST_SESSION_ID ||
    !process.env.AQA_OTHER_EMAIL || !process.env.AQA_OTHER_PASSWORD,
    'Requires existing Guest session and a second customer');
  const tokens = await signIn(request, process.env.AQA_OTHER_EMAIL, process.env.AQA_OTHER_PASSWORD);
  const r = await request.delete(`${api}/guest/groups/${groupId}/sessions/${process.env.AQA_L3_GUEST_SESSION_ID}`, {
    headers: headers(tokens),
  });
  expect(r.status()).toBe(403);
});

test('@l3 @api guest from another group cannot be removed (400)', async ({ request }) => {
  test.skip(!haveOwner || !groupId || !process.env.AQA_OTHER_GROUP_GUEST_ID,
    'Requires 2 independent groups and a foreign Guest session ID');
  const tokens = await signIn(request);
  const r = await request.delete(`${api}/guest/groups/${groupId}/sessions/${process.env.AQA_OTHER_GROUP_GUEST_ID}`, {
    headers: headers(tokens),
  });
  expect(r.status()).toBe(400);
});

test('@l3 @ui Remove Guest recalculates the visible Grand Total', async ({ page, request }) => {
  test.skip(!liveMode || !haveOwner || !reservationId,
    'DESTRUCTIVE: create a separate disposable group with a guest and AQA_ALLOW_MUTATION=true');
  await loginPage(page, request);
  await page.goto(`/reservations/${reservationId}/group-order`);
  const remove = page.locator('.remove-guest-button').first();
  await expect(remove).toBeVisible();
  await remove.click();
  await expect(page.locator('.confirmation-copy')).toContainText('cannot be undone');
  await page.locator('.dialog-remove').click();
  await expect(page.locator('.confirmation-copy')).toHaveCount(0);
  await expect(page.getByText('Grand Total')).toBeVisible();
  await expect(page.locator('.total-section strong')).toHaveText(/\$[\d,.]+/);
});
