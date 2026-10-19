# Week 8 — Local Backend (Node.js Only)
 
This folder extends the ShelfLife client-side system (Milestone 2). It does not replace the client files and does not connect to the frontend yet.
 
## Run (from the repository root)
 
```bash
node --version
node backend/test-backend.js
```
 
No `npm install`, Express, web server, AWS account, browser, or database is required.
 
## Files
 
- `backend.js` — receives one checkout object, validates its data, independently enforces BR-5, BR-1, BR-3 and BR-2, and returns an accepted or rejected result with a routing path (Standard or Hold pickup).
- `test-backend.js` — runs 12 named cases (valid, invalid, boundary) and prints expected vs actual with PASS or FAIL.
