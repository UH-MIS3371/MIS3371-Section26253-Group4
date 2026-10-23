"use strict";

/*
 * MIS 3371 | Week 8 | ShelfLife BACKEND TESTS
 * Run from the project folder: node backend/test-backend.js
 *
 * Predict first, run second, explain the result: each test states what we expect,
 * and the output prints PASS or FAIL next to the real result.
 * This is a manual classroom test, NOT a test framework.
 */

const { processCheckout } = require("./backend");

// A clean, valid checkout. Each test changes only the field it is about.
// Dates are fixed (not "today") so results are the same on any day.
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

// expectSuccess: should the backend accept?
// expectMessage: the reason we expect for a rejection.
// expectPath: the routing path we expect for an acceptance ("Standard" if left out).
const tests = [
  {
    name: "Clean checkout, due in 3 days - valid",
    type: "valid",
    checkout: checkoutWith({}),
    expectSuccess: true,
    expectPath: "Standard"
  },
  {
    name: "Reader who placed the hold checks out the held book - valid",
    type: "valid",
    checkout: checkoutWith({ bookStatus: "on-hold", holdReaderId: "R100" }),
    expectSuccess: true,
    expectPath: "Hold pickup"
  },
  {
    name: "Book on hold for another reader - invalid",
    type: "invalid",
    checkout: checkoutWith({ bookStatus: "on-hold", holdReaderId: "R200" }),
    expectSuccess: false,
    expectMessage: "Checkout blocked: this book is on hold for another reader."
  },
  {
    name: "Book status Lost - invalid",
    type: "invalid",
    checkout: checkoutWith({ bookStatus: "lost" }),
    expectSuccess: false,
    expectMessage: "Checkout blocked: book is not available."
  },
  {
    name: "Book already Checked Out - invalid",
    type: "invalid",
    checkout: checkoutWith({ bookStatus: "checked-out" }),
    expectSuccess: false,
    expectMessage: "Checkout blocked: book is not available."
  },
  {
    name: "Reader ID missing - invalid",
    type: "invalid",
    checkout: checkoutWith({ readerId: "   " }),
    expectSuccess: false,
    expectMessage: "Reader ID is required."
  },
  {
    // Exact boundary: the rule says OVER $10.00, not $10.00 or more.
    name: "Fines $10.00 exactly - allowed",
    type: "boundary",
    checkout: checkoutWith({ fines: 10.00 }),
    expectSuccess: true,
    expectPath: "Standard"
  },
  {
    name: "Fines $10.01 - invalid",
    type: "boundary",
    checkout: checkoutWith({ fines: 10.01 }),
    expectSuccess: false,
    expectMessage: "Checkout blocked: fine limit exceeded."
  },
  {
    name: "Due 5 days after checkout - allowed",
    type: "boundary",
    checkout: checkoutWith({ dueDate: "2026-10-06" }),
    expectSuccess: true,
    expectPath: "Standard"
  },
  {
    name: "Due 6 days after checkout - invalid",
    type: "boundary",
    checkout: checkoutWith({ dueDate: "2026-10-07" }),
    expectSuccess: false,
    expectMessage: "Due date must be 1 to 5 calendar days after the checkout date."
  },
  {
    name: "Due same day as checkout - invalid",
    type: "boundary",
    checkout: checkoutWith({ dueDate: "2026-10-01" }),
    expectSuccess: false,
    expectMessage: "Due date must be 1 to 5 calendar days after the checkout date."
  },
  {
    name: "5 days across a month end (Sept 29 to Oct 4) - allowed",
    type: "boundary",
    checkout: checkoutWith({ checkoutDate: "2026-09-29", dueDate: "2026-10-04" }),
    expectSuccess: true,
    expectPath: "Standard"
  },
  {
    // Exact boundary: 2 books out, so this checkout is book 3 of 3.
    name: "2 books already out (this is book 3) - allowed",
    type: "boundary",
    checkout: checkoutWith({ itemsOut: 2 }),
    expectSuccess: true,
    expectPath: "Standard"
  },
  {
    name: "3 books already out (this would be book 4) - invalid",
    type: "boundary",
    checkout: checkoutWith({ itemsOut: 3 }),
    expectSuccess: false,
    expectMessage: "Checkout blocked: checkout limit of 3 books reached."
  },
  {
    name: "Books checked out left blank - invalid",
    type: "invalid",
    checkout: checkoutWith({ itemsOut: "" }),
    expectSuccess: false,
    expectMessage: "Books currently checked out must be a whole number that is 0 or more."
  }
];

let passed = 0;

for (const test of tests) {
  console.log(`\n--- ${test.name} ---`);
  const result = processCheckout(test.checkout);
  const expectedPath = test.expectPath || "Standard";

  // PASS: success matches the prediction, plus the reason (rejection) or the path (acceptance).
  let testPassed = result.success === test.expectSuccess;
  if (testPassed && !test.expectSuccess) {
    testPassed = result.message === test.expectMessage;
  }
  if (testPassed && test.expectSuccess) {
    testPassed = result.status === "Checked Out" && result.checkoutPath === expectedPath;
  }

  console.log(`Type:     ${test.type}`);
  console.log(`Expected: ${test.expectSuccess ? "ACCEPT - " + expectedPath + " path" : "REJECT - " + test.expectMessage}`);
  console.log("Actual:  ", result);
  console.log(testPassed ? "PASS" : "FAIL");

  if (testPassed) {
    passed += 1;
  }
}

console.log(`\n=== ${passed} of ${tests.length} tests passed ===`);

// A non-zero exit code tells the terminal that something failed.
if (passed !== tests.length) {
  process.exitCode = 1;
}

// What to check: success true/false; the error message (if rejected); checkoutPath (if accepted).
// Invalid cases should not get a checkout path.
