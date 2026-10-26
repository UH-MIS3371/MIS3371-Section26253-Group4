# ShelfLife — Traceability Matrix

Traceability shows why each requirement exists, which business rule controls it, where it is built, and how it is tested. It connects the Week 2–3 design documents to the code in `src/`, `backend/`, and `server/`.

User story IDs follow the order of the stories in [user-stories-acceptance.md](user-stories-acceptance.md):

| ID | User story |
|---|---|
| US-1 | Reader checks out a book and learns the due date |
| US-2 | Reader is told why a checkout was rejected |
| US-3 | Librarian: only one successful checkout per physical item |
| US-4 | Librarian: barcode/ISBN must match an existing record |
| US-5 | Librarian: override a blocked checkout with a reason |
| US-6 | IT administrator: audit log records which staff member processed each checkout |
| US-7 | IT administrator: detailed log of override actions |

---

## 1. Business need → requirement → rule → test direction

| Business Need | Requirement | User Story | Rule(s) | Evidence / Test Direction |
|---|---|---|---|---|
| Readers with unpaid fines do not borrow more | FR-6 | US-1, US-2 | BR-1 | Test fines $10.00 (allowed) and $10.01 (blocked) |
| Only books on the shelf are lent | FR-4, FR-10 | US-1, US-2 | BR-2 | Test Available (allowed), Checked Out and Lost (blocked) |
| Holds are honored | FR-5 | US-2 | BR-3 | Test hold placed by this reader (allowed) and by another reader (blocked) |
| Fair access to the collection | FR-7 | US-1, US-2 | BR-4 | Test 2 books already out (allowed) and 3 (blocked) |
| Books come back on time | FR-8 | US-1 | BR-5 | Test due +5 days (allowed), +6 days and same day (blocked), month end |
| No double checkouts | FR-9 | US-3 | BR-6 | Two simultaneous attempts on one copy; only one succeeds (database weeks) |
| Checkouts reference real books | FR-3 | US-4 | BR-7 | Unknown barcode/ISBN is rejected (database weeks) |
| Complete checkout requests | FR-1, FR-2 | US-1 | — | Blank reader ID or book ID is rejected |
| Reliable identity | FR-11 | US-6 | — | Each accepted checkout gets a unique transaction ID |
| Clear feedback | FR-12, NFR-2 | US-2 | BR-1 – BR-5 | Every rejection names the rule that failed |
| Exception handling by staff | FR-13 | US-5, US-7 | — | Override with reason is logged (not in the course build) |
| Auditable history | NFR-3 | US-6, US-7 | BR-6 | Attempts, status changes, and timestamps are stored (database weeks) |
| Accessible entry | NFR-1, NFR-4 | US-1 | — | Keyboard use, visible labels, layout at 375px and desktop widths |
| Safe demo data | NFR-6 | — | — | Tests use fictional readers and books (`R100`, `B1234`) |
| Trusted enforcement | FR-4 – FR-8 | US-2 | BR-1, BR-2, BR-3, BR-4, BR-5 | Backend rejects bad checkouts even when the browser form is bypassed |

---

## 2. Business rule → implementation → tests

Where each rule is built and how it is checked. Form fields are the HTML `id` values in `src/transaction-form.html`. Backend test numbers refer to `backend/test-backend.js` and the results table in [week8-backend-testing.md](../08-local-backend/week8-backend-testing.md). Browser test rows refer to [browser-test-log.md](../04-07-client-side/browser-test-log.md).

| Rule | Requirement | Form field(s) | `app.js` functions | Backend (`backend.js`) | Backend tests | Browser tests | Week 9 API tests | Status |
|---|---|---|---|---|---|---|---|---|
| **BR-1** Fines must not exceed $10.00 | FR-6 | `fineInput` | `exceedsFineLimit`, `updateFineMessage`, `checkFinesAtSubmit` | `exceedsFineLimit` | 7 ($10.00), 8 ($10.01) | 2, 3 | Fines $10.00, Fines $10.01 | Browser + backend |
| **BR-2** Book must be Available | FR-4, FR-10 | `bookStatus` | `isBookAvailable`, `updateBookStatusMessage`, `checkBookStatusAtSubmit` | `isBookAvailable` | 1, 4 (Lost), 5 (Checked Out) | 4, 5 | Clean checkout | Browser + backend |
| **BR-3** Hold for another reader blocks checkout | FR-5 | `bookStatus`, `holdReaderId`, `reader-id` | `isBookOnHold`, `holdBlocksCheckout`, `updateHoldFieldVisibility`, `updateBookStatusMessage`, `checkHoldAtSubmit` | `holdBlocksCheckout`; Hold pickup routing in `processCheckout` | 2 (own hold), 3 (other reader) | 6, 7 | Reader picks up own hold, Book on hold for another reader | Browser + backend |
| **BR-4** At most 3 books checked out | FR-7 | `itemsOut` | `exceedsItemLimit`, `updateItemsOutMessage`, `checkItemsAtSubmit` | `exceedsItemLimit` | 13 (2 out), 14 (3 out), 15 (blank) | 8, 9 | — | Browser + backend |
| **BR-5** Due 1 to 5 calendar days after checkout | FR-8 | `checkout-date`, `due-date` | `formatDate`, `addDays`, `dueDateWithinLoanLimit`, `updateDueDateMessage`, `checkDueDateAtSubmit` | `isRealDate`, `addDays`, `dueDateWithinLoanLimit` | 9 (+5), 10 (+6), 11 (same day), 12 (month end) | 10 – 13 | Due 6 days after checkout | Browser + backend |
| **BR-6** One reader per physical copy at a time | FR-9 | — | — (BR-2 blocks a copy already marked Checked Out) | — | — | — | — | Planned: Week 11 database |
| **BR-7** Barcode/ISBN must match a book record | FR-3 | `book-id` | Native `required` + `pattern` (non-blank only) | Non-blank check only ("Book barcode or ISBN is required.") | — | — | — | Partial; record lookup planned for Week 11 |

### Other requirements built so far

| Requirement | Where it is built | Evidence |
|---|---|---|
| FR-2 Capture reader ID, book, dates, notes | `src/transaction-form.html` (`reader-id`, `book-id`, `checkout-date`, `due-date`, `notes`) | Backend test 6 (reader ID missing); Week 9 API test "Reader ID missing" |
| FR-11 Unique transaction ID | `createTransactionId` in `backend.js` | Demo ID on every accepted backend result; not permanent until Week 11 |
| FR-12 Specific rejection message | `formMessage` in `app.js`; `fail(message)` in `backend.js` | Every rejection test compares the exact message |
| NFR-1 Keyboard and labels | `<label for>` on every field; `:focus` styles in `styles.css` | Manual keyboard check |
| NFR-4 Usable screen sizes | `@media (max-width: 600px)` in `styles.css` | Browser test log: no sideways scrolling at 375px |
| NFR-6 Fictional data | Test data `R100`, `R200`, `B1234` | All test files |

---

## 3. Gaps and design changes

These are the places where the built system does not yet match the design, and the plan for each.

| Item | Design says | Built system | Plan |
|---|---|---|---|
| BR-6 and BR-7 | Checked against stored records | No stored records yet | Week 11 (DynamoDB) |
| FR-13, US-5, US-7 overrides | Clerk can override a blocked checkout | Not built | Outside the required course scope |
| Fines, status, hold, books out | Data dictionary: looked up from stored records (`fineBalanceAtCheck`, `itemStatusAtCheck`, `heldForOtherReader`, `activeLoansAtCheck`) | Entered on the form | Looked up by the backend once records exist (Week 11) |

### Resolved

| Item | Was | Resolution |
|---|---|---|
| BR-4 in the backend | Enforced in the browser only | `processCheckout` now checks `itemsOut`; backend tests 13 – 15 |
| BR-5 / FR-8 due date | FR-8 said the due date is calculated as checkout + 5 days, but the form lets the reader choose | FR-8, the data dictionary, architecture, responsibility matrix, and US-1 now say the reader chooses a due date 1 to 5 days after checkout |
| Restricted items and reader-type loan periods | Listed in the business problem scope with no business rule | Moved to out of scope in the business problem; removed from US-2 and the architecture notes |

---

## Why This Matters

A project is stronger when the team can answer:

- Why does this field exist?
- Which requirement does this feature satisfy?
- Which business rule controls this behavior?
- How will we test it?
- Which system tier is responsible?

If an implementation decision cannot be traced back to a requirement or business need, the feature may be unnecessary or poorly defined.
