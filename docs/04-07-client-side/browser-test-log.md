# Milestone 2 — Browser-Side Test Log

These tests cover the client-side system only (`src/transaction-form.html`, `src/styles.css`, `src/app.js`). The backend is not connected.

**How the tests were run:** open `src/transaction-form.html` in Chrome, fill in the form, and click **Submit Checkout Request**. Each test starts from the same clean checkout and changes only one thing:
Reader `R100`, Book `B1234`, checkout `2026-10-01`, due `2026-10-04` (3 days), fines `0`, books already out `0`, status Available.

"Blocked" means the message below the button explains why, the cursor moves to the field that failed, and the page does not reload.

## Submit-time results

| # | Rule | Test | Type | What changed | Expected | Actual | Result |
|---|---|---|---|---|---|---|---|
| 1 | All | Clean checkout | Valid | nothing | Passes | "Client-side checks passed. The system will confirm the checkout later." | PASS |
| 2 | BR-1 | Fines exactly $10.00 | Boundary | fines `10.00` | Passes | "Client-side checks passed..." | PASS |
| 3 | BR-1 | Fines $10.01 | Boundary | fines `10.01` | Blocked | "Checkout blocked: fines are over the $10.00 limit. Pay your fines first." | PASS |
| 4 | BR-2 | Book already Checked Out | Invalid | status Checked Out | Blocked | "Checkout blocked: this book is not available. Choose an available book." | PASS |
| 5 | BR-2 | Book Lost | Invalid | status Lost | Blocked | "Checkout blocked: this book is not available. Choose an available book." | PASS |
| 6 | BR-3 | On hold for this reader | Valid | status On Hold, hold placed by `R100` | Passes | "Client-side checks passed..." | PASS |
| 7 | BR-3 | On hold for another reader | Invalid | status On Hold, hold placed by `R200` | Blocked | "Checkout blocked: this book is on hold for another reader. Choose a different book." | PASS |
| 8 | BR-4 | 2 books already out (this is book 3) | Boundary | books out `2` | Passes | "Client-side checks passed..." | PASS |
| 9 | BR-4 | 3 books already out (this would be book 4) | Boundary | books out `3` | Blocked | "Checkout not allowed! You can only check out up to 3 books." | PASS |
| 10 | BR-5 | Due 5 days after checkout | Boundary | due `2026-10-06` | Passes | "Client-side checks passed..." | PASS |
| 11 | BR-5 | Due 6 days after checkout | Boundary | due `2026-10-07` | Blocked | "Checkout blocked: the due date must be 1 to 5 calendar days after the checkout date." | PASS |
| 12 | BR-5 | Due the same day | Boundary | due `2026-10-01` | Blocked | "Checkout blocked: the due date must be 1 to 5 calendar days after the checkout date." | PASS |
| 13 | BR-5 | 5 days across a month end | Boundary | checkout `2026-09-29`, due `2026-10-04` | Passes | "Client-side checks passed..." | PASS |

**Summary: 13 of 13 passed.**

## Page checks

| Check | Expected | Actual | Result |
|---|---|---|---|
| Open the page with DevTools Console open | No errors; rule tests print | No errors; rule tests print | PASS |
| Phone width (375px) | No sideways scrolling; form fields stack | No sideways scrolling | PASS |
| On Hold selected, then changed to Available | Hold Placed By box appears, then hides and clears | Appears, then hides and clears | PASS |

## Bug found and fixed during this test

`app.js` used a "Books Currently Checked Out" field (`#itemsOut`) for BR-4, but the field was missing from the HTML. The script stopped with `Cannot read properties of null (reading 'addEventListener')` before the submit listener was attached, so no rule blocked the form and it reloaded the page instead. Adding the field to `transaction-form.html` fixed it, and every test above was re-run afterwards.
