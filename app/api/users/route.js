// API Route: GET /api/users — List available users for login

import { NextResponse } from "next/server";
const store = require("@/lib/store");

export async function GET() {
  const users = store.getAllUsers();
  return NextResponse.json({ users });
}
