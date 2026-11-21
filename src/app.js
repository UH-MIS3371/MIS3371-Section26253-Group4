
"use strict";

// ShelfLife Book Checkout System
// MIS 3371 - Group 4
// Frontend validation and AWS API integration

// =========================================================
// PAGE ELEMENTS
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
const submitButton = document.querySelector(
  '#checkout-form button[type="submit"]'
);

const API_URL =
  "https://lcfbvhd5c5.execute-api.us-east-1.amazonaws.com/api/checkouts";

// =========================================================
// BR-1: FINES MUST NOT EXCEED $10.00
// =========================================================

const FINE_LIMIT = 10.00;

function exceedsFineLimit(amount) {
  return amount > FINE_LIMIT;
}

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

function checkFinesAtSubmit() {
  if (fineInput.value === "") {
    formMessage.textContent =
      "Enter the reader's outstanding fines (use 0 if none).";
    fineInput.focus();
    return false;
  }

  const fines = Number(fineInput.value);

  if (exceedsFineLimit(fines)) {
    formMessage.textContent =
      "Checkout blocked: fines are over the $10.00 limit. Pay your fines first.";
    fineInput.focus();
    return false;
  }

  return true;
}

fineInput.addEventListener("input", function () {
  updateFineMessage();
  formMessage.textContent = "";
});

// =========================================================
// BR-2: BOOK MUST BE AVAILABLE
// =========================================================

function isBookAvailable(status) {
  return status === "available";
}

function checkBookStatusAtSubmit() {
  if (bookStatusInput.value === "") {
    formMessage.textContent =
      "Choose the book status before submitting.";
    bookStatusInput.focus();
    return false;
  }

  // Own-hold pickup is handled by BR-3.
  if (isBookOnHold(bookStatusInput.value)) {
    return true;
  }

  if (!isBookAvailable(bookStatusInput.value)) {
    formMessage.textContent =
      "Checkout blocked: this book is not available. Choose an available book.";
    bookStatusInput.focus();
    return false;
  }

  return true;
}

// =========================================================
// BR-3: HOLD BELONGS TO CURRENT READER
// =========================================================

function isBookOnHold(status) {
  return status === "on-hold";
}

function holdBlocksCheckout(status, holdReaderId, readerId) {
  return isBookOnHold(status) &&
    holdReaderId !== readerId;
}

function updateHoldFieldVisibility() {
  const showField = isBookOnHold(bookStatusInput.value);

  holdIdGroup.hidden = !showField;

  if (!showField) {
    holdReaderInput.value = "";
  }
}

updateHoldFieldVisibility();

function checkHoldAtSubmit() {
  if (!isBookOnHold(bookStatusInput.value)) {
    return true;
  }

  if (holdReaderInput.value === "") {
    formMessage.textContent =
      "This book is on hold. Enter the Reader ID of the reader who placed the hold.";
    holdReaderInput.focus();
    return false;
  }

  if (
    holdBlocksCheckout(
      bookStatusInput.value,
      holdReaderInput.value,
      readerIdInput.value
    )
  ) {
    formMessage.textContent =
      "Checkout blocked: this book is on hold for another reader. Choose a different book.";
    holdReaderInput.focus();
    return false;
  }

  return true;
}

// =========================================================
// BR-2 + BR-3: SHARED BOOK STATUS MESSAGE
// =========================================================

function updateBookStatusMessage() {
  const status = bookStatusInput.value;

  if (status === "") {
    bookStatusMessage.textContent =
      "Please select a book status.";
    return;
  }

  if (isBookOnHold(status)) {
    if (holdReaderInput.value === "") {
      bookStatusMessage.textContent =
        "This book is on hold. Enter the Reader ID of the reader who placed the hold.";
    } else if (readerIdInput.value === "") {
      bookStatusMessage.textContent =
        "Enter your Reader ID so the hold can be checked.";
    } else if (
      holdBlocksCheckout(
        status,
        holdReaderInput.value,
        readerIdInput.value
      )
    ) {
      bookStatusMessage.textContent =
        "Checkout blocked: book is on hold for another reader.";
    } else {
      bookStatusMessage.textContent =
        "This reader placed the hold. Book can be checked out.";
    }

    return;
  }

  if (!isBookAvailable(status)) {
    bookStatusMessage.textContent =
      "Checkout blocked: book is not available.";
    return;
  }

  bookStatusMessage.textContent =
    "Book is available for checkout.";
}

bookStatusInput.addEventListener("change", function () {
  updateHoldFieldVisibility();
  updateBookStatusMessage();
  formMessage.textContent = "";
});

holdReaderInput.addEventListener("input", function () {
  updateBookStatusMessage();
  formMessage.textContent = "";
});

readerIdInput.addEventListener("input", function () {
  updateBookStatusMessage();
  formMessage.textContent = "";
});

// =========================================================
// BR-5: DUE DATE MUST BE 1-5 CALENDAR DAYS LATER
// =========================================================

const MAX_LOAN_DAYS = 5;

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function addDays(dateString, days) {
  const date = new Date(dateString + "T00:00:00");
  date.setDate(date.getDate() + days);

  return formatDate(date);
}

function dueDateWithinLoanLimit(checkoutDate, dueDate) {
  if (checkoutDate === "" || dueDate === "") {
    return false;
  }

  const latestDueDate = addDays(
    checkoutDate,
    MAX_LOAN_DAYS
  );

  return dueDate > checkoutDate &&
    dueDate <= latestDueDate;
}

function updateDueDateMessage() {
  if (
    checkoutDateInput.value === "" ||
    dueDateInput.value === ""
  ) {
    dueDateMessage.textContent = "";
    return;
  }

  if (
    dueDateWithinLoanLimit(
      checkoutDateInput.value,
      dueDateInput.value
    )
  ) {
    dueDateMessage.textContent =
      "Loan period is within 5 calendar days.";
  } else {
    dueDateMessage.textContent =
      "Due date must be 1 to 5 calendar days after the checkout date.";
  }
}

function checkDueDateAtSubmit() {
  if (
    !dueDateWithinLoanLimit(
      checkoutDateInput.value,
      dueDateInput.value
    )
  ) {
    formMessage.textContent =
      "Checkout blocked: the due date must be 1 to 5 calendar days after the checkout date.";
    dueDateInput.focus();
    return false;
  }

  return true;
}

checkoutDateInput.addEventListener("input", function () {
  updateDueDateMessage();
  formMessage.textContent = "";
});

dueDateInput.addEventListener("input", function () {
  updateDueDateMessage();
  formMessage.textContent = "";
});

// =========================================================
// BR-4: MAXIMUM THREE BOOKS CHECKED OUT
// =========================================================

const MAX_CHECKOUT_ITEMS = 3;

function exceedsItemLimit(itemsOut) {
  return itemsOut + 1 > MAX_CHECKOUT_ITEMS;
}

function updateItemsOutMessage() {
  if (itemsOutInput.value === "") {
    itemsOutMessage.textContent =
      "Please enter how many books the reader has checked out (use 0 if none).";
    return;
  }

  const itemsOut = Number(itemsOutInput.value);

  if (exceedsItemLimit(itemsOut)) {
    itemsOutMessage.textContent =
      "Checkout not allowed! You can only check out up to " +
      MAX_CHECKOUT_ITEMS + " books.";
  } else {
    itemsOutMessage.textContent =
      "Checkout allowed! You currently have " +
      itemsOut +
      " books. After this checkout, you will have " +
      (itemsOut + 1) +
      " out of " +
      MAX_CHECKOUT_ITEMS +
      " books.";
  }
}

function checkItemsAtSubmit() {
  if (itemsOutInput.value === "") {
    formMessage.textContent =
      "Enter how many books the reader has checked out (use 0 if none).";
    itemsOutInput.focus();
    return false;
  }

  const itemsOut = Number(itemsOutInput.value);

  if (exceedsItemLimit(itemsOut)) {
    formMessage.textContent =
      "Checkout not allowed! You can only check out up to " +
      MAX_CHECKOUT_ITEMS + " books.";
    itemsOutInput.focus();
    return false;
  }

  return true;
}

itemsOutInput.addEventListener("input", function () {
  updateItemsOutMessage();
  formMessage.textContent = "";
});

// =========================================================
// API RESPONSE DISPLAY
// =========================================================

function showFormMessage(message, approved) {
  formMessage.textContent = message;

  formMessage.dataset.result = approved
    ? "approved"
    : "rejected";
}

// =========================================================
// BUILD CHECKOUT OBJECT
// =========================================================

function buildCheckout() {
  return {
    readerId: readerIdInput.value.trim(),

    bookId: document
      .querySelector("#book-id")
      .value.trim(),

    checkoutDate: checkoutDateInput.value,
    dueDate: dueDateInput.value,

    fines: fineInput.value,
    itemsOut: itemsOutInput.value,

    bookStatus: bookStatusInput.value,
    holdReaderId: holdReaderInput.value.trim(),

    notes: document
      .querySelector("#notes")
      .value.trim()
  };
}

// =========================================================
// SUBMIT CHECKOUT TO AWS API
// =========================================================

async function handleSubmit(event) {
  event.preventDefault();

  delete formMessage.dataset.result;

  // Frontend business-rule validation
  if (!checkDueDateAtSubmit()) return;
  if (!checkFinesAtSubmit()) return;
  if (!checkItemsAtSubmit()) return;
  if (!checkHoldAtSubmit()) return;
  if (!checkBookStatusAtSubmit()) return;

  const checkout = buildCheckout();

  submitButton.disabled = true;

  formMessage.textContent =
    "Sending checkout to the ShelfLife API...";

  try {
    const response = await fetch(API_URL, {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify(checkout)
    });

    const result = await response.json();

    // Backend rejected the transaction
    if (!response.ok || !result.success) {
      showFormMessage(
        "Checkout rejected by the system: " +
          (result.message || "Unknown error."),
        false
      );
      return;
    }

    // =====================================================
    // UPDATED: DISPLAY ACTUAL DATABASE SAVE STATUS
    // =====================================================

    const confirmationNumber =
      result.confirmationNumber ||
      result.transactionId ||
      "Unavailable";

    const savedMessage =
      result.persisted === true
        ? "Saved successfully."
        : "Not saved yet.";

    const checkoutPath =
      result.checkoutPath || "Standard";

    showFormMessage(
      "Checkout approved by the system (" +
        checkoutPath +
        " path). " +
        "Transaction " +
        confirmationNumber +
        ". " +
        savedMessage,
      true
    );

    console.log("Checkout API response:", result);

  } catch (error) {
    showFormMessage(
      "Cannot reach the ShelfLife API. Check your connection and try again.",
      false
    );

    console.error(error);

  } finally {
    submitButton.disabled = false;
  }
}

checkoutForm.addEventListener("submit", handleSubmit);
