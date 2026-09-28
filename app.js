
const FINE_LIMIT = 10.00;
const MAX_ITEMS = 5;
const LOAN_DAYS = 5;

/*Example transaction amount for testing.
let expenseAmount = 50;

function requiresDirectorApproval(amount) {
  return amount > DIRECTOR_APPROVAL_THRESHOLD;
}

function requiresReceipt(amount) {
  return amount > RECEIPT_THRESHOLD;
}

const directorApprovalRequired = requiresDirectorApproval(expenseAmount);
const receiptRequired = requiresReceipt(expenseAmount);

console.log('Expense amount:', expenseAmount);
console.log('Receipt required:', receiptRequired);
console.log('Director approval required:', directorApprovalRequired);

if (directorApprovalRequired) {
  console.log('Approval path: Manager + Director');
} else {
  console.log('Approval path: Standard manager review');
}

// Try changing expenseAmount to 50, 250, 5000, and 5600.
