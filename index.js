"use strict";

// MIS 3371 | Week 10 | ShelfLife AWS Lambda HTTP adapter.
// Lambda receives API Gateway HTTP API events (payload format version 2.0).
// Our unchanged Week 8 backend remains the ONLY authority for input
// validation and business rules. This file only translates HTTP <-> objects,
// the same job server/server.js does for Express in Week 9.
//
// The ZIP must have index.js at its ROOT, alongside backend/backend.js.
// Lambda Runtime settings -> Handler: index.handler
const { processCheckout } = require("./backend/backend");

// Convert a result object into the HTTP response shape expected by
// API Gateway's Lambda proxy integration (payload format version 2.0).
function reply(statusCode, result) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(result)
  };
}

// "index.handler" means: run the exported handler() in index.js.
exports.handler = async (event = {}) => {
  // API Gateway's HTTP API puts the request method in requestContext.http.
  // The fallback supports simplified Lambda console test events.
  const method = event.requestContext?.http?.method || event.httpMethod || "POST";
  if (method !== "POST") {
    return reply(405, {
      success: false,
      message: "Use POST /api/checkouts.",
      persisted: false
    });
  }

  // API Gateway normally puts the submitted JSON in event.body as TEXT.
  if (typeof event.body !== "string" || !event.body.trim()) {
    return reply(400, {
      success: false,
      message: "A JSON request body is required.",
      persisted: false
    });
  }

  let checkout;
  try {
    checkout = JSON.parse(event.body);
  } catch (error) {
    // Avoid returning the raw request or internal error details to callers.
    console.error("[LAMBDA] Invalid JSON request body.");
    return reply(400, {
      success: false,
      message: "Request body must contain valid JSON.",
      persisted: false
    });
  }

  // Valid JSON can still be null, an array, or a number. processCheckout reads
  // fields such as checkout.readerId, so it must receive an object.
  // This checks the request's SHAPE only; every field and rule stays in the backend.
  if (checkout === null || typeof checkout !== "object" || Array.isArray(checkout)) {
    return reply(400, {
      success: false,
      message: "Request body must be a JSON object.",
      persisted: false
    });
  }

  // Reuse the existing Week 8 code rather than reimplementing the rules in Lambda.
  const result = processCheckout(checkout);
  console.log("[LAMBDA] Backend accepted:", result.success,
              "persisted:", result.persisted);

  // HTTP 200 = checkout accepted; HTTP 400 = checkout rejected by a rule.
  // Week 10 has NO database, so accepted still means persisted: false.
  return reply(result.success ? 200 : 400, result);
};
