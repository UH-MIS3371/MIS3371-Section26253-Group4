"use strict";

/*
 * MIS 3371 | Week 9 | ShelfLife LOCAL EXPRESS SERVER
 * Run from the project folder: npm start, then open http://localhost:3000
 *
 * This file only handles HTTP: it receives JSON, calls the Week 8 backend,
 * and sends the result back. It does NOT copy any business rules.
 * No AWS, no database, nothing is saved.
 */

const path = require("path");
const express = require("express");
const { processCheckout } = require("../backend/backend");

const app = express();

// Turn incoming JSON text into a JavaScript object at req.body.
app.use(express.json({ limit: "20kb", strict: false }));
// strict:false lets valid JSON primitives reach processCheckout, so the backend
// (not Express or the browser) rejects non-object transactions consistently.

// Serve the existing frontend files (styles.css, app.js) from src/.
app.use(express.static(path.join(__dirname, "..", "src")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "src", "transaction-form.html"));
});

app.post("/api/checkouts", (req, res) => {
  // express.json() already parsed the transmitted JSON into req.body.
  // Pass the original value, including undefined/null, to backend validation.
  const checkout = req.body;
  console.log("[SERVER] Received checkout:", checkout);

  // The server delegates EVERY checkout check and business rule to backend.js.
  const result = processCheckout(checkout);

  // Turn the backend decision into an HTTP response:
  // 200 = the backend accepted this local request; 400 = rejected checkout.
  // .json() serializes the result object as JSON to return to the browser.
  return res.status(result.success ? 200 : 400).json(result);
});

// Malformed JSON should also return JSON (not Express's default HTML error).
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      message: "Request body must contain valid JSON.",
      persisted: false
    });
  }
  return next(err);
});

// Start the server only when this file is run directly (npm start),
// not when another file loads it with require().
// To use a different port, set PORT before starting the server.
// For example, in PowerShell: $env:PORT=4000; npm start
if (require.main === module) {
  const port = Number(process.env.PORT) || 3000;
  app.listen(port, () => {
    console.log(`ShelfLife frontend: http://localhost:${port}/`);
    console.log(`Checkout API: POST http://localhost:${port}/api/checkouts`);
    console.log("The app runs locally. No database or AWS is used yet.");
  });
}

module.exports = app;