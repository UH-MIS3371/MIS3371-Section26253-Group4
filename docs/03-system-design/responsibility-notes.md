# ShelfLife — Responsibility Matrix

This matrix shows which system tier is responsible for each part of the book checkout transaction.

| **Responsibility**                              | **Presentation** | **Application** | **Data** | **Trace**    |
|-------------------------------------------------|------------------|-----------------|----------|--------------|
| Display checkout form                           | X                |                 |          | FR-1         |
| Collect reader ID, barcode/ISBN, notes          | X                |                 |          | FR-2         |
| Show required-field and rejection messages      | X                |                 |          | FR-12, NFR-2 |
| Keyboard access and accessible labels           | X                |                 |          | NFR-1        |
| Validate barcode/ISBN against book records      | UX only          | X               |          | FR-3, BR-7   |
| Check book is Available                         |                  | X               |          | FR-4, BR-2   |
| Check for hold by another reader                |                  | X               |          | FR-5, BR-3   |
| Check fine limit                                |                  | X               |          | FR-6, BR-1   |
| Check max-items limit                           |                  | X               |          | FR-7, BR-4   |
| Calculate due date (5 days)                     | Display only     | X               |          | FR-8, BR-5   |
| Allow only one checkout per book                |                  | X               | X        | FR-9, BR-6   |
| Authorize clerk overrides                       |                  | X               |          | FR-13        |
| Update status to Checked Out                    |                  | X               | X        | FR-10        |
| Generate transaction ID                         |                  | X               |          | FR-11        |
| Create audit timestamp                          |                  | X               |          | NFR-3        |
| Store checkout record and status                |                  |                 | X        | FR-10, FR-11 |
| Store audit log (attempts, staff ID, overrides) |                  |                 | X        | NFR-3        |

# Key Principle

The browser can help the user, but it is not the final authority. Client-side checks like required can be bypassed, so the application must re-check every business rule before saving.
