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

## Level 3 acceptance status

The Level 3 workflow in `homework-frontend.md` requires an authenticated
Customer to register/sign in, create a reservation, share its generated invite
link, have a guest submit a cart from a separate browser session, see it on
Owner within 15 seconds, and submit the consolidated order.

**That complete workflow is not verified by the delivered frontend.** The
deployed AWS path has not been exercised with an authenticated Customer. The
unauthenticated request made during local verification returned HTTP 403,
which by itself does not establish whether the protected group-order route is
deployed. No AWS resources were changed.

The available local `LocalE2E` host is only a fixed-fixture integration
environment. It seeds `local-reservation` and `local-group`, exposes a static
local Owner sign-in, and keeps data in memory. It does not implement customer
registration/authentication or dynamically create reservations. Do not count
this fixture as evidence of real registration or booking, and do not use its
localhost invite URL as a public link.

### Reproduce the available local fixture (partial verification only)

The backend is a separate repository:
[sofiadanilik/restaurant-backend-app](https://github.com/sofiadanilik/restaurant-backend-app).
Clone it separately and ensure its checkout contains the `LocalE2E` project and
the Level 3 group-reservation API changes. The current local backend checkout
has uncommitted changes; those changes have **not** been delivered to that
remote repository or included in this frontend repository. A clean clone alone
may therefore not reproduce the fixture.

From the backend checkout, start its localhost-only fixture:

```powershell
Set-Location .\restaurant-backend-app
dotnet run --project .\LocalE2E\LocalE2E.csproj
```

In another terminal, from this frontend checkout:

```powershell
Set-Location .\frontend\restaurant-frontend-app
npm.cmd run start:e2e
```

The fixed invitation is `http://127.0.0.1:4200/join/local-invite`; the Owner
page is `http://127.0.0.1:4200/reservations/local-reservation/group-order`.
The local API health endpoint is `http://127.0.0.1:5278/__local/health`.
The API source and fixture run instructions are in the separate backend
repository's `LocalE2E/README.md`.

The fixture's local `/signin` response is a test-only static Owner token, not
Customer registration or authentication. Never use a real AWS/Cognito token
with this host. Existing fixture checks exercised guest HTTP submission,
Owner polling, and consolidated Submit against `127.0.0.1:5278`; they verify
the group-order integration only after the fixed reservation already exists.

On the current Windows machine, the standard `dotnet run` host is blocked by
Windows Code Integrity: `LocalE2E.exe` cannot load `APIHandler.dll` under the
active signing-level policy (Code Integrity events 3077/3033). No security
setting was changed. Do not work around the policy by bundling or relocating
the DLL; use an organization-approved signed build or a compliant test
environment before repeating this fixture.

## Final verification status

An earlier browser run against the fixed local fixture verified final Submit,
the **$43.00** restaurant order, and that polling stopped after submission.
Those screenshots and checks predate the interrupted fresh run below.

In the latest separate-profile browser attempt, Nania submitted Spring Salad
× 2, another guest submitted Green Bowl × 1, and the Owner page displayed both
guests, the Owner's Green Bowl × 1, and the **$61.00** consolidated total.
This attempt did not establish the 15-second detection threshold, did not
perform final Submit, and did not capture new before/after screenshots. The
fixture is in-memory and resets when its backend process restarts. These are
partial local checks, not full Level 3 acceptance or verification against
AWS.

## Screenshots and disclosure

The regular frontend was also opened against the existing shared API to check
the home page, menu, and table-search form. No reservation was created
and no AWS resources were modified. Dishes without an exact local image or a
backend image URL now use a neutral initial placeholder instead of an
unrelated photo.

Screenshots:

- [Owner review](./homework-design/local-e2e-owner-review.png)
- [Submitted restaurant order](./homework-design/local-e2e-sent-to-restaurant.png)

These are retained screenshots from an earlier fixture run, not evidence from
the latest interrupted browser attempt.

AI disclosure: AI assistance (Copilot) was used to inspect and update the
frontend and to run/interpret local validation. The checks below are the
observed results; the submitter should perform a final review before submission.

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

Latest focused validation after scoped local routing: **86/86** Homework #6
frontend tests passed. The Backend solution tests also passed **162/162**.

Latest full `npm run test -- --watch=false`: **271 passed, 46 failed, 317
total**. Failures include component-creation tests and numerous
`GeneralInformationComponent` tests; they are outside the focused Homework #6
suite. The production build passed after the routing changes and the bundle
placeholder check passed. Existing bundle/style budget and CommonJS warnings
remain.

## Homework references

- [`homework-frontend.md`](./homework-frontend.md) — task requirements.
- [`homework-design/README.md`](./homework-design/README.md) — required and
  optional design elements.
- [`homework-tests/README.md`](./frontend/restaurant-frontend-app/homework-tests/README.md)
  — provided homework test suite.
