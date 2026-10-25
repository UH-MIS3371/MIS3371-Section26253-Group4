# ShelfLife — User Stories and Acceptance Criteria

READER:

As a **reader**, I want to check out a book so that I know it's reserved for me and when it's due.

> Acceptance: Given the item is Available, the reader has no blocking fines and is under their item limit, when the reader submits a checkout request, then the item status changes to Checked Out with the due date the reader chose (1 to 5 days after checkout).

As a **reader**, I want to be told why my checkout was rejected so that I know what to fix.

> Acceptance: Given a business rule is violated (fines over limit, item not available, item on hold for another reader, at item cap, or due date outside 1 to 5 days), when the reader submits a checkout request, then the system returns a rejection with the specific reason.

LIBRARIAN:

As a **librarian**, I want the system to allow only one successful checkout per physical item so that I can avoid duplicate transactions.

> Acceptance: Given two simultaneous checkout attempts on the same item, when both are submitted, then only the first succeeds and the second is rejected with an "already checked out" reason.

As a **librarian**, I want the system to validate the scanned barcode/ISBN against an existing record so that I don't process a checkout for an unrecognized item.

> Acceptance: Given a barcode or ISBN that doesn't match any book record, when a checkout is attempted, then the system rejects it and flags it as an invalid item.

As a **librarian**, I want to override a blocked checkout when appropriate so that I can resolve valid exceptions.

> Acceptance: Given a checkout blocked by a business rule, when I apply a staff override with a reason, then the checkout completes and the override is logged.

IT ADMINISTRATORS:

As an **IT administrator**, I want the audit log to record which staff member processed each checkout so that I can trace accountability for every transaction.

> Acceptance: Given a circulation clerk processes a checkout (standard or override), when the transaction completes, then the system records a timestamped log entry linking the clerk's staff ID to the specific checkout transaction and item.

As an **IT administrator**, I want detailed logs of staff override actions so that I can verify the legitimacy of manually approved checkouts.

> Acceptance: Given a librarian overrides a blocked checkout, when the override is applied, then the system records a timestamped log entry with the clerk's ID, the overridden rule, the reason provided, and the affected transaction.
