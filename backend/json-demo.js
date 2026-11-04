"use strict";

/*
 * MIS 3371 | Week 8 | ShelfLife OBJECTS AND JSON
 * Run: node backend/json-demo.js
 *
 * Week 8: this example only converts data locally.
 * Week 9: HTTP requests carry this JSON text between the browser and the server.
 * JSON is a DATA FORMAT, not a database, a server, or an API by itself.
 */

// A JavaScript object: keys and values that JavaScript can access directly.
// These are the same keys the checkout form sends to POST /api/checkouts.
// fines and itemsOut are text here because HTML inputs always give text.
const checkout = {
  readerId: "R100",
  bookId: "B1234",
  checkoutDate: "2026-10-01",
  dueDate: "2026-10-04",
  fines: "0",
  itemsOut: "0",
  bookStatus: "available",
  holdReaderId: "",
  notes: ""
};

console.log("JavaScript object:");
console.log(checkout);

// stringify converts the object INTO a JSON-formatted TEXT STRING.
// The optional null, 2 arguments just indent the printed text for readability.
const jsonText = JSON.stringify(checkout, null, 2);
console.log("\nJSON text:");
console.log(jsonText);

// parse performs the reverse conversion: JSON text -> JavaScript object.
// After parsing, normal JavaScript can read fields such as readerId again.
const parsedCheckout = JSON.parse(jsonText);
console.log("\nBack to a JavaScript object:");
console.log(parsedCheckout);
console.log("\nReader ID after parsing:", parsedCheckout.readerId);