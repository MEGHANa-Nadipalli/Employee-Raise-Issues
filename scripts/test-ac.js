const store = require("../lib/store");
const { INITIAL_TICKETS, INITIAL_USERS } = require("../lib/seedData");

console.log("=================================================");
console.log("VERIFYING COMPLETE SESSION & REACTIVE SUITE");
console.log("=================================================\n");

let passed = 0;
let total = 0;

function assert(cond, msg) {
  total++;
  if (!cond) {
    console.error(`❌ FAILED: ${msg}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${msg}`);
    passed++;
  }
}

// -------------------------------------------------------------
// 1. Initial State & Preloaded Seed Tickets
// -------------------------------------------------------------
console.log("--- 1. Testing Preloaded Seed Tickets & Data Model ---");
const allTickets = store.getAllTickets();
assert(allTickets.length >= 5, "Initial state contains at least 5 preloaded sample tickets");

// Check each ticket has a comments array
assert(
  allTickets.every((t) => Array.isArray(t.comments)),
  "Every ticket in state includes an embedded 'comments' array"
);

// Check Ticket #5 (Closed)
const ticket5 = store.getTicketById("5", { name: "Priya", role: "Support Staff" });
assert(ticket5 && ticket5.status === "Closed", "Ticket #5 is in 'Closed' status in seed data");
assert(
  ticket5.comments.length > 0 &&
  ticket5.comments.some((c) => c.author_name === "Priya"),
  "Ticket #5 has preloaded seed comments"
);

// -------------------------------------------------------------
// 2. Role-Based Access Control & Dashboard Filtering
// -------------------------------------------------------------
console.log("\n--- 2. Testing RBAC & Role Filtering ---");
const ravi = { name: "Ravi", role: "Employee" };
const priya = { name: "Priya", role: "Support Staff" };

// Ravi (Employee) only sees tickets where created_by === "Ravi"
const raviTickets = store.getTicketsForUser(ravi);
assert(
  raviTickets.length > 0 && raviTickets.every((t) => t.created_by === "Ravi"),
  "Employee View (Ravi): Dashboard filters to show ONLY tickets where created_by === 'Ravi'"
);

// Priya (Support Staff) sees all tickets across all users
const priyaTickets = store.getTicketsForUser(priya);
assert(
  priyaTickets.length === allTickets.length && priyaTickets.length >= 5,
  "Support Staff View (Priya): Dashboard displays ALL tickets across all users"
);

// -------------------------------------------------------------
// 3. Status Dropdown & Closed-Ticket Lock (Support Staff)
// -------------------------------------------------------------
console.log("\n--- 3. Testing Status Dropdown & Closed Ticket Lock ---");
// Employee cannot change status
const empStatusRes = store.changeStatus("1", "In Progress", ravi);
assert(!empStatusRes.success, "Employee (Ravi) has no control to change status via API / state");

// Support Staff (Priya) can update status
const initialUpdatedDate = "01 Jan 2020";
const t1 = store.getTicketById("1", priya);
t1.last_updated_date = initialUpdatedDate;

const suppStatusRes = store.changeStatus("1", "In Progress", priya);
assert(
  suppStatusRes.success && suppStatusRes.ticket.status === "In Progress",
  "Support Staff (Priya) can change status via interactive dropdown"
);
assert(
  suppStatusRes.ticket.last_updated_date !== initialUpdatedDate,
  "Status update automatically refreshes last_updated_date"
);

// Closed ticket lock: core fields cannot be edited
const editClosedRes = store.updateTicket("5", { title: "Attempt edit" }, priya);
assert(!editClosedRes.success, "Closed ticket strictly locks core fields against editing");

// Reopening ticket allows editing
const reopenRes = store.changeStatus("5", "In Progress", priya);
assert(reopenRes.success && reopenRes.ticket.status === "In Progress", "Support Staff can reopen a closed ticket");

const editReopenedRes = store.updateTicket("5", { description: "Reopened and edited" }, priya);
assert(editReopenedRes.success, "Reopened ticket successfully allows editing core fields again");

// Re-close ticket 5
store.changeStatus("5", "Closed", priya);

// -------------------------------------------------------------
// 4. Interactive Ticket Comments (Step 4)
// -------------------------------------------------------------
console.log("\n--- 4. Testing Interactive Ticket Comments ---");
// Empty / whitespace comments are rejected
const blankRes = store.addComment("1", "   ", ravi);
assert(!blankRes.success, "Submitting empty or whitespace comment is rejected");

// Post valid comment
const commentRes = store.addComment("1", "Ravi's new comment", ravi);
assert(
  commentRes.success &&
  commentRes.comment.author_name === "Ravi" &&
  commentRes.comment.comment_text === "Ravi's new comment" &&
  Boolean(commentRes.comment.created_at) &&
  Boolean(commentRes.comment.comment_id),
  "Post Comment appends comment with author_name, comment_text, created_at, comment_id"
);

// Check that parent ticket's comments array in state contains the new comment
const t1Comments = store.getComments("1");
assert(
  t1Comments.some((c) => c.comment_text === "Ravi's new comment"),
  "New comment is present in ticket's comments array"
);

// Crucial Rule: Both Employee and Support Staff can post comments on Closed tickets!
const closedCommentRes = store.addComment("5", "Employee comment on Closed Ticket #5", ravi);
assert(
  closedCommentRes.success,
  "Crucial Rule: Employee can post comments on Closed ticket (Ticket #5)"
);

const closedPriyaComment = store.addComment("5", "Support Staff comment on Closed Ticket #5", priya);
assert(
  closedPriyaComment.success,
  "Crucial Rule: Support Staff can post comments on Closed ticket (Ticket #5)"
);

const t5Comments = store.getComments("5");
assert(
  t5Comments.some((c) => c.comment_text === "Employee comment on Closed Ticket #5") &&
  t5Comments.some((c) => c.comment_text === "Support Staff comment on Closed Ticket #5"),
  "Both comments are recorded in Closed ticket's comments array"
);

console.log("\n=================================================");
console.log(`ALL ${passed}/${total} VERIFICATION CHECKS PASSED!`);
console.log("=================================================");
