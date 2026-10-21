# ShelfLife — Checkout Data Dictionary

Week 3 Group Design Checkpoint

This dictionary defines 20 fields for one reader checking out one physical library book. It supports input capture, eligibility checks, the official checkout record, and audit history. A successful checkout changes the item from Available to Checked Out and sets a due date five calendar days after checkout.

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
| itemStatusAtCheck | Copy status used in the eligibility decision.                 | Enum / text | Before decision if copy found | System-assigned | Snapshot from the item record; must be Available at successful commit (BR-2, BR-6).       | Available                    |

## State meanings and required values

Draft is an incomplete saved request. Submitted is awaiting checks and a committed outcome. Completed means the loan and item update were saved successfully. Rejected means the attempt was denied with a reason. These transaction statuses are separate from item statuses such as Available and Checked Out.

Fields marked At submission can be blank in Draft. A rejected request may lack itemCopyId or eligibility snapshots when the reader or item lookup fails. Preserve the entered identifiers and rejection reason for that attempt; corrections after rejection start a new request linked in the audit history.

# Eligibility snapshots and exception handling

| **Field**          | **Business meaning**                                  | **Type**           | **Required**                             | **Source**                     | **Rule or constraint**                                                                               | **Example**                                  |
|--------------------|-------------------------------------------------------|--------------------|------------------------------------------|--------------------------------|------------------------------------------------------------------------------------------------------|----------------------------------------------|
| fineBalanceAtCheck | Reader fine balance used for eligibility.             | Decimal            | Before decision if reader found          | System-assigned                | Read from reader account; nonnegative currency amount. Reject if above configured fine limit (BR-1). | 0.00                                         |
| activeLoansAtCheck | Reader active-loan count used for eligibility.        | Integer            | Before decision if reader found          | Derived / calculated           | Count active loans; reject if count + 1 exceeds the configured reader limit (BR-4).                  | 2                                            |
| heldForOtherReader | Whether an active hold belongs to a different reader. | Boolean            | Before decision if reader and copy found | Derived / calculated           | Compare current hold owner with readerId. True blocks normal checkout (BR-3).                        | false                                        |
| overrideBy         | Clerk who authorized an exception override.           | Text               | If override used                         | System-assigned                | Authenticated, authorized clerk ID; otherwise null. Log each override event.                         | STAFF-0209                                   |
| overrideReason     | Clerk explanation for the exception resolution.       | Text               | If override used                         | User-entered                   | Nonblank for override; otherwise null. Record enough detail to explain the action.                   | Barcode scan failed; copy verified manually. |
| overriddenRules    | Rule or validation check covered by the override.     | List of text codes | If override used                         | User-entered, server-validated | Record only permitted checks; preserve identity and concurrency constraints. Otherwise empty.        | \[BR-7 scan resolution\]                     |

## Authoritative checks and persistence

The application rechecks current reader fines, loan count, item availability, holds and the due date range before committing. Fine limits and maximum-item limits come from library policy; no numeric limits are assumed here. Eligibility snapshots document the decision and do not replace current library records.

Save the successful checkout, item status change and audit event together. Concurrent attempts for the same copy must allow only one success; record the losing attempt as Rejected with a reason. Enforce the reader loan limit consistently under concurrent requests too. A restricted or unavailable item cannot become a successful checkout solely because a rejection message was displayed.

## Audit and override rules

Keep append-only events linked by checkoutId for submissions, outcomes, state changes and overrides. Each event records the actor, trusted UTC time, previous and next status, and reason; override events also retain the affected rule and clerk justification. Only permitted exceptions may be overridden. Manual barcode resolution must still identify an existing physical copy, and no override may create a duplicate active loan for that copy.

Design basis: milestone1 docs/business-rules.docx (BR-1 through BR-7), requirements.docx (FR-1 through FR-13 and NFR-3), main-transaction.docx, user-stories-acceptance.docx, and the Week 3 workflow and exception path. The specific five-day rule in BR-5 and FR-8 determines dueDate.
