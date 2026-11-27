"use strict";

// MIS 3371 | ShelfLife AWS Lambda backend
// API Gateway HTTP API payload format version 2.0

const {
  DynamoDBClient,
  DescribeTableCommand,
  PutItemCommand,
  GetItemCommand
} = require("@aws-sdk/client-dynamodb");

const dynamodb = new DynamoDBClient({});

// Preserve the existing ShelfLife business rules
const { processCheckout } = require("./backend/backend");

const TABLE_NAME = process.env.TABLE_NAME;

// Return an API Gateway-compatible response
function reply(statusCode, result) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    },
    body: JSON.stringify(result)
  };
}

// Read the HTTP method
function getMethod(event) {
  return (
    event.requestContext?.http?.method ||
    event.httpMethod ||
    "POST"
  ).toUpperCase();
}

// Read the request path
function getPath(event) {
  return event.rawPath || event.path || "/api/checkouts";
}

// Retrieve a saved checkout by confirmation number
async function retrieveCheckout(confirmationNumber) {
  if (!confirmationNumber) {
    return reply(400, {
      success: false,
      message: "Confirmation number is required."
    });
  }

  try {
    const response = await dynamodb.send(
      new GetItemCommand({
        TableName: TABLE_NAME,
        Key: {
          confirmationNumber: {
            S: confirmationNumber
          }
        },
        ConsistentRead: true
      })
    );

    if (!response.Item) {
      return reply(404, {
        success: false,
        message: "Transaction not found."
      });
    }

    const item = response.Item;

    const transaction = {
      confirmationNumber: item.confirmationNumber.S,
      readerId: item.readerId?.S,
      bookId: item.bookId?.S,
      checkoutDate: item.checkoutDate?.S,
      dueDate: item.dueDate?.S,
      checkoutPath: item.checkoutPath?.S,
      checkedOutAt: item.checkedOutAt?.S
    };

    console.log(
      "[DYNAMODB] Checkout retrieved:",
      confirmationNumber
    );

    return reply(200, {
      success: true,
      persisted: true,
      transaction
    });

  } catch (error) {
    console.error(
      "[DYNAMODB] Retrieval failed:",
      error.name,
      error.message
    );

    return reply(500, {
      success: false,
      message: "Could not retrieve the transaction."
    });
  }
}

// Save an approved checkout
async function saveCheckout(result) {
  const confirmationNumber = result.transactionId;

  if (!confirmationNumber) {
    return reply(500, {
      success: false,
      message: "Checkout could not be saved.",
      persisted: false
    });
  }

  try {
    await dynamodb.send(
      new PutItemCommand({
        TableName: TABLE_NAME,
        Item: {
          confirmationNumber: {
            S: String(confirmationNumber)
          },
          readerId: {
            S: String(result.readerId)
          },
          bookId: {
            S: String(result.bookId)
          },
          checkoutDate: {
            S: String(result.checkoutDate)
          },
          dueDate: {
            S: String(result.dueDate)
          },
          checkoutPath: {
            S: String(result.checkoutPath)
          },
          checkedOutAt: {
            S: String(result.checkedOutAt)
          }
        },
        ConditionExpression:
          "attribute_not_exists(confirmationNumber)"
      })
    );

    result.persisted = true;
    result.confirmationNumber = confirmationNumber;

    console.log(
      "[DYNAMODB] Checkout saved:",
      confirmationNumber
    );

    return reply(200, result);

  } catch (error) {
    console.error(
      "[DYNAMODB] Save failed:",
      error.name,
      error.message
    );

    return reply(500, {
      success: false,
      message: "Checkout could not be saved to the database.",
      persisted: false
    });
  }
}

// AWS Lambda entry point
exports.handler = async (event = {}) => {
  const method = getMethod(event);
  const path = getPath(event);

  // Handle CORS preflight requests
  if (method === "OPTIONS") {
    return reply(204, {});
  }

  // GET /api/checkouts/{confirmationNumber}
  if (method === "GET") {
    const prefix = "/api/checkouts/";

    if (!path.startsWith(prefix)) {
      return reply(404, {
        success: false,
        message: "Route not found."
      });
    }

    let confirmationNumber;

    try {
      confirmationNumber = decodeURIComponent(
        path.slice(prefix.length)
      );
    } catch (error) {
      return reply(400, {
        success: false,
        message: "Invalid confirmation number."
      });
    }

    return await retrieveCheckout(confirmationNumber);
  }

  // Only POST is allowed for creating checkouts
  if (method !== "POST") {
    return reply(405, {
      success: false,
      message: "Use POST /api/checkouts."
    });
  }

  if (path !== "/api/checkouts") {
    return reply(404, {
      success: false,
      message: "Route not found."
    });
  }

  // Validate the JSON request body
  if (
    typeof event.body !== "string" ||
    !event.body.trim()
  ) {
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
    console.error("[LAMBDA] Invalid JSON request body.");

    return reply(400, {
      success: false,
      message: "Request body must contain valid JSON.",
      persisted: false
    });
  }

  if (
    checkout === null ||
    typeof checkout !== "object" ||
    Array.isArray(checkout)
  ) {
    return reply(400, {
      success: false,
      message: "Request body must be a JSON object.",
      persisted: false
    });
  }

  // Run the original ShelfLife business rules
  const result = processCheckout(checkout);

  if (!result.success) {
    console.log("[LAMBDA] Checkout rejected:", result.message);
    return reply(400, result);
  }

  // Save only approved checkouts
  return await saveCheckout(result);
};
