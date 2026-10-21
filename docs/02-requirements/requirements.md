# ShelfLife — Functional Requirements

FR-1: The system shall allow a reader or circulation clerk to initiate a checkout for one book at a time.

FR-2: The system shall capture reader ID, book barcode/ISBN, checkout date, due date, and optional notes.

FR-3: The system shall verify the scanned barcode or entered ISBN matches an existing book record before proceeding (BR-7).

FR-4: The system shall verify the book's status is "Available" before allowing checkout (BR-2).

FR-5: The system shall reject the checkout if the book has an active hold placed by another reader (BR-3).

FR-6: The system shall reject the checkout if the reader's outstanding fines exceed the library's allowed fine limit (BR-1).

FR-7: The system shall reject the checkout if it would cause the reader to exceed the maximum checkout-items limit (BR-4).

FR-8: The system shall accept a due date only if it is 1 to 5 calendar days after the checkout date, and reject any other due date with a clear reason (BR-5).

FR-9: The system shall ensure only one reader can successfully complete checkout on a given physical book, even if two attempts occur at the same time (BR-6).

FR-10: Upon successful checkout, the system shall update the book's status from "Available" to "Checked Out."

FR-11: The system shall assign a unique transaction ID to each completed checkout.

FR-12: The system shall display a clear success or rejection message, including the specific reason for any rejection (e.g., fine limit, hold, item limit, invalid barcode).

FR-13: The system shall allow an authorized circulation desk clerk to override or manually resolve exception cases (e.g., barcode scan failure) to complete a checkout.

ShelfLife – Quality / Nonfunctional Requirements (NFR)

NFR-1: The checkout form shall be usable by keyboard and use accessible labels.

NFR-2: Rejection and required-field feedback shall clearly state what the reader/clerk must correct (e.g., which rule was violated).

NFR-3: The system shall record all checkout attempts, status changes, and timestamps for auditability, per BR-6's concurrency requirement.

NFR-4: The interface shall remain usable on common circulation-desk and staff workstation screen sizes.

NFR-5: Concurrent checkout attempts on the same book shall resolve within a short, consistent time so only one succeeds (supports BR-6 testability).

NFR-6: The project shall use fictional or non-sensitive reader and book data for any demo.
