# ShelfLife — State Transition Diagram and State Definitions

# 1. State transition diagram

![State transition diagram for a library book](images/state-transition-diagram.jpeg)

# 2. State definitions

| **State**      | **Definition**                                                                                                                  |
|----------------|---------------------------------------------------------------------------------------------------------------------------------|
| Available      | The book(s) is available to checkout                                                                                            |
| Checked Out    | The book is not available to check out anymore, needs to wait for another reader to return the book                             |
| Renewed        | The reader extended the loan before the due date. The due date moves forward and the reader keeps the book for a longer period. |
| Overdue        | The due date has passed while the reader still have the book                                                                    |
| Returned       | The book has been physically checked in by staff or the kiosk.                                                                  |
| Lost / Damaged | The book is reported lost (directly from Overdue, no physical return) or found damaged at check-in (from Returned).             |

# 3. Key transitions

- Available → Checked Out: checkout request approved.

- Checked Out → Renewed: renewal requested before due date

- Checked Out / Renewed → Overdue: due date passes with no return or renewal.

- Checked Out / Renewed / Overdue → Returned: reader returns the book, on time or late.

- Returned → Available: book checked in and passes condition inspection.

- Returned → Lost/Damaged: book checked in but found damaged.

- Overdue → Lost/Damaged: book reported lost while still outstanding.
