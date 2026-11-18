const { getUserFromRequest } = require("../lib/authHelper");
const store = require("../lib/store");

console.log("=================================================");
console.log("TESTING AUTH HELPER & MULTI-TRANSPORT RBAC");
console.log("=================================================\n");

let passed = 0;
function assert(cond, msg) {
  if (!cond) {
    console.error(`❌ FAILED: ${msg}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${msg}`);
    passed++;
  }
}

// 1. From Header
const req1 = { headers: new Map([["x-user-name", "Priya"]]) };
const user1 = getUserFromRequest(req1);
assert(user1.name === "Priya" && user1.role === "Support Staff", "Resolves user Priya (Support Staff) from x-user-name header");

// 2. From Cookie userName
const req2 = {
  headers: new Map(),
  cookies: {
    get: (key) => (key === "userName" ? { value: "Ravi" } : null),
  },
};
const user2 = getUserFromRequest(req2);
assert(user2.name === "Ravi" && user2.role === "Employee", "Resolves user Ravi (Employee) from session cookie userName");

// 3. From Cookie currentUser JSON
const req3 = {
  headers: new Map(),
  cookies: {
    get: (key) =>
      key === "currentUser"
        ? { value: encodeURIComponent(JSON.stringify({ name: "Priya", role: "Support Staff" })) }
        : null,
  },
};
const user3 = getUserFromRequest(req3);
assert(user3.name === "Priya" && user3.role === "Support Staff", "Resolves user Priya from session cookie currentUser JSON");

// 4. From Query String
const req4 = {
  headers: new Map(),
  cookies: { get: () => null },
  url: "http://localhost:3000/api/tickets?user=Priya",
};
const user4 = getUserFromRequest(req4);
assert(user4.name === "Priya" && user4.role === "Support Staff", "Resolves user Priya from query parameter");

// 5. Active User State sync
store.setActiveUser("Priya");
assert(store.getActiveUser().name === "Priya", "store.setActiveUser successfully sets active user");

store.setActiveUser("Ravi");
assert(store.getActiveUser().name === "Ravi", "store.setActiveUser successfully switches back to Ravi");

console.log(`\nAll ${passed} multi-transport auth tests passed!`);
