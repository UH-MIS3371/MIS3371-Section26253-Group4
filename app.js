/*BR-1: A reader may not check out an item if their outstanding fines exceed the library’s allowed fine limit.
BR-2: A book only be checked out if its current status is Available.
BR-3: A book with an active hold for another reader may not be checked out by the current reader.
BR-4: A reader cannot complete a checkout if doing so would cause them to exceed the maximum checkout items limit.
BR-5: A book can only be checked out for 5 calendar days.
BR-6: Only one reader may successfully check out a specific physical book at a time.
BR-7: A checkout may only proceed when the scanned barcode or entered ISBN matches an existing book record.
*/

const FINE_LIMIT = 10.00; // BR-1: may not checkout if outstanding fines exceed the allowed fine limit

const checkoutForm = document.querySelector("#checkout-form");
const fineInput = document.querySelector("#fineInput");
const fineMessage = document.querySelector("#fineMessage");
const bookStatusInput = document.querySelector("#bookStatus");
const bookStatusMessage = document.querySelector("#bookStatusMessage");

// BR-1
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

// BR-2
function isBookAvailable(status) {
  return status === "available";
}

function updateBookStatusMessage() {
  if (bookStatusInput.value === "") {
    bookStatusMessage.textContent = "Please select a book status.";
    return;
  }
  if (isBookAvailable(bookStatusInput.value)) {
    bookStatusMessage.textContent = "Book is available for checkout.";
  } else {
    bookStatusMessage.textContent = "Checkout blocked: book is not available.";
  }
}

function handleDemoCheckout(event) {
  event.preventDefault();
  const fines = Number(fineInput.value);
  if (exceedsFineLimit(fines)) {
    fineMessage.textContent = "Checkout blocked: fine limit exceeded.";
    return;
  }
  console.log("Checkout form submitted successfully.");
}

checkoutForm.addEventListener("submit", handleDemoCheckout);
fineInput.addEventListener("input", updateFineMessage);
bookStatusInput.addEventListener("change", updateBookStatusMessage);

// Four tested cases including a boundary
console.log("0.00 ->", exceedsFineLimit(0.00));   // false: no fines, checkout allowed
console.log("9.99 ->", exceedsFineLimit(9.99));   // false: just under the limit
console.log("10.00 ->", exceedsFineLimit(10.00)); // false: exactly at the limit, allowed
console.log("10.01 ->", exceedsFineLimit(10.01)); // true: just over, checkout blocked

// BR-2 tests
console.log("available ->", isBookAvailable("available"));   // true: book can be checked out
console.log("checked-out ->", isBookAvailable("checked-out")); // false: book unavailable