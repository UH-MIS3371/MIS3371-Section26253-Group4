"use strict";

/*
 * MIS 3371 | Week 8 | ShelfLife LOCAL BACKEND LOGIC
 * Business scenario: Library Book Checkout
 *
 * MENTAL MODEL:
 *    incoming checkout object
 *       -> validate its data
 *       -> apply business rules
 *       -> return one structured result object
 *
 * WHY: Browser checks help the reader, but are not authoritative. This function
 * re-checks the critical rules on its own. No HTTP server, no database, nothing is saved.
 *
 * Rules enforced here: BR-5 (due date within 5 days), BR-1 (fines over $10.00),
 * BR-4 (at most 3 books checked out), BR-3 (hold belongs to another reader),
 * BR-2 (book must be Available).
 */

const FINE_LIMIT = 10.00;       // BR-1
const MAX_LOAN_DAYS = 5;        // BR-5
const MAX_CHECKOUT_ITEMS = 3;   // BR-4

// Turn a Date into "YYYY-MM-DD" text so two dates can be compared in date order.
function formatDate(dateObject) {
  const year = dateObject.getFullYear();
  const month = String(dateObject.getMonth() + 1).padStart(2, "0");
  const day = String(dateObject.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Add days to a "YYYY-MM-DD" date. setDate() handles month ends (Sept 29 + 5 = Oct 4).
function addDays(dateString, days) {
  const date = new Date(dateString + "T00:00:00");
  date.setDate(date.getDate() + days);
  return formatDate(date);
}

// A real date in YYYY-MM-DD form. The round trip rejects impossible dates:
// "2026-02-31" becomes "2026-03-03", which no longer matches.
function isRealDate(dateString) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return false;
  }
  return formatDate(new Date(dateString + "T00:00:00")) === dateString;
}

// BR-5: due after the checkout date, and no more than 5 days after it.
function dueDateWithinLoanLimit(checkoutDate, dueDate) {
  return dueDate > checkoutDate && dueDate <= addDays(checkoutDate, MAX_LOAN_DAYS);
}

// BR-1: exactly $10.00 is allowed; only an amount OVER the limit blocks.
function exceedsFineLimit(amount) {
  return amount > FINE_LIMIT;
}

// BR-4: itemsOut is how many books the reader ALREADY has. This checkout adds one,
// so 2 out (this is book 3) is allowed and 3 out (this would be book 4) is blocked.
function exceedsItemLimit(itemsOut) {
  return itemsOut + 1 > MAX_CHECKOUT_ITEMS;
}

// BR-3: true when the book is on hold for someone other than this reader.
function holdBlocksCheckout(bookStatus, holdReaderId, readerId) {
  return bookStatus === "on-hold" && holdReaderId !== readerId;
}

// BR-2: only an Available book can be checked out.
function isBookAvailable(bookStatus) {
  return bookStatus === "available";
}

// One reusable shape for an unsuccessful result.
function fail(message) {
  return {
    success: false,
    message
  };
}

// An in-memory demonstration counter. It resets whenever Node starts again.
// It is NOT a persistent database sequence or official ID system.
let transactionSequence = 0;

function createTransactionId() {
  transactionSequence += 1;
  return `CHK-${Date.now()}-${transactionSequence}`;
}

/**
 * Process one checkout request.
 * @param {object} checkout - { readerId, bookId, checkoutDate, dueDate, fines, itemsOut, bookStatus, holdReaderId }
 * @returns {object} Decision/result, NOT a transaction saved to a database.
 */
function processCheckout(checkout) {
  // STEP 1: Read incoming fields. Do not assume browser validation happened.
  const readerId = String(checkout.readerId || "").trim();
  const bookId = String(checkout.bookId || "").trim();
  const checkoutDate = String(checkout.checkoutDate || "").trim();
  const dueDate = String(checkout.dueDate || "").trim();
  const bookStatus = String(checkout.bookStatus || "").trim();
  const holdReaderId = String(checkout.holdReaderId || "").trim();
  const finesText = String(checkout.fines === undefined || checkout.fines === null ? "" : checkout.fines).trim();
  const fines = Number(finesText);
  const itemsOutText = String(checkout.itemsOut === undefined || checkout.itemsOut === null ? "" : checkout.itemsOut).trim();
  const itemsOut = Number(itemsOutText);

  // STEP 2: Validate the data before applying business rules.
  if (!readerId) {
    return fail("Reader ID is required.");
  }

  if (!bookId) {
    return fail("Book barcode or ISBN is required.");
  }

  if (!isRealDate(checkoutDate)) {
    return fail("Checkout date must be a real date (YYYY-MM-DD).");
  }

  if (!isRealDate(dueDate)) {
    return fail("Due date must be a real date (YYYY-MM-DD).");
  }

  // finesText is checked too because Number("") is 0, which would hide a missing amount.
  if (finesText === "" || !Number.isFinite(fines) || fines < 0) {
    return fail("Fines must be a number that is 0 or more.");
  }

  // A count of books must be a whole number: 2.5 books or -1 books makes no sense.
  if (itemsOutText === "" || !Number.isInteger(itemsOut) || itemsOut < 0) {
    return fail("Books currently checked out must be a whole number that is 0 or more.");
  }

  if (!bookStatus) {
    return fail("Book status is required.");
  }

  // STEP 3: Apply the business rules, in the same order as the frontend submit gate.
  if (!dueDateWithinLoanLimit(checkoutDate, dueDate)) {
    return fail("Due date must be 1 to 5 calendar days after the checkout date.");
  }

  if (exceedsFineLimit(fines)) {
    return fail("Checkout blocked: fine limit exceeded.");
  }

  if (exceedsItemLimit(itemsOut)) {
    return fail("Checkout blocked: checkout limit of 3 books reached.");
  }

  // BR-3 runs before BR-2: a held book is decided by who placed the hold.
  if (bookStatus === "on-hold") {
    if (!holdReaderId) {
      return fail("This book is on hold. The reader who placed the hold must be identified.");
    }
    if (holdBlocksCheckout(bookStatus, holdReaderId, readerId)) {
      return fail("Checkout blocked: this book is on hold for another reader.");
    }
  } else if (!isBookAvailable(bookStatus)) {
    return fail("Checkout blocked: book is not available.");
  }

  // STEP 4: Route the valid checkout. A book held for THIS reader takes the Hold pickup
  // path and the hold is fulfilled; an Available book takes the Standard path.
  // IMPORTANT: no database exists yet. "Checked Out" means accepted by this function,
  // not stored.
  const holdFulfilled = bookStatus === "on-hold";
  const checkoutPath = holdFulfilled ? "Hold pickup" : "Standard";

  return {
    success: true,
    status: "Checked Out",
    checkoutPath,
    holdFulfilled,
    readerId,
    bookId,
    checkoutDate,
    dueDate,
    transactionId: createTransactionId(),
    checkedOutAt: new Date().toISOString(),
    message: holdFulfilled
      ? "Checkout approved. The reader's hold was fulfilled."
      : "Checkout approved."
  };
}

// Make this function available to other LOCAL Node.js files.
// Example: const { processCheckout } = require("./backend");
module.exports = {
  processCheckout
};
