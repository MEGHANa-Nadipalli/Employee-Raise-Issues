import { NextResponse } from "next/server";
const store = require("@/lib/store");
const { getUserFromRequest } = require("@/lib/authHelper");

export async function GET(request) {
  const user = getUserFromRequest(request);
  return NextResponse.json({ user });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const name = body?.name || body?.userName;
    if (!name) {
      return NextResponse.json({ error: "User name required" }, { status: 400 });
    }

    const updatedUser = store.setActiveUser(name);
    const response = NextResponse.json({ user: updatedUser });

    // Set cookies on response
    response.cookies.set("currentUser", JSON.stringify(updatedUser), { path: "/", maxAge: 86400 });
    response.cookies.set("userName", updatedUser.name, { path: "/", maxAge: 86400 });
    response.cookies.set("userRole", updatedUser.role, { path: "/", maxAge: 86400 });

    return response;
  } catch (err) {
    return NextResponse.json({ error: "Failed to update active user" }, { status: 500 });
  }
}
