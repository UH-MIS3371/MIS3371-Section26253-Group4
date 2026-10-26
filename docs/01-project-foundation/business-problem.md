# ShelfLife — Business Problem and Scope

## Business Problem

Library checkout processes can result in inconsistent lending decisions when staff must manually verify reader eligibility, book availability, hold ownership, and loan limits.

ShelfLife addresses these issues by providing a structured book checkout request that validates the library's business rules and explains why a request is approved or rejected.

## In Scope

- Capture checkout requests containing Reader ID, book barcode or ISBN, checkout date, due date, and optional notes.
- Verify outstanding fines against the $10.00 limit.
- Verify book availability and hold ownership.
- Enforce the maximum of 3 checked-out books per reader.
- Validate due dates between 1 and 5 calendar days after checkout.
- Support Standard checkout and Hold pickup paths.
- Display specific approval or rejection messages.
- Assign transaction identifiers and maintain official records in later implementation stages.
- Prevent duplicate checkout transactions and verify book records during the database phase.

## Out of Scope

- Book returns and check-in processing.
- Renewals and overdue processing.
- Creating or managing holds as a separate transaction.
- Fine payment processing.
- Cataloging and acquisitions.
- Reader account management and authentication.
- Staff override functionality.
- Physical barcode-scanner integration.
- Different loan periods by reader type.
- Reference-only and reserve item restrictions.
