import { expect } from '@playwright/test';

export const ui = process.env.AQA_UI_URL || 'https://d3eorboenrwbc0.cloudfront.net';
export const api = (process.env.AQA_API_URL || 'https://kdepzccp2i.execute-api.us-west-2.amazonaws.com/develop').replace(/\/$/, '');

export const haveOwner = Boolean(process.env.AQA_OWNER_EMAIL && process.env.AQA_OWNER_PASSWORD);
export const liveMode = process.env.AQA_ALLOW_MUTATION === 'true';

export async function signIn(request, email = process.env.AQA_OWNER_EMAIL, password = process.env.AQA_OWNER_PASSWORD) {
  const res = await request.post(`${api}/signin`, { data: { email, password } });
  expect(res.ok(), `Sign-in HTTP ${res.status()}`).toBeTruthy();
  const json = await res.json();
  expect(json.idToken, 'Cognito idToken is required').toBeTruthy();
  return { idToken: json.idToken, accessToken: json.accessToken };
}

export async function loginPage(page, request) {
  const tokens = await signIn(request);
  await page.addInitScript((auth) => {
    localStorage.setItem('auth', JSON.stringify(auth));
  }, tokens);
  return tokens;
}

export function headers(tokens) { return { Authorization: `Bearer ${tokens.idToken}` }; }

export function sumGuestDishes(snapshot) {
  return (snapshot.participants ?? []).reduce((sum, p) => {
    const expected = (p.items ?? []).reduce((acc, item) => acc + Number(item.quantity) * Number(item.dish.price), 0);
    expectCents(p.total, expected);
    return sum + Number(p.total);
  }, 0);
}
function expectCents(actual, expected) {
  if (Math.abs(Number(actual) - expected) > 0.011) throw new Error(`Total mismatch: ${actual} != ${expected}`);
}
