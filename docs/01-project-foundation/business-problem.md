# ShelfLife — Business Problem and Scope

Scope:

- Capturing checkout requests (Reader ID, item barcode/ISBN, checkout date, due date, optional notes)

- Enforcing checkout business rules (fine limit, item availability/hold status, max-items-per-reader cap, 5-day loan limit)

- tracking item state transitions (Available → Checked Out → Renewed/Overdue, plus Lost/Damaged)

- handling exception cases like concurrent checkout attempts and barcode scan failures.

Out-of-scope: this scenario only covers the *checkout* transaction. No returns, holds/reservations as their own transaction, fine payment processing, cataloging/acquisitions, reader account management, reference-only/reserve item restrictions, or different loan periods by reader type (every loan uses the same 5-day limit, BR-5).
