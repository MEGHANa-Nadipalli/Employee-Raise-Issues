// ============================================================
// Server In-Memory Data Store — Ticket & Comment CRUD
// ============================================================
const { INITIAL_USERS, INITIAL_TICKETS, nowFormatted } = require("./seedData");

// Deep clone initial seed data
let tickets = JSON.parse(JSON.stringify(INITIAL_TICKETS));
let activeUser = { ...INITIAL_USERS[0] }; // Ravi (Employee)
let nextTicketId = 6;
let nextCommentId = 4;

const VALID_CATEGORIES = ["Hardware", "Software", "Network", "Access", "Other"];
const VALID_PRIORITIES = ["Low", "Medium", "High"];
const VALID_STATUSES = ["Open", "In Progress", "Resolved", "Closed"];

function getActiveUser() {
  return activeUser;
}

function setActiveUser(nameOrUser) {
  if (typeof nameOrUser === "string") {
    const matched = INITIAL_USERS.find(
      (u) => u.name.toLowerCase() === nameOrUser.toLowerCase()
    );
    if (matched) activeUser = { ...matched };
    else
      activeUser = {
        name: nameOrUser,
        role: nameOrUser === "Priya" ? "Support Staff" : "Employee",
      };
  } else if (nameOrUser && nameOrUser.name) {
    const matched = INITIAL_USERS.find(
      (u) => u.name.toLowerCase() === nameOrUser.name.toLowerCase()
    );
    if (matched) activeUser = { ...matched };
    else activeUser = { ...nameOrUser };
  }
  return activeUser;
}

function getUserByName(name) {
  if (!name) return null;
  return INITIAL_USERS.find((u) => u.name.toLowerCase() === name.toLowerCase()) || null;
}

function getAllUsers() {
  return [...INITIAL_USERS];
}

function getAllTickets() {
  return [...tickets];
}

function getTicketsForUser(user) {
  const effectiveUser = user || activeUser;
  if (!effectiveUser) return [];

  // Support Staff sees ALL tickets across all employees
  if (effectiveUser.role === "Support Staff") {
    return [...tickets];
  }

  // Employee only sees tickets created by themselves
  return tickets.filter(
    (t) => t.created_by.toLowerCase() === effectiveUser.name.toLowerCase()
  );
}

function getTicketById(ticketId, user) {
  const ticket = tickets.find((t) => String(t.ticket_id) === String(ticketId));
  if (!ticket) return null;

  const effectiveUser = user || activeUser;
  // Row-level security for employees
  if (effectiveUser && effectiveUser.role !== "Support Staff") {
    if (ticket.created_by.toLowerCase() !== effectiveUser.name.toLowerCase()) {
      return null;
    }
  }

  return { ...ticket };
}

function createTicket({ title, description, category, priority }, user) {
  const effectiveUser = user || activeUser;
  const errors = [];

  if (!title || !title.trim()) {
    errors.push("Title is required.");
  } else if (title.trim().length > 100) {
    errors.push("Title must be 100 characters or fewer.");
  }

  if (!description || !description.trim()) {
    errors.push("Description is required.");
  }

  if (!VALID_CATEGORIES.includes(category)) {
    errors.push(`Category must be one of: ${VALID_CATEGORIES.join(", ")}.`);
  }

  if (!VALID_PRIORITIES.includes(priority)) {
    errors.push(`Priority must be one of: ${VALID_PRIORITIES.join(", ")}.`);
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  const now = nowFormatted();
  const newTicket = {
    ticket_id: String(nextTicketId++),
    title: title.trim(),
    description: description.trim(),
    category,
    priority,
    status: "Open",
    created_by: effectiveUser.name,
    created_date: now,
    last_updated_date: now,
    comments: [],
  };

  tickets.push(newTicket);
  return { success: true, ticket: { ...newTicket } };
}

function updateTicket(ticketId, fields, user) {
  const effectiveUser = user || activeUser;
  const index = tickets.findIndex((t) => String(t.ticket_id) === String(ticketId));
  if (index === -1) {
    return { success: false, errors: ["Ticket not found."] };
  }

  const ticket = tickets[index];
  const isSupport = effectiveUser.role === "Support Staff";
  const isOwner = ticket.created_by.toLowerCase() === effectiveUser.name.toLowerCase();

  if (!isSupport && !isOwner) {
    return { success: false, errors: ["Access denied."] };
  }

  if (ticket.status === "Closed") {
    return { success: false, errors: ["Cannot edit a closed ticket."] };
  }

  const errors = [];
  const updatedFields = {};

  if ("title" in fields) {
    if (!fields.title || !fields.title.trim()) {
      errors.push("Title is required.");
    } else if (fields.title.trim().length > 100) {
      errors.push("Title must be 100 characters or fewer.");
    } else {
      updatedFields.title = fields.title.trim();
    }
  }

  if ("description" in fields) {
    if (!fields.description || !fields.description.trim()) {
      errors.push("Description is required.");
    } else {
      updatedFields.description = fields.description.trim();
    }
  }

  if ("category" in fields) {
    if (!VALID_CATEGORIES.includes(fields.category)) {
      errors.push(`Category must be one of: ${VALID_CATEGORIES.join(", ")}.`);
    } else {
      updatedFields.category = fields.category;
    }
  }

  if ("priority" in fields) {
    if (!VALID_PRIORITIES.includes(fields.priority)) {
      errors.push(`Priority must be one of: ${VALID_PRIORITIES.join(", ")}.`);
    } else {
      updatedFields.priority = fields.priority;
    }
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  Object.assign(tickets[index], updatedFields, {
    last_updated_date: nowFormatted(),
  });

  return { success: true, ticket: { ...tickets[index] } };
}

function changeStatus(ticketId, newStatus, user) {
  const effectiveUser = user || activeUser;
  if (!effectiveUser || effectiveUser.role !== "Support Staff") {
    return { success: false, errors: ["Only Support Staff can change ticket status."] };
  }

  if (!VALID_STATUSES.includes(newStatus)) {
    return {
      success: false,
      errors: [`Status must be one of: ${VALID_STATUSES.join(", ")}.`],
    };
  }

  const index = tickets.findIndex((t) => String(t.ticket_id) === String(ticketId));
  if (index === -1) {
    return { success: false, errors: ["Ticket not found."] };
  }

  tickets[index].status = newStatus;
  tickets[index].last_updated_date = nowFormatted();

  return { success: true, ticket: { ...tickets[index] } };
}

function getComments(ticketId) {
  const ticket = tickets.find((t) => String(t.ticket_id) === String(ticketId));
  if (!ticket) return [];
  return (ticket.comments || []).sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at)
  );
}

function addComment(ticketId, commentText, user) {
  const effectiveUser = user || activeUser;
  if (!commentText || !commentText.trim()) {
    return { success: false, errors: ["Comment text cannot be empty or whitespace-only."] };
  }

  const index = tickets.findIndex((t) => String(t.ticket_id) === String(ticketId));
  if (index === -1) {
    return { success: false, errors: ["Ticket not found."] };
  }

  const ticket = tickets[index];
  const isSupport = effectiveUser.role === "Support Staff";
  const isOwner = ticket.created_by.toLowerCase() === effectiveUser.name.toLowerCase();

  if (!isSupport && !isOwner) {
    return { success: false, errors: ["Access denied."] };
  }

  const newComment = {
    comment_id: `comment-${nextCommentId++}`,
    ticket_id: String(ticketId),
    author_name: effectiveUser.name,
    comment_text: commentText.trim(),
    created_at: new Date().toISOString(),
  };

  if (!ticket.comments) {
    ticket.comments = [];
  }
  ticket.comments.push(newComment);
  ticket.last_updated_date = nowFormatted();

  return { success: true, comment: { ...newComment }, ticket: { ...ticket } };
}

module.exports = {
  getAllTickets,
  getTicketsForUser,
  getTicketById,
  createTicket,
  updateTicket,
  changeStatus,
  getComments,
  addComment,
  getActiveUser,
  setActiveUser,
  getUserByName,
  getAllUsers,
  VALID_CATEGORIES,
  VALID_PRIORITIES,
  VALID_STATUSES,
};
