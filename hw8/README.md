# HW8 — Direction 1: Green & Tasty group pre-order

**Target:** individually deployed integrated Angular + AWS backend. **Approach:** Playwright Page/UI and REST API assertions, with tagged levels (`@l1`, `@l2`, `@l3`).

## Coverage

- **L1:** unauthorized access; Owner sees participants and per-person/overall totals; nonexistent group; Owner page loads and polls at ~15s.
- **L2:** unauthorized submit; missing group; Owner UI submit + duplicate submission; non-Owner denial.
- **L3:** unauthorized Remove Guest; non-Owner denial; unknown guest (404); cross-group guest (400); Owner UI Remove Guest and updated total.

**Important:** the optional authenticated UI and mutating tests need a disposable reservation/group created for that level. Tests skip instead of altering other people's reservations. `@smoke` and anonymous security tests run without credentials. Full level compliance also requires dynamically isolated positive cases for every specified state, independent test setup/cleanup, waiter readback and all validation cases. The supplied suite covers important scenarios; it is **not** a verified claim that every HW8 scenario has passed.

## Setup

```powershell
cd hw8
npm install
npx playwright install chromium
$env:AQA_UI_URL="https://d3eorboenrwbc0.cloudfront.net"
$env:AQA_API_URL="https://kdepzccp2i.execute-api.us-west-2.amazonaws.com/develop"
npm test
npm run test:l1
npm run test:l2
npm run test:l3
```

For authenticated checks, supply `AQA_OWNER_EMAIL` and `AQA_OWNER_PASSWORD` in environment variables or **GitHub Actions secrets**, never in Git. Also set level-specific `AQA_L1_RESERVATION_ID`, `AQA_L1_GROUP_ID`, `AQA_L2_*`, `AQA_L3_*` and optionally `AQA_OTHER_EMAIL`, `AQA_OTHER_PASSWORD` for non-Owner cases. Use **different temporary reservations** for different mutating tests. Use `AQA_ALLOW_MUTATION=true` only when intentionally running Submit/Remove on disposable groups; CI defaults to false.

## Reports and CI

The `.github/workflows/hw8-e2e.yml` workflow runs Playwright in GitHub Actions. It uploads HTML, JUnit XML, screenshots, videos and Playwright trace archives even when the tests fail. The tests step uses `continue-on-error` so results can be reviewed. Reports: `hw8/playwright-report/` and `hw8/test-results/`. Click the Actions run → **Artifacts** → `hw8-playwright-results`.

Set `AQA_OWNER_EMAIL`/`AQA_OWNER_PASSWORD` and other credentials under repository **Settings → Secrets and variables → Actions**. Variables are used for non-secret resource IDs/URLs. Do not put `.env`, passwords, bearer tokens or real test accounts in commits.

## Explicit behavior decisions (unspecified by the assignment)

- Re-submit an already submitted group: reject with client error (400/409, depending on service mapping).
- Non-owner submit/delete: HTTP 403.
- Delete a missing Guest session: HTTP 404.
- Delete a Guest from another group: HTTP 400.
- Removing the last Guest leaves a group with Owner session only and total corresponding to remaining items (empty group can produce `participants: []`, `total: 0`).

## Security and data lifetime

Use unique/disposable reservations and avoid storing passwords in CI output. Public smoke tests are read-only. Authenticated Submit and Remove Guest are only performed with explicit mutation opt-in. In API validation cases, `Date.now()` generates non-existing IDs.
