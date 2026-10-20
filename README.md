# ShelfLife — Library Book Checkout

MIS 3371 Transaction Processing Systems I — Team 4

ShelfLife is a library checkout transaction system. This repository holds the client-side system (Milestone 2) and the local backend logic (Week 8). The two layers are not connected yet.

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
| `src/app.js` | Client-side business rules, event listeners, and validation messages. |
| `backend/backend.js` | Week 8 local backend transaction logic. |
| `backend/test-backend.js` | Week 8 backend tests. |
| `backend/week8-backend-testing.md` | Backend rules, testing evidence, and limitations. |


## How to run

**Browser side:** Open `src/transaction-form.html` in Chrome. Press F12 and select Console to inspect JavaScript test results.


**Backend (from the repository root):**

```bash
node backend/test-backend.js
```

No `npm install`, server, AWS account, or database is needed.

## Business rules

| Rule | Description | Browser (`app.js`) | Backend (`backend.js`) |
|---|---|---|---|
| BR-1 | Outstanding fines must not exceed $10.00 | Live message + submit block | Enforced |
| BR-2 | Only an Available book can be checked out | Live message + submit block | Enforced |
| BR-3 | A book on hold for another reader cannot be checked out; the reader who placed the hold may check it out | Hold ID box appears only for On Hold; live message + submit block | Enforced (Hold pickup path) |
| BR-4 | A reader may have at most 3 books checked out | "Books Currently Checked Out" box; live message + submit block | Not in this week's backend rules |
| BR-5 | The due date must be 1 to 5 calendar days after the checkout date | Live message + submit block | Enforced |
| BR-6 | Only one reader may check out a physical book at a time | Covered only by BR-2 (Checked Out status) | Later weeks (needs stored records) |
| BR-7 | The barcode or ISBN must match an existing book record | Required, non-blank only | Later weeks (needs stored records) |

BR-3 and BR-5 are conditional rules: the answer depends on more than one field. At submit the checks run in this order and the first failure stops the checkout: BR-5, BR-1, BR-4, BR-3, BR-2.

## Milestone 2 — client-side system

- Semantic page structure and a complete transaction form with visible labels.
- Native constraints (`required`, `pattern`, `min`, `step`) plus rule thresholds kept in JavaScript so messages can explain the block.
- External CSS with a responsive layout (the form row stacks at 600px or narrower), visible focus, and reduced-motion support.
- External JavaScript loaded with `defer`: DOM selection, `input`, `change` and `submit` listeners, visible messages, and a submit-time gate (`preventDefault()`, message, `focus()`, early return).
- Boundary tests in the Console for each rule: $10.00 and $10.01, due +5 and +6 days, 2 and 3 books already out.

This is client-side behavior. The browser only helps the reader; the backend makes the official decision.
