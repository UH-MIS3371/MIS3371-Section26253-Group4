"use strict";

/*
 * MIS 3371 | Week 9 | ShelfLife API TESTS
 * 1. In one terminal:     npm start
 * 2. In a second terminal: npm run test:api
 *
 * Each test sends a real HTTP POST with a JSON body to the running server,
 * then compares the expected HTTP status and result with what came back.
 */

const URL = "http://localhost:3000/api/checkouts";

// A clean, valid checkout. Each test changes only the field it is about.
const baseCheckout = {
  readerId: "R100",
  bookId: "B1234",
  checkoutDate: "2026-10-01",
  dueDate: "2026-10-04",
  fines: 0,
  itemsOut: 0,
  bookStatus: "available",
  holdReaderId: ""
};

function checkoutWith(changes) {
  return Object.assign({}, baseCheckout, changes);
}

const tests = [
  { name: "Clean checkout - valid", type: "valid", body: checkoutWith({}), expectStatus: 200, expectPath: "Standard" },
  { name: "Reader picks up own hold - valid", type: "valid", body: checkoutWith({ bookStatus: "on-hold", holdReaderId: "R100" }), expectStatus: 200, expectPath: "Hold pickup" },
  { name: "Fines $10.00 exactly - allowed", type: "boundary", body: checkoutWith({ fines: 10.00 }), expectStatus: 200, expectPath: "Standard" },
  { name: "Fines $10.01 - rejected", type: "boundary", body: checkoutWith({ fines: 10.01 }), expectStatus: 400, expectMessage: "Checkout blocked: fine limit exceeded." },
  { name: "Due 6 days after checkout - rejected", type: "boundary", body: checkoutWith({ dueDate: "2026-10-07" }), expectStatus: 400, expectMessage: "Due date must be 1 to 5 calendar days after the checkout date." },
  { name: "Book on hold for another reader - rejected", type: "invalid", body: checkoutWith({ bookStatus: "on-hold", holdReaderId: "R200" }), expectStatus: 400, expectMessage: "Checkout blocked: this book is on hold for another reader." },
  { name: "3 books already out - rejected", type: "boundary", body: checkoutWith({ itemsOut: 3 }), expectStatus: 400, expectMessage: "Checkout blocked: checkout limit of 3 books reached." },
  { name: "Reader ID missing - rejected", type: "invalid", body: checkoutWith({ readerId: "" }), expectStatus: 400, expectMessage: "Reader ID is required." }
];

async function runTests() {
  let passed = 0;

  for (const test of tests) {
    // Object -> JSON text -> HTTP POST. The server turns it back into an object.
    const response = await fetch(URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(test.body)
    });
    const result = await response.json();

    // PASS: the HTTP status matches, plus the path (accepted) or the message (rejected).
    let testPassed = response.status === test.expectStatus;
    if (testPassed && test.expectStatus === 200) {
      testPassed = result.checkoutPath === test.expectPath;
    }
    if (testPassed && test.expectStatus === 400) {
      testPassed = result.message === test.expectMessage;
    }

    console.log(`\n--- ${test.name} (${test.type}) ---`);
    console.log(`Expected: ${test.expectStatus} ${test.expectPath || test.expectMessage}`);
    console.log(`Actual:   ${response.status} ${result.checkoutPath || result.message}`);
    console.log(testPassed ? "PASS" : "FAIL");

    if (testPassed) {
      passed += 1;
    }
  }

  console.log(`\n=== ${passed} of ${tests.length} API tests passed ===`);
  if (passed !== tests.length) {
    process.exitCode = 1;
  }
}

runTests().catch((error) => {
  // Most common cause: the server is not running.
  console.error("Could not reach the server. Run npm start in another terminal first.");
  console.error(error.message);
  process.exitCode = 1;
});