// API Route: GET /api/tickets/[id] — Get single ticket & comments
// API Route: PATCH /api/tickets/[id] — Update ticket fields or status

import { NextResponse } from "next/server";
const store = require("@/lib/store");
const { getUserFromRequest } = require("@/lib/authHelper");

export async function GET(request, { params }) {
  const { id } = await params;
  const user = getUserFromRequest(request);

  const ticket = store.getTicketById(id, user);
  if (!ticket) {
    return NextResponse.json(
      { error: "Ticket not found or you do not have permission to view it." },
      { status: 404 }
    );
  }

  const comments = store.getComments(id);
  return NextResponse.json({ ticket, comments, activeUser: user });
}

export async function PATCH(request, { params }) {
  const { id } = await params;
  const user = getUserFromRequest(request);
  const body = await request.json();

  // If status is provided, handle status change (Support Staff only)
  if ("status" in body) {
    const statusResult = store.changeStatus(id, body.status, user);
    if (!statusResult.success) {
      return NextResponse.json(
        { errors: statusResult.errors },
        { status: 403 }
      );
    }
    // If only status was modified, return right away
    if (Object.keys(body).length === 1) {
      const comments = store.getComments(id);
      return NextResponse.json({ ticket: statusResult.ticket, comments });
    }
  }

  // Handle core field edits (title, description, category, priority)
  const fieldUpdates = {};
  for (const key of ["title", "description", "category", "priority"]) {
    if (key in body) {
      fieldUpdates[key] = body[key];
    }
  }

  if (Object.keys(fieldUpdates).length > 0) {
    const result = store.updateTicket(id, fieldUpdates, user);
    if (!result.success) {
      return NextResponse.json({ errors: result.errors }, { status: 400 });
    }
    const comments = store.getComments(id);
    return NextResponse.json({ ticket: result.ticket, comments });
  }

  const ticket = store.getTicketById(id, user);
  const comments = store.getComments(id);
  return NextResponse.json({ ticket, comments });
}
