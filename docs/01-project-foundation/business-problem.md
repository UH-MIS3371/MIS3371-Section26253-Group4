# ShelfLife — Business Problem and Scope

Scope:

- Capturing checkout requests (Reader ID, item barcode/ISBN, checkout date, due date, optional notes)

- Enforcing checkout business rules (fine limits, item availability/hold status, max-items-per-reader caps, reference-only/reserve restrictions, reader-type-based loan periods)

- tracking item state transitions (Available → Checked Out → Renewed/Overdue, plus Lost/Damaged)

- handling exception cases like concurrent checkout attempts, barcode scan failures, and invalid checkout attempts on restricted items.

Out-of-scope: this scenario only covers the *checkout* transaction. No returns, holds/reservations as their own transaction, fine payment processing, cataloging/acquisitions, or reader account management.
