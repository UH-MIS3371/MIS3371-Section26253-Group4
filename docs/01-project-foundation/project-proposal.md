# Project Proposal
## ShelfLife — Library Book Checkout System

MIS 3371 Transaction Processing Systems I — Team 4

## 1. Proposed System

The proposed system is a web-based **library book checkout system** that lets a reader, or a circulation desk clerk on the reader's behalf, check out one physical library book.

The system focuses on one primary transaction:

> **Book Checkout Request**

The transaction begins when a reader asks to borrow a specific book and ends when the checkout is approved and recorded, or rejected with a specific reason.

---

## 2. Business Need

A library that tracks checkouts by hand, or with tools that do not enforce its policies, can run into several problems:

- Readers with large unpaid fines keep borrowing books.
- A book that is already checked out, lost, or on hold for someone else is lent anyway.
- One reader holds too many books at once, so others cannot borrow them.
- Loan periods are applied inconsistently, so due dates vary from desk to desk.
- Two staff members check out the same physical copy at the same time.
- A mistyped barcode or ISBN produces a checkout for a book that does not exist.
- Readers are rejected without being told why, so they do not know what to fix.
- Staff overrides and checkout history are hard to trace later.

ShelfLife provides one structured checkout record and applies the same rules to every request.

---

## 3. Primary Users / Stakeholders

| Stakeholder | Primary Need |
|---|---|
| Reader (students, faculty, community members) | Check out a book quickly and understand why a checkout is rejected |
| Librarian / Circulation desk clerk | Process counter checkouts, handle exceptions, and avoid duplicate checkouts |
| IT administrator | Keep the system reliable and trace who processed each checkout |

See [stakeholders.md](../02-requirements/stakeholders.md).

---

## 4. Main Transaction

### Transaction name
**Book Checkout Request**

### Transaction trigger
A reader wants to borrow a specific book.

### Inputs
Reader ID, book barcode or ISBN, requested checkout date, and due date (optional notes).

### System action
Check the reader's fine balance, the book's availability and hold status, and the reader's checkout limit, then assign a checkout ID and status.

### Transaction outcome
The request is either:

- approved, and the book's status changes from Available to Checked Out, or
- rejected with the specific reason (fines owed, book unavailable, on hold for another reader, limit reached, or invalid due date).

### Official record
Checkout ID, reader ID, book, checkout date, due date, status, and timestamps.

### Example transaction
Reader `R100` has `$4.50` in fines and 1 book already checked out. They ask to check out book `B1234`, which is Available, on `2026-10-01` with a due date of `2026-10-04`. Every rule passes, so the checkout is approved through the Standard path and the book's status becomes Checked Out.

If reader `R100` instead had `$10.01` in fines, the same request would be rejected with "Checkout blocked: fine limit exceeded."

See [main-transaction.md](main-transaction.md).

---

## 5. Business Rules

| Rule | Description |
|---|---|
| BR-1 | A reader may not check out a book if their outstanding fines exceed $10.00 |
| BR-2 | A book can only be checked out if its status is Available |
| BR-3 | A book on hold for another reader cannot be checked out; the reader who placed the hold may check it out |
| BR-4 | A reader may not have more than 3 books checked out |
| BR-5 | A book can be checked out for up to 5 calendar days |
| BR-6 | Only one reader may check out a specific physical copy at a time |
| BR-7 | The barcode or ISBN must match an existing book record |

See [business-rules.md](../02-requirements/business-rules.md) and the [traceability matrix](../02-requirements/traceability-matrix.md).

---

## 6. Initial Scope

### In scope

- Capture the reader ID, book barcode or ISBN, checkout date, due date, and optional notes
- Validate required values and real calendar dates
- Apply the checkout business rules (BR-1 to BR-7)
- Route a valid checkout through the Standard path or the Hold pickup path
- Show a clear success message or a specific rejection reason
- Assign a transaction ID and status, and record timestamps
- Save and retrieve one official checkout record (database weeks)

### Out of scope

- Book returns and check-in
- Placing or managing holds as their own transaction
- Fine payment processing
- Renewals
- Cataloging and acquisitions
- Reader account management and real authentication
- Real barcode-scanner hardware
- Integration with a production library system
- Reference-only or reserve item restrictions
- Different loan periods by reader type

---

## 7. Success Criteria

ShelfLife is successful when it demonstrates that a checkout can be:

1. entered through a usable, accessible form,
2. validated in the browser for a quick response,
3. checked again by a trusted backend that the browser cannot bypass,
4. evaluated against the business rules, including the boundary cases ($10.00 and $10.01 in fines, 3 and 4 books, 5 and 6 loan days),
5. assigned a controlled status and a transaction ID,
6. sent from the browser to the backend through an API,
7. saved as an official record, and
8. retrieved after it is saved.

---

## 8. Team

| Team member | Role |
|---|---|
| Lana Tran | Requirements / Product Lead |
| Syed Raza | UI / Accessibility Lead |
| Casey Nguyen | JavaScript / Logic Lead |
| Ebrahim Vejlani | Git / Integration Lead |
| Kim Nguyen | QA / Documentation Lead |

See [team-charter.md](team-charter.md).

---

## 9. Build Plan

| Course stage | ShelfLife deliverable | Status |
|---|---|---|
| Milestone 1, Weeks 1–3 | Business problem, requirements, rules, workflow, states, data dictionary, architecture | Complete |
| Weeks 4–7, Milestone 2 | Checkout form, responsive CSS, browser validation of BR-1 to BR-5 | Complete |
| Week 8 | Local Node.js backend enforcing BR-1 to BR-5 with tests | Complete |
| Week 9 | Local Express API; the form sends checkouts to the backend with `fetch()` | In progress |
| Week 10 | Backend logic in AWS Lambda behind API Gateway | Upcoming |
| Week 11 | DynamoDB: save and retrieve one checkout; BR-6 and BR-7 checks | Upcoming |
| Week 12 | End-to-end integration and testing | Upcoming |
