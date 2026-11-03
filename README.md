# ShelfLife — Library Book Checkout

MIS 3371 Transaction Processing Systems I — Team 4

ShelfLife is a library book checkout system developed for MIS 3371. The project includes a responsive client-side application (Milestone 2), local backend validation (Week 8), and an Express API that connects the frontend to the backend using HTTP and JSON (Week 9).

The system validates checkout requests and displays approval or rejection messages. Transactions are not permanently saved yet.

## The transaction

**Event:** A reader requests to check out one physical book.

**Inputs:** Reader ID, book barcode or ISBN, requested checkout date, due date.

**System action:** Check the reader's fines, the book's availability, and the checkout limit; assign a status.

**Outcome:** Approve and check out, or reject with the specific reason (fines owed, book unavailable, hold for another reader, limit reached).

**Official record (later weeks):** Checkout ID, Reader ID, book, checkout date, due date, status, timestamps.

## Team and roles

| Team member | Role |
|---|---|
| Lana Tran | Requirements / Product Lead |
| Syed Raza | UI / Accessibility Lead |
| Casey Nguyen | JavaScript / Logic Lead |
| Ebrahim Vejlani | Git / Integration Lead |
| Kim Nguyen | QA / Documentation Lead |

Roles set the lead for each area. Everyone contributes to the shared files, and the commit history shows who changed what.

## Files

| File | What it is |
|---|---|
| `src/transaction-form.html` | Client-side checkout form with labeled fields and HTML validation. |
| `src/styles.css` | Responsive styling and accessible focus states. |
| `src/app.js` | Client-side business rules, event listeners, validation messages, and (Week 9) the `fetch()` call that sends the checkout to the local API. |
| `backend/backend.js` | Week 8 local backend transaction logic. |
| `backend/test-backend.js` | Week 8 backend tests. |
| `backend/json-demo.js` | Week 8 demo: a checkout object → JSON text → object again. |
| `docs/` | All project documents, organized by course stage. Start at `docs/README.md`. |
| `docs/08-local-backend/week8-backend-testing.md` | Week 8 rules, routing decision, expected vs actual test results. |
| `docs/04-07-client-side/browser-test-log.md` | Milestone 2 browser boundary tests. |
| `server/server.js` | Week 9 local Express server: serves the page and `POST /api/checkouts`. |
| `server/test-api.js` | Week 9 HTTP tests against the running server. |
| `demo-requests/` | Sample accepted and rejected checkout JSON for sending with `curl`. |
| `package.json` | Express dependency and the `npm start` / `npm run test:*` commands. |
| `docs/09-local-api/README.md` | Week 9 API, run instructions, end-to-end tests, and Network evidence. |

## How to run

ShelfLife requires Node.js version 18 or newer.

From the repository root, install dependencies and start the Express server:

```bash
npm install
npm start
```

Open http://localhost:3000 in Chrome. Do not open the HTML file directly: the form needs the server to reach the API.

The browser sends checkout requests to the local Express API at `POST /api/checkouts`.

To test the API, keep the server running and open a second terminal:

```bash
npm run test:api
```

To run the Week 8 backend tests (no server needed):

```bash
npm run test:backend
```

No AWS account or database is needed through Week 9. Approved checkouts are not permanently saved yet.

## Backend validation hardening (professor feedback)

The backend independently rejects missing/non-object checkout requests, incorrect
field types, and invalid monetary decimals (including fractional cents). Browser
number inputs are still supported as normal decimal strings. The same
`processCheckout()` handles Express and the Week 10 AWS Lambda adapter.

- `npm run test:backend` — 25 backend scenarios, including the original 15.
- `npm run test:api` — 15 HTTP scenarios (start `npm start` first).
- See [backend validation addendum](docs/08-local-backend/week8-backend-testing.md#post-feedback-validation-hardening)
  for the invalid-data cases and trust boundary.

The browser remains a helpful first check; only backend validation determines
whether a checkout is accepted. No database or persistent checkout is created.

## Business rules

| Rule | Description | Browser (`app.js`) | Backend (`backend.js`) |
|---|---|---|---|
| BR-1 | Outstanding fines must not exceed $10.00 | Live message + submit block | Enforced |
| BR-2 | Only an Available book can be checked out | Live message + submit block | Enforced |
| BR-3 | A book on hold for another reader cannot be checked out; the reader who placed the hold may check it out | Hold ID box appears only for On Hold; live message + submit block | Enforced (Hold pickup path) |
| BR-4 | A reader may have at most 3 books checked out | "Books Currently Checked Out" box; live message + submit block | Enforced |
| BR-5 | The due date must be 1 to 5 calendar days after the checkout date | Live message + submit block | Enforced |
| BR-6 | Only one reader may check out a physical book at a time | Covered only by BR-2 (Checked Out status) | Later weeks (needs stored records) |
| BR-7 | The barcode or ISBN must match an existing book record | Required, non-blank only | Later weeks (needs stored records) |

BR-3 and BR-5 are conditional rules: the answer depends on more than one field. At submit the checks run in this order and the first failure stops the checkout: BR-5, BR-1, BR-4, BR-3, BR-2. The backend checks the same rules in the same order.

## Milestone 2 — client-side system

- Semantic page structure and a complete transaction form with visible labels.
- Native constraints (`required`, `pattern`, `min`, `step`) plus rule thresholds kept in JavaScript so messages can explain the block.
- External CSS with a responsive layout (the form row stacks at 600px or narrower), visible focus, and reduced-motion support.
- External JavaScript loaded with `defer`: DOM selection, `input`, `change` and `submit` listeners, visible messages, and a submit-time gate (`preventDefault()`, message, `focus()`, early return).
- Boundary tests in the Console for each rule: $10.00 and $10.01, due +5 and +6 days, 2 and 3 books already out.

This is client-side behavior. The browser only helps the reader; the backend makes the official decision.

## Week 9 — Local API

The form now sends each checkout to the backend over HTTP:

**Form → JSON → `POST /api/checkouts` → Express → `processCheckout()` → 200 or 400 JSON → message on the page.**

```bash
npm install          # first time only
npm start            # starts http://localhost:3000; keep this terminal open
npm run test:api     # in a second terminal while the server runs
npm run test:backend # Week 8 tests; no server needed
```

- `server/server.js` only moves data; the business rules stay in `backend/backend.js`.
- `src/app.js` keeps the Week 7 live messages and browser checks. Its submit handler now runs those checks and then sends the checkout to the API using `fetch()`.
- The page shows three outcomes: approved, rejected with the backend's reason, or "Cannot reach the ShelfLife server" when the server is stopped.
- Nothing is saved yet. Storage starts in Week 11.

To send sample JSON straight to the API, keep the server running and use a second terminal (in PowerShell, type `curl.exe`, not `curl`):

```bash
curl.exe -i -X POST http://localhost:3000/api/checkouts -H "Content-Type: application/json" --data-binary "@demo-requests/accepted-checkout.json"
curl.exe -i -X POST http://localhost:3000/api/checkouts -H "Content-Type: application/json" --data-binary "@demo-requests/rejected-fines-over-limit.json"
```

The first returns HTTP 200; the second returns HTTP 400 with "Checkout blocked: fine limit exceeded."

Details, test results, and Network evidence: [Week 9 API documentation](docs/09-local-api/README.md).

## Milestone 3 — Complete local transaction processing system

ShelfLife now runs as one complete local system: the HTML/CSS/JavaScript frontend, the Week 8 backend rules, and the Express server that connects them with HTTP, JSON, and `fetch()`. AWS and a database are not part of Milestone 3.

| Requirement | Evidence |
|---|---|
| Frontend | `src/transaction-form.html`, `src/styles.css`, `src/app.js` |
| Backend validations and rules | `backend/backend.js` (25 tests; original 15 preserved) |
| Local Express server | `server/server.js`, `POST /api/checkouts` |
| HTTP, JSON, `fetch()` | `src/app.js` → `handleSubmit()`; Network screenshots in `docs/09-local-api/` |
| Successful, rejected, and error cases | API tests 8/8, form tests 9/9, direct API rejections 4/4, server-stopped message |
| Consistent fields and rules | Each HTML `name` equals its JSON key and backend property; same limits and rule order in browser and backend |