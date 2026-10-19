/*BR-1: A reader may not check out an item if their outstanding fines exceed the library’s allowed fine limit.
BR-2: A book only be checked out if its current status is Available.
BR-3: A book with an active hold for another reader may not be checked out by the current reader.
BR-4: A reader cannot complete a checkout if doing so would cause them to exceed the maximum checkout items limit.
BR-5: A book can only be checked out for 5 calendar days.
BR-6: Only one reader may successfully check out a specific physical book at a time.
BR-7: A checkout may only proceed when the scanned barcode or entered ISBN matches an existing book record.

HOW THIS FILE IS ORGANIZED
Each business rule has its own section below. Every section has the same parts:
  1. RULE      - answers true or false (no page code inside)
  2. MESSAGE   - shows text while the user fills in the form
  3. SUBMIT    - the check used when the form is submitted
                 (shows a message, puts the cursor on the field, returns false if it fails)
  4. LISTENER  - connects the page event to the message
  5. TESTS     - console tests, boundary cases marked
The submit handler at the bottom just runs each BR's submit check in order.
*/

// =========================================================
// PAGE ELEMENTS (grabbed once, used by every section)
// =========================================================
const checkoutForm = document.querySelector("#checkout-form");
const checkoutDateInput = document.querySelector("#checkout-date");
const dueDateInput = document.querySelector("#due-date");
const dueDateMessage = document.querySelector("#dueDateMessage");
const fineInput = document.querySelector("#fineInput");
const fineMessage = document.querySelector("#fineMessage");
const itemsOutInput = document.querySelector("#itemsOut");
const itemsOutMessage = document.querySelector("#itemsOutMessage");
const bookStatusInput = document.querySelector("#bookStatus");
const readerIdInput = document.querySelector("#reader-id");
const holdIdGroup = document.querySelector("#holdIdGroup");
const holdReaderInput = document.querySelector("#holdReaderId");
const bookStatusMessage = document.querySelector("#bookStatusMessage");
const formMessage = document.querySelector("#formMessage");


// =========================================================
// BR-1: Outstanding fines must not be over the limit
// =========================================================
const FINE_LIMIT = 10.00; // fines over this amount block checkout

// 1. RULE: are the fines over $10? Exactly $10.00 is NOT over.
function exceedsFineLimit(amount) {
  return amount > FINE_LIMIT;
}

// 2. MESSAGE
function updateFineMessage() {
  if (fineInput.value === "") {
    fineMessage.textContent = "Please enter a fine amount.";
    return;
  }
  const fines = Number(fineInput.value);
  if (exceedsFineLimit(fines)) {
    fineMessage.textContent = "Fine limit exceeded.";
  } else {
    fineMessage.textContent = "Checkout allowed.";
  }
}

// 3. SUBMIT: returns true if BR-1 passes, false if it blocks the form.
function checkFinesAtSubmit() {
  if (fineInput.value === "") {
    formMessage.textContent = "Enter the reader's outstanding fines (use 0 if none).";
    fineInput.focus();
    return false;
  }
  const fines = Number(fineInput.value);
  if (exceedsFineLimit(fines)) {
    formMessage.textContent = "Checkout blocked: fines are over the $10.00 limit. Pay your fines first.";
    fineInput.focus();
    return false;
  }
  return true;
}

// 4. LISTENER (clearing formMessage keeps an old block message from lingering)
fineInput.addEventListener("input", function () {
  updateFineMessage();
  formMessage.textContent = "";
});

// 5. TESTS
console.log("0.00 ->", exceedsFineLimit(0.00));   // false: no fines, checkout allowed
console.log("9.99 ->", exceedsFineLimit(9.99));   // false: just under the limit
console.log("10.00 ->", exceedsFineLimit(10.00)); // false: exactly at the limit, allowed (boundary)
console.log("10.01 ->", exceedsFineLimit(10.01)); // true: just over, checkout blocked (boundary)


// =========================================================
// BR-2: The book must be Available
// =========================================================

// 1. RULE
function isBookAvailable(status) {
  return status === "available";
}

// 3. SUBMIT: returns true if BR-2 passes, false if it blocks the form.
// (The live MESSAGE for BR-2 is shared with BR-3, see the combined section below.)
function checkBookStatusAtSubmit() {
  if (bookStatusInput.value === "") {
    formMessage.textContent = "Choose the book status before submitting.";
    bookStatusInput.focus();
    return false;
  }
  // A book that is On Hold is decided by BR-3 (the reader who placed the hold may
  // check it out), so BR-2 does not block it here.
  if (isBookOnHold(bookStatusInput.value)) {
    return true;
  }
  if (!isBookAvailable(bookStatusInput.value)) {
    formMessage.textContent = "Checkout blocked: this book is not available. Choose an available book.";
    bookStatusInput.focus();
    return false;
  }
  return true;
}

// 5. TESTS
console.log("available ->", isBookAvailable("available"));     // true: book can be checked out
console.log("checked-out ->", isBookAvailable("checked-out")); // false: book unavailable


// =========================================================
// BR-3: A book On Hold can only be checked out by the reader who placed the hold
// =========================================================

// 1. RULE: true when the book's status is On Hold.
function isBookOnHold(status) {
  return status === "on-hold";
}

// 1. RULE: true when someone ELSE placed the hold, so this reader is blocked.
// It needs THREE values: the book status, who placed the hold, and who is checking out.
// The reader who placed the hold is allowed. This is a conditional rule: the answer
// depends on more than one box on the form.
function holdBlocksCheckout(status, holdReaderId, readerId) {
  return isBookOnHold(status) && holdReaderId !== readerId;
}

// SHOW / HIDE THE HOLD ID BOX (the one thing beyond the lecture)
// The Hold ID box should appear ONLY when the status is "On Hold".
// Every page element has a property called hidden:
//   hidden = true   -> the browser hides the element
//   hidden = false  -> the browser shows it
// It works like .textContent or .checked: we change a property and the page updates.
function updateHoldFieldVisibility() {
  const showField = isBookOnHold(bookStatusInput.value); // true only for "On Hold"
  holdIdGroup.hidden = !showField; // "!" flips true/false: show the box -> hidden is false
  if (!showField) {
    holdReaderInput.value = ""; // an old ID is cleared when the box hides, so it cannot be used by mistake
  }
}
// Run once when the page loads, so the box starts in the right state.
updateHoldFieldVisibility();

// (The live MESSAGE for BR-3 is shared with BR-2, see the shared message section below.)

// 3. SUBMIT: returns true if BR-3 passes, false if it blocks the form.
// This runs BEFORE the BR-2 check, because BR-3 decides what happens to On Hold books.
function checkHoldAtSubmit() {
  if (!isBookOnHold(bookStatusInput.value)) {
    return true; // not On Hold, so there is no hold to check
  }
  if (holdReaderInput.value === "") {
    formMessage.textContent = "This book is on hold. Enter the Reader ID of the reader who placed the hold.";
    holdReaderInput.focus();
    return false;
  }
  if (holdBlocksCheckout(bookStatusInput.value, holdReaderInput.value, readerIdInput.value)) {
    formMessage.textContent = "Checkout blocked: this book is on hold for another reader. Choose a different book.";
    holdReaderInput.focus();
    return false;
  }
  return true;
}

// 5. TESTS (status, hold reader, current reader)
console.log("own hold ->", holdBlocksCheckout("on-hold", "R100", "R100"));   // false: the holder may check out
console.log("other hold ->", holdBlocksCheckout("on-hold", "R200", "R100"));  // true: hold for someone else, blocked
console.log("not on hold ->", holdBlocksCheckout("available", "", "R100"));   // false: no hold at all
console.log("blank hold ID ->", holdBlocksCheckout("on-hold", "", "R100"));   // true: no ID, blocked (submit shows a friendlier message first)


// =========================================================
// BR-2 + BR-3 SHARED MESSAGE: one message area, because both rules use the status dropdown
// No new rule here. It only calls the BR-3 and BR-2 rules above.
// =========================================================

// MESSAGE
function updateBookStatusMessage() {
  const status = bookStatusInput.value;

  if (status === "") {
    bookStatusMessage.textContent = "Please select a book status.";
    return;
  }

  // BR-3: On Hold books depend on who placed the hold.
  if (isBookOnHold(status)) {
    if (holdReaderInput.value === "") {
      bookStatusMessage.textContent = "This book is on hold. Enter the Reader ID of the reader who placed the hold.";
    } else if (readerIdInput.value === "") {
      bookStatusMessage.textContent = "Enter your Reader ID so the hold can be checked.";
    } else if (holdBlocksCheckout(status, holdReaderInput.value, readerIdInput.value)) {
      bookStatusMessage.textContent = "Checkout blocked: book is on hold for another reader.";
    } else {
      bookStatusMessage.textContent = "This reader placed the hold. Book can be checked out.";
    }
    return;
  }

  // BR-2: every other status must be Available.
  if (!isBookAvailable(status)) {
    bookStatusMessage.textContent = "Checkout blocked: book is not available.";
    return;
  }
  bookStatusMessage.textContent = "Book is available for checkout.";
}

// LISTENERS (clearing formMessage keeps an old block message from lingering)
// The status box also shows or hides the Hold ID box.
bookStatusInput.addEventListener("change", function () {
  updateHoldFieldVisibility();
  updateBookStatusMessage();
  formMessage.textContent = "";
});
// BR-3 compares the hold ID with the reader ID, so both boxes refresh the same message.
holdReaderInput.addEventListener("input", function () {
  updateBookStatusMessage();
  formMessage.textContent = "";
});
readerIdInput.addEventListener("input", function () {
  updateBookStatusMessage();
  formMessage.textContent = "";
});


// =========================================================
// BR-5: The due date must be 1 to 5 calendar days after checkout
// =========================================================
const MAX_LOAN_DAYS = 5; // the longest loan allowed, in calendar days

// DATE HELPERS (same idea as the professor's getTodayString)

// Turn a Date into text like "2026-10-17", the format HTML date inputs use.
function formatDate(date) {
  const year = date.getFullYear();
  // getMonth() counts from 0 (January = 0), so add 1.
  // padStart(2, "0") makes 1 into "01" so the text always has two digits.
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Add days to a date text and give back new date text.
// "T00:00:00" makes JavaScript read it as local time, so the day does not shift.
// setDate() handles month ends for us (Oct 29 + 5 days = Nov 3).
function addDays(dateString, days) {
  const date = new Date(dateString + "T00:00:00");
  date.setDate(date.getDate() + days);
  return formatDate(date);
}

// 1. RULE: is the due date 1 to 5 days after the checkout date?
// Needs TWO values: the checkout date and the due date (conditional rule).
// Date texts like "2026-10-17" can be compared with > and <= because
// the year comes first, then month, then day.
function dueDateWithinLoanLimit(checkoutDate, dueDate) {
  if (checkoutDate === "" || dueDate === "") {
    return false; // we cannot check a date that is not filled in
  }
  const latestDueDate = addDays(checkoutDate, MAX_LOAN_DAYS);
  return dueDate > checkoutDate && dueDate <= latestDueDate;
}

// 2. MESSAGE
function updateDueDateMessage() {
  // Wait until both dates are filled in.
  if (checkoutDateInput.value === "" || dueDateInput.value === "") {
    dueDateMessage.textContent = "";
    return;
  }
  if (dueDateWithinLoanLimit(checkoutDateInput.value, dueDateInput.value)) {
    dueDateMessage.textContent = "Loan period is within 5 calendar days.";
  } else {
    dueDateMessage.textContent = "Due date must be 1 to 5 calendar days after the checkout date.";
  }
}

// 3. SUBMIT: returns true if BR-5 passes, false if it blocks the form.
function checkDueDateAtSubmit() {
  if (!dueDateWithinLoanLimit(checkoutDateInput.value, dueDateInput.value)) {
    formMessage.textContent = "Checkout blocked: the due date must be 1 to 5 calendar days after the checkout date.";
    dueDateInput.focus();
    return false;
  }
  return true;
}

// 4. LISTENERS: either date can change the result.
checkoutDateInput.addEventListener("input", function () {
  updateDueDateMessage();
  formMessage.textContent = "";
});
dueDateInput.addEventListener("input", function () {
  updateDueDateMessage();
  formMessage.textContent = "";
});

// 5. TESTS (checkout date, due date)
console.log("+5 days ->", dueDateWithinLoanLimit("2026-10-12", "2026-10-17"));    // true: exactly 5 days (boundary)
console.log("+6 days ->", dueDateWithinLoanLimit("2026-10-12", "2026-10-18"));    // false: 6 days (boundary)
console.log("same day ->", dueDateWithinLoanLimit("2026-10-12", "2026-10-12"));   // false: not after checkout
console.log("before ->", dueDateWithinLoanLimit("2026-10-12", "2026-10-11"));    // false: due before checkout
console.log("month end ->", dueDateWithinLoanLimit("2026-10-29", "2026-11-03")); // true: 5 days across a month


// =========================================================
// BR-4: A reader may not go over the maximum number of checked-out books
// =========================================================
const MAX_CHECKOUT_ITEMS = 3; // the most books a reader may have checked out at once

// 1. RULE: would this checkout put the reader over the limit?
// "itemsOut" is how many books the reader ALREADY has. This checkout would be one more,
// so the new total is itemsOut + 1. A total of exactly 3 is allowed; 4 is over.
// (Like BR-1, the limit lives here in JavaScript, not as an HTML max, so we can show a message.)
function exceedsItemLimit(itemsOut) {
  return itemsOut + 1 > MAX_CHECKOUT_ITEMS;
}

// 2. MESSAGE
function updateItemsOutMessage() {
  if (itemsOutInput.value === "") {
    itemsOutMessage.textContent = "Please enter how many books the reader has checked out (use 0 if none).";
    return;
  }
  const itemsOut = Number(itemsOutInput.value);
  if (exceedsItemLimit(itemsOut)) {
    itemsOutMessage.textContent = "Item limit reached: a reader may have at most " + MAX_CHECKOUT_ITEMS + " books checked out.";
  } else {
    // Show which book this would be, for example "book 3 of 3".
    itemsOutMessage.textContent = "Within the limit: this would be book " + (itemsOut + 1) + " of " + MAX_CHECKOUT_ITEMS + ".";
  }
}

// 3. SUBMIT: returns true if BR-4 passes, false if it blocks the form.
function checkItemsAtSubmit() {
  if (itemsOutInput.value === "") {
    formMessage.textContent = "Enter how many books the reader has checked out (use 0 if none).";
    itemsOutInput.focus();
    return false;
  }
  const itemsOut = Number(itemsOutInput.value);
  if (exceedsItemLimit(itemsOut)) {
    formMessage.textContent = "Checkout blocked: this reader already has " + itemsOut + " books checked out (limit " + MAX_CHECKOUT_ITEMS + "). Return a book first.";
    itemsOutInput.focus();
    return false;
  }
  return true;
}

// 4. LISTENER (clearing formMessage keeps an old block message from lingering)
itemsOutInput.addEventListener("input", function () {
  updateItemsOutMessage();
  formMessage.textContent = "";
});

// 5. TESTS (books already checked out)
console.log("0 out ->", exceedsItemLimit(0)); // false: this would be book 1 of 3
console.log("2 out ->", exceedsItemLimit(2)); // false: this would be book 3 of 3, exactly at the limit (boundary)
console.log("3 out ->", exceedsItemLimit(3)); // true: this would be book 4, over the limit (boundary)
console.log("5 out ->", exceedsItemLimit(5)); // true: already over, blocked


// =========================================================
// SUBMIT HANDLER: runs each BR's submit check in order
// =========================================================
function handleDemoCheckout(event) {
  event.preventDefault(); // stay on this page; there is no backend yet

  // Each check shows its own message and focuses its own field if it fails.
  // "return" stops here, so the checks below it do not run.
  if (!checkDueDateAtSubmit()) return;     // BR-5
  if (!checkFinesAtSubmit()) return;       // BR-1
  if (!checkItemsAtSubmit()) return;       // BR-4
  if (!checkHoldAtSubmit()) return;        // BR-3 (before BR-2: it decides what happens to On Hold books)
  if (!checkBookStatusAtSubmit()) return;  // BR-2

  // All browser-side checks passed. This is NOT a saved checkout;
  // the backend will make the official decision later.
  formMessage.textContent = "Client-side checks passed. The system will confirm the checkout later.";
  console.log("Checkout form submitted successfully.");
}

checkoutForm.addEventListener("submit", handleDemoCheckout);