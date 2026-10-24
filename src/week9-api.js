/*
 * MIS 3371 | Week 9 | ShelfLife BROWSER -> API CONNECTION
 * Loaded AFTER app.js, so it can use app.js's page elements and submit checks.
 * app.js itself is unchanged: its live messages and rule functions still work.
 *
 * PATH OF ONE CHECKOUT:
 *   form fields -> checkout object -> JSON.stringify -> POST /api/checkouts
 *   -> Express -> processCheckout (Week 8) -> JSON result -> response.json()
 *   -> message on the page (approved, rejected, or cannot reach the server)
 *
 * Nothing is saved yet. The backend checks the checkout; it does not store it.
 */

const API_URL = "/api/checkouts";

// Week 7's demo handler only showed a local message. Remove it so the form
// has ONE submit handler: the one below, which sends a real HTTP request.
checkoutForm.removeEventListener("submit", handleDemoCheckout);
checkoutForm.addEventListener("submit", submitCheckoutToApi);

// Show the result and mark it approved or rejected so CSS can color the stamp.
function showResult(message, result) {
  formMessage.textContent = message;
  formMessage.dataset.result = result;
}

// Read every form field into one checkout object.
// The names match what processCheckout() expects in backend/backend.js.
function buildCheckout() {
  return {
    readerId: readerIdInput.value.trim(),
    bookId: document.querySelector("#book-id").value.trim(),
    checkoutDate: checkoutDateInput.value,
    dueDate: dueDateInput.value,
    fines: fineInput.value,
    itemsOut: itemsOutInput.value,
    bookStatus: bookStatusInput.value,
    holdReaderId: holdReaderInput.value.trim(),
    notes: document.querySelector("#notes").value.trim()
  };
}

async function submitCheckoutToApi(event) {
  event.preventDefault(); // stay on this page; JavaScript sends the request instead
  delete formMessage.dataset.result;

  // 1. Browser checks first (from app.js). They give quick feedback,
  //    but the backend checks everything again because it is the trusted tier.
  if (!checkDueDateAtSubmit()) return;     // BR-5
  if (!checkFinesAtSubmit()) return;       // BR-1
  if (!checkItemsAtSubmit()) return;       // BR-4
  if (!checkHoldAtSubmit()) return;        // BR-3
  if (!checkBookStatusAtSubmit()) return;  // BR-2

  // 2. Object -> JSON text -> HTTP POST.
  const checkout = buildCheckout();

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(checkout)
    });

    // 3. JSON text -> object. 200 = approved, 400 = rejected by a rule.
    const result = await response.json();

    if (!response.ok || !result.success) {
      showResult("Checkout rejected by the system: " + result.message, "rejected");
      return;
    }

    showResult(
      "Checkout approved by the system (" + result.checkoutPath + " path). " +
      "Transaction " + result.transactionId + ". Not saved yet.",
      "approved"
    );
  } catch (error) {
    // fetch() itself failed: the server is stopped or unreachable.
    // This is different from a rejection, which is a real answer from the backend.
    showResult("Cannot reach the ShelfLife server. Start it with npm start and try again.", "rejected");
    console.error(error);
  }
}