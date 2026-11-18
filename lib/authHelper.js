const store = require("./store");

/**
 * Robust helper to extract current user from incoming Next.js Request
 * Checks headers (x-user-name, x-user), cookies (userName, currentUser, user),
 * query parameters, and falls back to server-side active user or Ravi.
 */
function getUserFromRequest(request) {
  let name = null;

  // 1. Headers
  if (request.headers) {
    name =
      request.headers.get("x-user-name") ||
      request.headers.get("x-user") ||
      request.headers.get("x-current-user");
  }

  // 2. Cookies
  if (!name && request.cookies) {
    name =
      request.cookies.get("userName")?.value ||
      request.cookies.get("user")?.value;

    if (!name) {
      const currentCookie = request.cookies.get("currentUser")?.value;
      if (currentCookie) {
        try {
          const parsed = JSON.parse(decodeURIComponent(currentCookie));
          if (parsed && parsed.name) {
            name = parsed.name;
          }
        } catch {
          name = decodeURIComponent(currentCookie);
        }
      }
    }
  }

  // 3. Query params
  if (!name && request.url) {
    try {
      const url = new URL(request.url);
      name = url.searchParams.get("userName") || url.searchParams.get("user");
    } catch {}
  }

  // 4. Resolve user in store
  if (name) {
    const user = store.getUserByName(name);
    if (user) return user;
    // If not found in static list, construct user
    const roleHeader =
      request.headers?.get("x-user-role") ||
      request.cookies?.get("userRole")?.value;
    return {
      name,
      role: roleHeader || (name === "Priya" ? "Support Staff" : "Employee"),
    };
  }

  // 5. Fallback to active user in store or Ravi
  return store.getActiveUser() || { name: "Ravi", role: "Employee" };
}

module.exports = {
  getUserFromRequest,
};
