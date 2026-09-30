
const FINE_LIMIT = 10.00; // BR1 may not checkout if their outstanding fines exceed the library allow fine limit

/*let outstandingFines = 5.00;
outstandingFines = 15.00;*/ // session 1

function exceedsFineLimit(amount) {
    return amount > FINE_LIMIT;
}

/*
const fineLimitExceeded = exceedsFineLimit(outstandingFines); // Example usage
console.log("Outstanding fines:", outstandingFines);
console.log("Fine limit exceeded:", fineLimitExceeded);
*/ //session 1

const fineInput = document.querySelector("#fineInput");
const fineMessage = document.querySelector("#fineMessage");

function updataFineMessage(){
  if(fineInput.value === ""){
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

fineInput.addEventListener("input", updataFineMessage);
const checkoutForm = document.querySelector("#checkout-form");

function handleDemoCheckout(event) {
  event.preventDefault();
  console.log("Checkout form submitted.");
}

checkoutForm.addEventListener("submit", handleDemoCheckout);

/*if (fineLimitExceeded) {
    console.log("Unable to checkout. Outstanding fines must be paid first.");
} else {
    console.log("Checkout allowed.");
} // session 1 */