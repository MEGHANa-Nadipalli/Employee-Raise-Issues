// API Route: GET /api/tickets — List tickets (filtered by user role)
// API Route: POST /api/tickets — Create a new ticket

import { NextResponse } from "next/server";
const store = require("@/lib/store");
const { getUserFromRequest } = require("@/lib/authHelper");

export async function GET(request) {
  const user = getUserFromRequest(request);
  const tickets = store.getTicketsForUser(user);

  // Apply query filters
  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status");
  const priorityFilter = searchParams.get("priority");
  const categoryFilter = searchParams.get("category");
  const searchQuery = searchParams.get("search");

  let filtered = tickets;

  if (statusFilter && statusFilter !== "All") {
    filtered = filtered.filter((t) => t.status === statusFilter);
  }
  if (priorityFilter && priorityFilter !== "All") {
    filtered = filtered.filter((t) => t.priority === priorityFilter);
  }
  if (categoryFilter && categoryFilter !== "All") {
    filtered = filtered.filter((t) => t.category === categoryFilter);
  }
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter((t) => t.title.toLowerCase().includes(q));
  }

  return NextResponse.json({ tickets: filtered, activeUser: user });
}

export async function POST(request) {
  const user = getUserFromRequest(request);
  const body = await request.json();
  const result = store.createTicket(body, user);

  if (!result.success) {
    return NextResponse.json({ errors: result.errors }, { status: 400 });
  }

  return NextResponse.json({ ticket: result.ticket }, { status: 201 });
}
