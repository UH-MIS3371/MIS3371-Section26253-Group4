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
const PORT = 3000;

// Turn incoming JSON text into a JavaScript object at req.body.
app.use(express.json());

// Serve the existing frontend files (styles.css, app.js) from src/.
app.use(express.static(path.join(__dirname, "..", "src")));

// Our page is named transaction-form.html, not index.html, so send it for "/".
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "src", "transaction-form.html"));
});

// POST /api/checkouts: receive one checkout, let the Week 8 backend decide.
// 200 = checkout accepted, 400 = checkout rejected. The JSON body explains why.
app.post("/api/checkouts", (req, res) => {
  // req.body is empty when no JSON was sent; {} lets the backend reject it cleanly.
  const result = processCheckout(req.body || {});
  return res.status(result.success ? 200 : 400).json(result);
});

app.listen(PORT, () => {
  console.log(`ShelfLife server running at http://localhost:${PORT}`);
});