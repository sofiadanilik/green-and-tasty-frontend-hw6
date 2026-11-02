# Green & Tasty — EPAM Frontend Homework #6

Angular implementation of the EPAM IT Marathon 6.0 frontend homework. Levels
1 and 2 remain in place; Level 3 adds the Owner Group Pre-Order synchronization
and final submission flow.

## Run the frontend

Requirements: Node.js 22.22+ (or 24.x) and npm.

```powershell
Set-Location .\frontend\restaurant-frontend-app
npm.cmd ci
npm.cmd start
```

The Owner page is `/reservations/:reservationId/group-order`. Reservation
cards link directly to **Group Pre-Order**.

## Local Level 3 integration run

The separate Backend workspace contains `LocalE2E`, a localhost-only .NET
host that calls the production guest-session and group-reservation services
and API handlers. Its repositories are isolated in-memory fixtures; it does
not use AWS, DynamoDB, Cognito, or real accounts/reservations. Data resets
when the host restarts.

Start the backend from its checkout:

```powershell
Set-Location 'C:\Users\sofia\Downloads\marathon2026-archive\marathon2026\backend\restaurant-backend-app'
dotnet run --project .\LocalE2E\LocalE2E.csproj
```

In another terminal, start the frontend with its dedicated localhost API
configuration:

```powershell
Set-Location .\frontend\restaurant-frontend-app
npm.cmd run start:e2e
```

The host health endpoint is `http://127.0.0.1:5278/__local/health`; the guest
invitation is `http://127.0.0.1:4200/join/local-invite`; and the Owner page is
`http://127.0.0.1:4200/reservations/local-reservation/group-order`.

For browser verification, obtain the local-only token from
`POST http://127.0.0.1:5278/signin` and put its response in the `auth`
localStorage key as the app's `idToken` and `accessToken`. Never use a real
AWS/Cognito token with this test host.

The local HTTP integration run verified a guest named Nania joining from the
invitation, submitting Spring Salad × 2, the Owner page showing Nania's
persisted name/status/dish/quantity/$25.00 subtotal, 15-second polling
detecting another submitted guest, manual Refresh, and Owner final submission
with status **Sent to Restaurant**. It used production backend handlers and
services with isolated in-memory repositories, not demo mocks. The captured
fixture had an empty Owner cart:
[local-e2e-sent-to-restaurant.png](./homework-design/local-e2e-sent-to-restaurant.png).

After restarting the local .NET host and Angular with `start:e2e`, a fresh
browser run verified that the Owner's group details, participant sessions,
Owner order, and final Submit all use `http://127.0.0.1:5278` rather than AWS.
The Owner view showed persisted guest names, dishes, quantities and subtotals,
plus the Owner's own order. Session refreshes were observed at approximately
15-second intervals, and final Submit displayed **Sent to Restaurant**. This
is an isolated local fixture run, not a deployed AWS verification.

**Deployment limitation:** the shared AWS API currently does not expose
`GET /reservations/{reservationId}/group-order`. Consequently, this local
verification does not prove the deployed AWS/DynamoDB/Cognito path. The
additive API Gateway route and CORS change has not been deployed; existing
shared AWS resources were not modified.

## Validation

Run the homework tests and production build:

```powershell
Set-Location .\frontend\restaurant-frontend-app
npm.cmd run test:hw
$env:BACKEND_URL='https://kdepzccp2i.execute-api.us-west-2.amazonaws.com/develop'
npm.cmd run build
```

Backend tests (from the Backend checkout):

```powershell
dotnet test .\restaurant-backend-app.sln
```

Latest run: **81/81** Homework #6 frontend tests passed. The previous saved
verification recorded **162/162** Backend tests, application and spec
TypeScript checks, and the production build passing. Existing
bundle/style-size, CommonJS, and NuGet dependency vulnerability warnings
remain.

## Homework references

- [`homework-frontend.md`](./homework-frontend.md) — task requirements.
- [`homework-design/README.md`](./homework-design/README.md) — required and
  optional design elements.
- [`homework-tests/README.md`](./frontend/restaurant-frontend-app/homework-tests/README.md)
  — provided homework test suite.
