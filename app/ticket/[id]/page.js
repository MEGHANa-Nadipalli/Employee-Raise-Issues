"use client";

import { useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import PriorityPill from "@/components/PriorityPill";
import StatusBadge from "@/components/StatusBadge";
import { useAuth } from "@/lib/AuthContext";

function TicketDetailContent() {
  const params = useParams();
  const ticketId = params?.id;
  const {
    currentUser,
    isSupport,
    tickets,
    updateTicketStatus,
    updateTicketFields,
    addCommentToTicket,
  } = useAuth();

  // Find target ticket from global state
  const ticket = useMemo(() => {
    return tickets.find((t) => String(t.ticket_id) === String(ticketId)) || null;
  }, [tickets, ticketId]);

  // Edit State (Title, Description, Category, Priority)
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("Hardware");
  const [editPriority, setEditPriority] = useState("Medium");
  const [editErrors, setEditErrors] = useState({});

  // Comment State (Step 4)
  const [commentText, setCommentText] = useState("");
  const [commentError, setCommentError] = useState("");
  const [isPostingComment, setIsPostingComment] = useState(false);

  // Check RBAC permission to view this ticket
  const isOwner =
    ticket &&
    ticket.created_by.toLowerCase() === currentUser?.name?.toLowerCase();
  const canView = isSupport || isOwner;

  const isClosed = ticket?.status === "Closed";
  // Support Staff can edit any non-closed ticket; Employee can edit own non-closed ticket
  const canEditTicket = !isClosed && (isSupport || isOwner);

  // Synchronize edit inputs when entering edit mode
  const handleStartEditing = () => {
    if (!ticket || isClosed) return;
    setEditTitle(ticket.title);
    setEditDescription(ticket.description);
    setEditCategory(ticket.category);
    setEditPriority(ticket.priority);
    setEditErrors({});
    setIsEditing(true);
  };

  // Handle Support Staff Status Dropdown change
  const handleStatusChange = (newStatus) => {
    if (!isSupport || !ticket) return;
    updateTicketStatus(ticket.ticket_id, newStatus);
    // If status became Closed, immediately close active edit mode
    if (newStatus === "Closed") {
      setIsEditing(false);
    }
  };

  // Handle Save Edited Ticket Fields
  const handleSaveEdit = () => {
    const errs = {};
    if (!editTitle.trim()) {
      errs.title = "Title cannot be empty.";
    } else if (editTitle.trim().length > 100) {
      errs.title = "Title cannot exceed 100 characters.";
    }
    if (!editDescription.trim()) {
      errs.description = "Description cannot be empty.";
    }

    if (Object.keys(errs).length > 0) {
      setEditErrors(errs);
      return;
    }

    updateTicketFields(ticket.ticket_id, {
      title: editTitle.trim(),
      description: editDescription.trim(),
      category: editCategory,
      priority: editPriority,
    });
    setIsEditing(false);
  };

  // Handle Post Comment
  const handlePostComment = (e) => {
    e.preventDefault();
    if (!commentText.trim()) {
      setCommentError("Comment cannot be empty or whitespace-only.");
      return;
    }

    setIsPostingComment(true);
    setCommentError("");

    addCommentToTicket(ticket.ticket_id, commentText);
    setCommentText("");
    setIsPostingComment(false);
  };

  if (!ticket || !canView) {
    return (
      <div
        className="card"
        data-testid="access-restricted-card"
        style={{ maxWidth: 600, margin: "40px auto", textAlign: "center" }}
      >
        <h2 style={{ color: "var(--danger)", marginBottom: 12 }}>Access Restricted</h2>
        <p style={{ color: "var(--text-muted)", marginBottom: 20 }}>
          {!ticket
            ? "Ticket not found."
            : "Access Restricted: You do not have permission to view tickets created by other employees."}
        </p>
        <Link href="/">
          <button className="btn btn-secondary">← Back to Dashboard</button>
        </Link>
      </div>
    );
  }

  const sortedComments = [...(ticket.comments || [])].sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at)
  );

  return (
    <div data-testid="ticket-detail-view">
      <div style={{ marginBottom: 16 }}>
        <Link href="/" style={{ fontSize: "0.875rem", color: "var(--primary)" }}>
          ← Back to Dashboard
        </Link>
      </div>

      <div className="detail-grid">
        {/* Main Content Area */}
        <div>
          <div className="card" data-testid="ticket-main-card">
            {/* Closed Ticket Notice */}
            {isClosed && (
              <div className="banner-alert alert-warning" data-testid="closed-ticket-banner">
                🔒 <strong>This ticket is Closed.</strong> Core ticket details (Title, Description, Category, Priority) are locked against editing. The discussion thread below remains fully open for comments.
              </div>
            )}

            <div className="card-title">
              <span data-testid="ticket-id-heading">Ticket #{ticket.ticket_id}</span>

              {/* Edit button: Rendered only if non-closed & permitted */}
              {canEditTicket && (
                <div>
                  {isEditing ? (
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        type="button"
                        data-testid="cancel-edit-btn"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setIsEditing(false)}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        data-testid="save-edit-btn"
                        className="btn btn-primary btn-sm"
                        onClick={handleSaveEdit}
                        disabled={!editTitle.trim() || !editDescription.trim()}
                      >
                        Save Changes
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      data-testid="edit-ticket-btn"
                      className="btn btn-secondary btn-sm"
                      onClick={handleStartEditing}
                    >
                      ✏️ Edit Ticket
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Editable Form or Static Content */}
            {isEditing ? (
              <div data-testid="ticket-edit-form">
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-title">
                    Title <span style={{ color: "var(--danger)" }}>*</span>
                  </label>
                  <input
                    id="edit-title"
                    data-testid="edit-title-input"
                    type="text"
                    className="form-control"
                    maxLength={100}
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                  />
                  <span className="char-counter">{editTitle.length} / 100 characters</span>
                  {editErrors.title && <span className="error-text">{editErrors.title}</span>}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="edit-category">
                      Category
                    </label>
                    <select
                      id="edit-category"
                      data-testid="edit-category-select"
                      className="form-control"
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                    >
                      <option value="Hardware">Hardware</option>
                      <option value="Software">Software</option>
                      <option value="Network">Network</option>
                      <option value="Access">Access</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="edit-priority">
                      Priority
                    </label>
                    <select
                      id="edit-priority"
                      data-testid="edit-priority-select"
                      className="form-control"
                      value={editPriority}
                      onChange={(e) => setEditPriority(e.target.value)}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="edit-desc">
                    Description <span style={{ color: "var(--danger)" }}>*</span>
                  </label>
                  <textarea
                    id="edit-desc"
                    data-testid="edit-description-input"
                    rows={6}
                    className="form-control"
                    maxLength={2000}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                  />
                  <span className="char-counter">{editDescription.length} / 2000 characters</span>
                  {editErrors.description && (
                    <span className="error-text">{editErrors.description}</span>
                  )}
                </div>
              </div>
            ) : (
              <div data-testid="ticket-view-content">
                <h1
                  data-testid="ticket-title"
                  style={{ fontSize: "1.35rem", fontWeight: 700, marginBottom: 12, color: "#0f172a" }}
                >
                  {ticket.title}
                </h1>
                <div
                  data-testid="ticket-description"
                  style={{
                    fontSize: "0.95rem",
                    lineHeight: 1.6,
                    color: "#334155",
                    whiteSpace: "pre-wrap",
                    marginTop: 16,
                  }}
                >
                  {ticket.description}
                </div>
              </div>
            )}
          </div>

          {/* Activity & Comments Section (Step 4) */}
          <div className="card" data-testid="comments-section">
            <h3 className="card-title">Activity & Comments</h3>

            {/* Chronological Feed */}
            {sortedComments.length === 0 ? (
              <p
                data-testid="no-comments-msg"
                style={{ color: "var(--text-muted)", fontSize: "0.875rem", padding: "12px 0" }}
              >
                No comments on this ticket yet. Start the conversation below.
              </p>
            ) : (
              <div className="comments-feed" data-testid="comments-feed" style={{ marginBottom: 20 }}>
                {sortedComments.map((c) => (
                  <div key={c.comment_id} className="comment-item" data-testid={`comment-${c.comment_id}`}>
                    <div className="comment-header">
                      <span className="comment-author" data-testid={`comment-author-${c.comment_id}`}>
                        {c.author_name}
                      </span>
                      <span className="comment-date" data-testid={`comment-date-${c.comment_id}`}>
                        {new Date(c.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="comment-body" data-testid={`comment-body-${c.comment_id}`}>
                      {c.comment_text}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Comment Input Form — Fully active & functional even if Closed! */}
            <form onSubmit={handlePostComment} style={{ marginTop: 16 }} data-testid="comment-form">
              <div className="form-group">
                <label className="form-label" htmlFor="comment-input" style={{ fontSize: "0.85rem" }}>
                  Add a comment as <strong data-testid="comment-author-name">{currentUser?.name}</strong>:
                </label>
                <textarea
                  id="comment-input"
                  data-testid="comment-input"
                  name="comment_text"
                  rows={3}
                  className="form-control"
                  placeholder="Leave a comment, update, or question regarding this ticket..."
                  value={commentText}
                  onChange={(e) => {
                    setCommentText(e.target.value);
                    if (commentError) setCommentError("");
                  }}
                />
                {commentError && (
                  <span className="error-text" data-testid="comment-error">
                    {commentError}
                  </span>
                )}
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="submit"
                  data-testid="post-comment-btn"
                  className="btn btn-primary"
                  disabled={isPostingComment || !commentText.trim()}
                >
                  Post Comment
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Metadata Panel */}
        <div>
          <div className="card" data-testid="ticket-metadata-panel">
            <h3 className="card-title" style={{ fontSize: "1rem" }}>
              Ticket Information
            </h3>

            {/* Status Field: Interactive Dropdown for Support Staff; Static Badge for Employee */}
            <div className="meta-row">
              <span className="meta-label">Status</span>
              <span className="meta-value" data-testid="status-control-container">
                {isSupport ? (
                  <select
                    id="status-dropdown"
                    data-testid="status-dropdown"
                    name="status"
                    className="filter-select"
                    style={{ padding: "4px 8px", fontSize: "0.85rem", fontWeight: 600 }}
                    value={ticket.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    aria-label="Ticket Status Dropdown"
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                ) : (
                  <StatusBadge status={ticket.status} />
                )}
              </span>
            </div>

            {/* Priority Field */}
            <div className="meta-row">
              <span className="meta-label">Priority</span>
              <span className="meta-value" data-testid="meta-priority">
                <PriorityPill priority={ticket.priority} />
              </span>
            </div>

            {/* Category Field */}
            <div className="meta-row">
              <span className="meta-label">Category</span>
              <span className="meta-value" data-testid="meta-category">{ticket.category}</span>
            </div>

            {/* Created By Field */}
            <div className="meta-row">
              <span className="meta-label">Created By</span>
              <span className="meta-value" data-testid="meta-created-by">{ticket.created_by}</span>
            </div>

            {/* Created Date */}
            <div className="meta-row">
              <span className="meta-label">Created Date</span>
              <span className="meta-value" data-testid="meta-created-date">{ticket.created_date}</span>
            </div>

            {/* Last Updated Date */}
            <div className="meta-row">
              <span className="meta-label">Last Updated</span>
              <span className="meta-value" data-testid="meta-last-updated">{ticket.last_updated_date}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TicketDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="empty-state">
          <p>Loading ticket...</p>
        </div>
      }
    >
      <TicketDetailContent />
    </Suspense>
  );
}
