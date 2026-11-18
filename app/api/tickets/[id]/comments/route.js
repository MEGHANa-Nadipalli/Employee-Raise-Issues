// API Route: POST /api/tickets/[id]/comments — Add comment to a ticket

import { NextResponse } from "next/server";
const store = require("@/lib/store");
const { getUserFromRequest } = require("@/lib/authHelper");

export async function POST(request, { params }) {
  const { id } = await params;
  const user = getUserFromRequest(request);

  const body = await request.json();
  const commentText = body?.comment_text || body?.text;

  const result = store.addComment(id, commentText, user);

  if (!result.success) {
    return NextResponse.json({ errors: result.errors }, { status: 400 });
  }

  // Also return updated ticket so caller gets fresh last_updated_date
  const ticket = store.getTicketById(id, user);

  return NextResponse.json(
    { comment: result.comment, ticket },
    { status: 201 }
  );
}
