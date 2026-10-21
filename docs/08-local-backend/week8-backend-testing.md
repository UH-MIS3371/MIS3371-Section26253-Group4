# Week 8 — Local Backend (Node.js Only)

This folder work extends the existing **ShelfLife Book Checkout** project. It does not replace the client-side files (`transaction-form.html`, `styles.css`, `app.js`) and it does not connect to the frontend yet.

## Run (from the repository root)

```bash
node --version
node backend/test-backend.js
```

No `npm install`, Express, web server, AWS account, browser, or database is required. Tested with Node v22.

## Files

- `backend/backend.js` receives one checkout object, validates its data, independently enforces the checkout rules, and returns an accepted or rejected result.
- `backend/test-backend.js` runs 12 named checkout cases through `processCheckout()` and prints the expected result, the actual result, and PASS or FAIL for each.
- `docs/08-local-backend/week8-backend-testing.md` (this file) records the rules, the tests, and the results.

## Business rules enforced by the backend

The backend repeats the browser rules from Week 7 on its own. The checks run in this order, and the first failure stops the checkout.

| Order | Rule | Backend decision |
|---|---|---|
| 1 | **BR-5** The due date must be 1 to 5 calendar days after the checkout date | Reject if the due date is the same day, earlier, or more than 5 days later |
| 2 | **BR-1** Outstanding fines must not be over $10.00 | Reject if fines are over $10.00 (exactly $10.00 is allowed) |
| 3 | **BR-3** A book On Hold can only be checked out by the reader who placed the hold | Reject if the hold belongs to another reader or the hold holder is not identified |
| 4 | **BR-2** Only an Available book can be checked out | Reject Checked Out, Lost, or any unknown status |

**Routing decision:** a checkout that passes every rule is never rejected for being on hold. It follows one of two paths. An Available book takes the **Standard** path. A book that was On Hold for this reader takes the **Hold pickup** path, and the hold is fulfilled. Either way the backend sets the status to `Checked Out` and creates the transaction ID and timestamp. The browser cannot choose these values.

**Data checks before the rules:** Reader ID and Book ID must not be blank, both dates must be real calendar dates in `YYYY-MM-DD` form (February 31 is rejected), and fines must be a number that is 0 or more (a blank amount is rejected).

## Why two validation locations?

The Week 7 browser checks improve the reader's experience, but the reader controls the browser and can bypass them. The backend must protect the transaction even when a request arrives without using our form. The question to ask is: *What rule must still be enforced if someone completely bypasses the browser?*

The backend uses the same rule numbers and the same $10.00 and 5-day limits as `app.js`, but it does not share code with the browser. It never touches the page (no `document`, no DOM).

## Result shape

Rejected:

```js
{ success: false, message: "Checkout blocked: fine limit exceeded." }
```

Accepted:

```js
{
  success: true,
  status: "Checked Out",
  checkoutPath: "Standard",      // or "Hold pickup"
  holdFulfilled: false,
  readerId: "R100",
  bookId: "B1234",
  checkoutDate: "2026-10-01",
  dueDate: "2026-10-04",
  transactionId: "CHK-<time>-<number>",
  checkedOutAt: "<time>",
  message: "Checkout approved."
}
```

## Test results

Every test starts from the same clean checkout and changes only one thing:
Reader `R100`, Book `B1234`, checkout `2026-10-01`, due `2026-10-04` (3 days), fines `0`, status `available`, no hold. Dates are fixed so the results are the same on any day.

| # | Test | Type | What changed | Expected | Actual | Result |
|---|---|---|---|---|---|---|
| 1 | Clean checkout, due in 3 days | Valid | nothing | Accept, Standard path | Accept, Standard path, status Checked Out | PASS |
| 2 | Reader who placed the hold checks out the held book | Valid | status `on-hold`, hold reader `R100` | Accept, Hold pickup path | Accept, Hold pickup path, status Checked Out | PASS |
| 3 | Book on hold for another reader | Invalid | status `on-hold`, hold reader `R200` | Reject: "Checkout blocked: this book is on hold for another reader." | Reject: "Checkout blocked: this book is on hold for another reader." | PASS |
| 4 | Book status Lost | Invalid | status `lost` | Reject: "Checkout blocked: book is not available." | Reject: "Checkout blocked: book is not available." | PASS |
| 5 | Book already Checked Out | Invalid | status `checked-out` | Reject: "Checkout blocked: book is not available." | Reject: "Checkout blocked: book is not available." | PASS |
| 6 | Reader ID missing | Invalid | reader ID is spaces only | Reject: "Reader ID is required." | Reject: "Reader ID is required." | PASS |
| 7 | Fines $10.00 exactly | Boundary | fines `10.00` | Accept, Standard path | Accept, Standard path, status Checked Out | PASS |
| 8 | Fines $10.01 | Boundary | fines `10.01` | Reject: "Checkout blocked: fine limit exceeded." | Reject: "Checkout blocked: fine limit exceeded." | PASS |
| 9 | Due 5 days after checkout | Boundary | due `2026-10-06` | Accept, Standard path | Accept, Standard path, status Checked Out | PASS |
| 10 | Due 6 days after checkout | Boundary | due `2026-10-07` | Reject: "Due date must be 1 to 5 calendar days after the checkout date." | Reject: "Due date must be 1 to 5 calendar days after the checkout date." | PASS |
| 11 | Due same day as checkout | Boundary | due `2026-10-01` | Reject: "Due date must be 1 to 5 calendar days after the checkout date." | Reject: "Due date must be 1 to 5 calendar days after the checkout date." | PASS |
| 12 | 5 days across a month end | Boundary | checkout `2026-09-29`, due `2026-10-04` | Accept, Standard path | Accept, Standard path, status Checked Out | PASS |

**Summary: 12 of 12 tests passed** (2 valid, 4 invalid, 6 boundary or edge cases). The transaction ID and timestamp change on every run, so the tests compare the success flag, the message, the status, and the path instead of those values.

What the tests prove: the boundary pairs (fines $10.00 and $10.01, due +5 and +6 days) show that each rule uses the right comparison. Using `>=` instead of `>` for the fine rule makes test 7 fail, which is how this was confirmed.

## Important limitation

An accepted result contains a **demo** transaction ID, the status `Checked Out`, and a timestamp. **Nothing was saved.** `Checked Out` here means the checkout was accepted by `processCheckout()`, not stored in a database. Demo IDs restart every time Node starts, so they do not guarantee permanent uniqueness. A passing local test is not an official saved transaction. Official persistence begins in Week 11.

The book status, hold reader, and fines are passed in with the checkout object, the same way the form collects them today. In the real system the backend would look these up from its own records, so the reader would not supply them.

## Not in the Week 8 backend

- **BR-4** (maximum 3 books checked out) is enforced in the browser (`app.js`). It is not part of this week's backend rules.
- **BR-6** (only one reader per physical book at a time) and **BR-7** (barcode or ISBN matches an existing book record) need stored book records, so they wait for the database weeks.