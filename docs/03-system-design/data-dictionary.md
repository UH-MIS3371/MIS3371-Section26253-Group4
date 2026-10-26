# ShelfLife — Checkout Data Dictionary

Week 3 Group Design Checkpoint

This dictionary defines 20 fields for one reader checking out one physical library book: 17 core checkout fields and 3 future override fields. It supports input capture, eligibility checks, the planned official checkout record, and audit history. A successful checkout changes an Available copy, or a copy On Hold for the requesting reader, to Checked Out. The reader or clerk chooses a due date 1 to 5 calendar days after checkout; the application validates that range (BR-5, FR-8).

The scope is checkout only, including pickup of the requesting reader's own hold. Renewals, returns, and overdue processing are outside this transaction. Staff overrides are future functionality outside the required course build, as recorded in the [traceability matrix](../02-requirements/traceability-matrix.md). The dictionary describes the target data contract; the current local backend returns a demo result without saving a loan or audit history.

# Request and loan details

| **Field**      | **Business meaning**                                         | **Type** | **Required**    | **Source**           | **Rule or constraint**                                                                              | **Example**                         |
|----------------|--------------------------------------------------------------|----------|-----------------|----------------------|-----------------------------------------------------------------------------------------------------|-------------------------------------|
| checkoutId     | Unique identity of a checkout request and its audit history. | Text     | Yes, when saved | System-assigned      | Unique, immutable and never reused; retain for rejected attempts too.                               | CHK-000128                          |
| readerId       | Reader requesting the loan.                                  | Text     | At submission   | User-entered         | Must resolve to an existing reader before success; preserve leading zeros.                          | R01045                              |
| bookIdentifier | Barcode or ISBN entered or scanned for lookup.               | Text     | At submission   | User-entered         | Must match an existing catalog/copy record (BR-7). ISBN alone does not identify a physical copy.    | BC-004812                           |
| itemCopyId     | Specific physical copy selected for this loan.               | Text     | Before success  | System-assigned      | Resolved from catalog; if ISBN matches multiple copies, select one eligible copy before completion. | COPY-004812                         |
| checkoutDate   | Calendar date on which the loan starts.                      | Date     | At submission   | User-entered         | Valid date, confirmed by the application when the checkout is completed.                            | 2026-09-14                          |
| dueDate        | Date the borrowed copy is due.                               | Date     | At submission   | User-entered         | 1 to 5 calendar days after checkoutDate (BR-5, FR-8); the application rejects any other date.       | 2026-09-19                          |
| notes          | Optional checkout-related comments.                          | Text     | No              | User-entered         | May be blank; treat as text, not executable markup.                                                 | Reader requested a printed receipt. |

Source key: User-entered = supplied by a reader or clerk. Derived / calculated = computed from other values. System-assigned = assigned by the application or populated from authoritative stored records. Examples are fictional.

# Transaction state and audit fields

| **Field**         | **Business meaning**                                          | **Type**    | **Required**                  | **Source**      | **Rule or constraint**                                                                    | **Example**                  |
|-------------------|---------------------------------------------------------------|-------------|-------------------------------|-----------------|-------------------------------------------------------------------------------------------|------------------------------|
| status            | Current condition of the checkout transaction.                | Enum / text | Yes                           | System-assigned | Draft, Submitted, Completed or Rejected; only the application changes it.                 | Completed                    |
| rejectionReason   | Specific explanation when checkout is denied.                 | Text        | If Rejected                   | System-assigned | Required for Rejected; otherwise null. Identify the failed check or concurrency conflict. | Item is already checked out. |
| createdAt         | Time the request record was first saved.                      | DateTime    | Yes                           | System-assigned | Trusted server UTC time; immutable.                                                       | 2026-09-14T15:00:00Z         |
| submittedAt       | Time the request was accepted for processing.                 | DateTime    | After submission              | System-assigned | Trusted UTC time \>= createdAt; null for an unsubmitted Draft.                            | 2026-09-14T15:01:00Z         |
| completedAt       | Time the successful checkout was committed.                   | DateTime    | If Completed                  | System-assigned | Trusted UTC time \>= submittedAt; null for Draft, Submitted and Rejected.                 | 2026-09-14T15:01:02Z         |
| processedBy       | Account responsible for submitting or processing the request. | Text        | At submission                 | System-assigned | Take from authenticated reader/clerk session, never an editable staff ID.                 | STAFF-0209                   |
| itemStatusAtCheck | Copy status used in the eligibility decision.                 | Enum / text | Before decision if copy found | System-assigned | Snapshot from the item record; must be Available, or On Hold for this reader (BR-3 hold-pickup exception to BR-2), at successful commit; no duplicate active loan (BR-6).       | Available                    |

## State meanings and required values

Draft is an incomplete saved request. Submitted is awaiting checks and a committed outcome. Completed means the loan and item update were saved successfully. Rejected means the attempt was denied with a reason. The planned transaction transitions are Draft → Submitted → Completed or Draft → Submitted → Rejected; Completed and Rejected are terminal outcomes for that attempt.

These transaction statuses are separate from item statuses. Available, On Hold, and Checked Out describe a physical copy, not a checkout request. The [state transition diagram](state-transition-diagram.md) shows these transaction statuses: Draft → Submitted → Completed or Rejected. A rejected attempt does not change; the reader starts a new Draft after correcting the problem.

For a standard checkout, the item changes Available → Checked Out. For a hold pickup, it changes On Hold → Checked Out only when the active hold belongs to readerId; that hold is fulfilled. A hold for another reader or an unidentified hold owner blocks checkout. Pickup of one's own hold is a normal eligibility path, not a staff override.

Fields marked At submission can be blank in Draft. A rejected request may lack itemCopyId or eligibility snapshots when the reader or item lookup fails. Preserve the entered identifiers and rejection reason for that attempt; corrections after rejection start a new request linked in the audit history.

# Eligibility snapshots and exception handling

| **Field**          | **Business meaning**                                  | **Type**           | **Required**                             | **Source**                     | **Rule or constraint**                                                                               | **Example**                                  |
|--------------------|-------------------------------------------------------|--------------------|------------------------------------------|--------------------------------|------------------------------------------------------------------------------------------------------|----------------------------------------------|
| fineBalanceAtCheck | Reader fine balance used for eligibility.             | Decimal            | Before decision if reader found          | System-assigned                | Read from reader account; nonnegative currency amount. Reject if above $10.00; exactly $10.00 is allowed (BR-1). | 0.00                                         |
| activeLoansAtCheck | Reader active-loan count used for eligibility.        | Integer            | Before decision if reader found          | Derived / calculated           | Count active loans; reject if count + 1 exceeds 3; 2 existing loans are allowed, 3 are blocked (BR-4).                  | 2                                            |
| heldForOtherReader | Whether an active hold belongs to a different reader. | Boolean            | Before decision if reader and copy found | Derived / calculated           | Compare current hold owner with readerId. True blocks checkout; false alone does not establish availability or identify a hold owner (BR-2, BR-3).                        | false                                        |
| overrideBy         | Clerk who authorized an exception override.           | Text               | If override used                         | System-assigned                | Authenticated, authorized clerk ID; otherwise null. Log each override event.                         | STAFF-0209                                   |
| overrideReason     | Clerk explanation for the exception resolution.       | Text               | If override used                         | User-entered                   | Nonblank for override; otherwise null. Record enough detail to explain the action.                   | Barcode scan failed; copy verified manually. |
| overriddenRules    | Rule or validation check covered by the override.     | List of text codes | If override used                         | User-entered, server-validated | Record only permitted checks; preserve identity and concurrency constraints. Otherwise empty.        | \[BR-7 scan resolution\]                     |

The three override fields (`overrideBy`, `overrideReason`, `overriddenRules`) are reserved for future functionality outside the required course build (FR-13, US-5, US-7). Their conditional requirements apply only if overrides are implemented later; current checkout does not accept overrides. Otherwise, overrideBy and overrideReason are null and overriddenRules is empty.

## Authoritative checks and persistence

The application rechecks current reader fines, loan count, item availability, holds and the due date range before committing. The current policy permits fines up to and including $10.00 and at most 3 active loans after checkout. An Available copy is eligible subject to all other checks; an On Hold copy is eligible only for its identified hold owner. This own-hold exception reflects the current browser and backend behavior. Eligibility snapshots document the decision and do not replace current library records.

Save the successful checkout, item status change and audit event together. Concurrent attempts for the same copy must allow only one success; record the losing attempt as Rejected with a reason. Enforce the reader loan limit consistently under concurrent requests too. A restricted or unavailable item cannot become a successful checkout solely because a rejection message was displayed.

## Planned audit and future override rules

Keep append-only events linked by checkoutId for submissions, outcomes, state changes and overrides. Each event records the actor, trusted UTC time, previous and next status, and reason; override events also retain the affected rule and clerk justification. Only permitted exceptions may be overridden. Manual barcode resolution must still identify an existing physical copy, and no override may create a duplicate active loan for that copy.

## Form and current implementation mapping

Following the instructor's [reference data dictionary](https://github.com/sasadi2/MIS3371-TPS-Reference-Project/blob/main/docs/03-system-design/data-dictionary.md), input fields are separate from derived, system/control, and audit fields.

| Category | Dictionary fields | Current form / backend mapping |
|---|---|---|
| User-provided | readerId, bookIdentifier, checkoutDate, dueDate, notes | Form IDs: `reader-id`, `book-id`, `checkout-date`, `due-date`, `notes`. The backend calls bookIdentifier `bookId`; notes are captured in the form but not processed by the current backend. |
| Reference / derived | itemCopyId, itemStatusAtCheck, fineBalanceAtCheck, activeLoansAtCheck, heldForOtherReader | The demo supplies `bookStatus`, `fines`, `itemsOut`, and conditional `holdReaderId` through editable form inputs. heldForOtherReader is calculated by comparing the hold owner with readerId. These supplied values are test inputs, not trusted catalog/account lookups. Physical-copy resolution and stored-record checks are planned. |
| System / control | checkoutId, status, rejectionReason, processedBy | Planned application-controlled fields. The demo returns `transactionId` on success and `message` on failure; it does not persist rejected attempts or identify an authenticated actor. Its response `status: "Checked Out"` is a book outcome label, not the planned transaction status Completed. |
| Audit | createdAt, submittedAt, completedAt | Planned trusted timestamps. The demo returns `checkedOutAt` on success, but has no saved request lifecycle or durable audit log. |
| Future override | overrideBy, overrideReason, overriddenRules | Outside the required course build; no current form or backend override path. |

Official transaction identity, transaction status, actor identity, reference values, and audit timestamps must be created or verified by the application using trusted records and session information. They must not be accepted as authoritative merely because a browser supplied them. When represented in the interface, system and audit fields should be non-editable, with placeholders until available; this dictionary does not imply that such a display is already implemented.

Design basis: [business rules](../02-requirements/business-rules.md) (BR-1 through BR-7), [requirements](../02-requirements/requirements.md) (FR-1 through FR-13 and NFR-3), [main transaction](../01-project-foundation/main-transaction.md), [user stories](../02-requirements/user-stories-acceptance.md), and the [traceability matrix](../02-requirements/traceability-matrix.md). BR-5 and FR-8 allow a selected due date 1 to 5 calendar days after checkout; five days is the maximum, not a fixed loan length.

