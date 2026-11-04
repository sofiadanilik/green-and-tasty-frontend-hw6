import { test, expect } from '@playwright/test';
import { api, liveMode, haveOwner, loginPage, signIn, headers } from './helpers.js';

const groupId = process.env.AQA_L2_GROUP_ID;
const reservationId = process.env.AQA_L2_RESERVATION_ID;

test('@l2 @api anonymous cannot submit a consolidated order', async ({ request }) => {
  const r = await request.post(`${api}/group-reservations/not-a-group/submit`, {
    data: { reservationId: 'not-a-reservation' }
  });
  expect([401, 403]).toContain(r.status());
});

test('@l2 @api Owner cannot submit non-existent group', async ({ request }) => {
  test.skip(!haveOwner, 'Configure Owner credentials in environment / GitHub secrets');
  const tokens = await signIn(request);
  const r = await request.post(`${api}/group-reservations/missing-${Date.now()}/submit`, {
    headers: headers(tokens), data: { reservationId: 'missing-reservation' }
  });
  expect(r.status()).toBe(404);
});

test('@l2 @ui consolidated pre-order can be submitted once by Owner', async ({ page, request }) => {
  test.skip(!liveMode || !haveOwner || !groupId || !reservationId,
    'DESTRUCTIVE: use a separate disposable group with a submitted guest cart and AQA_ALLOW_MUTATION=true');
  await loginPage(page, request);
  await page.goto(`/reservations/${reservationId}/group-order`);
  const button = page.getByRole('button', { name: 'Submit Pre-Order' });
  await expect(button).toBeEnabled();
  await button.click();
  await page.locator('.dialog-submit').click();
  await expect(page.getByText('Sent to Restaurant')).toBeVisible();
  const tokens = await signIn(request);
  const replay = await request.post(`${api}/group-reservations/${groupId}/submit`, {
    headers: headers(tokens), data: { reservationId }
  });
  // GroupReservationSubmittedException is a client error (400/409 depending on API mapping).
  expect([400, 409]).toContain(replay.status());
});

test('@l2 @api not-Owner cannot submit someone else’s group', async ({ request }) => {
  test.skip(!groupId || !reservationId || !process.env.AQA_OTHER_EMAIL || !process.env.AQA_OTHER_PASSWORD,
    'Requires another customer and a known Owner group');
  const tokens = await signIn(request, process.env.AQA_OTHER_EMAIL, process.env.AQA_OTHER_PASSWORD);
  const r = await request.post(`${api}/group-reservations/${groupId}/submit`, {
    headers: headers(tokens), data: { reservationId }
  });
  expect(r.status()).toBe(403);
});
