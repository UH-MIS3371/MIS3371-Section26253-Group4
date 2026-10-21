# ShelfLife — Main Transaction

TRANSACTION EVENT

Reader requests to check out a book

TRIGGER

Reader wants to borrow a specific book or item.

INPUTS

Reader ID, item barcode/ISBN, requested checkout date, due date.

SYSTEM ACTION

Check fine balance, item availability, and checkout limit; assign checkout ID/status.

OUTCOME

Approve and check out, or reject with a reason (fines owed, item unavailable, limit reached).

OFFICIAL RECORD

Checkout ID, Reader ID, item, checkout date, due date, status, timestamps.
