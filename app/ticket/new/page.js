"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";

export default function NewTicket() {
  const router = useRouter();
  const { currentUser, createTicket } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Hardware");
  const [priority, setPriority] = useState("Medium");

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const errs = {};
    if (!title.trim()) {
      errs.title = "Title is required and cannot be empty.";
    } else if (title.trim().length > 100) {
      errs.title = "Title cannot exceed 100 characters.";
    }

    if (!description.trim()) {
      errs.description = "Description is required and cannot be empty.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    if (!validate()) return;
    if (!currentUser) {
      setServerError("Please select an active user profile.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createTicket({
        title,
        description,
        category,
        priority,
      });
      router.push("/");
    } catch (err) {
      setServerError("An unexpected error occurred.");
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 650, margin: "0 auto" }}>
      <div style={{ marginBottom: 16 }}>
        <Link href="/" style={{ fontSize: "0.875rem", color: "var(--primary)" }}>
          ← Back to Dashboard
        </Link>
      </div>

      <div className="card">
        <h2 className="card-title">Create New Support Ticket</h2>

        {serverError && <div className="banner-alert alert-error">{serverError}</div>}

        <form onSubmit={handleSubmit} noValidate>
          {/* Title */}
          <div className="form-group">
            <label className="form-label" htmlFor="ticket-title">
              Title <span style={{ color: "var(--danger)" }}>*</span>
            </label>
            <input
              id="ticket-title"
              data-testid="ticket-title-input"
              type="text"
              className="form-control"
              placeholder="Brief summary of the issue..."
              maxLength={100}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors((prev) => ({ ...prev, title: null }));
              }}
            />
            <span className="char-counter">{title.length} / 100 characters</span>
            {errors.title && <span className="error-text">{errors.title}</span>}
          </div>

          {/* Category & Priority Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="form-group">
              <label className="form-label" htmlFor="ticket-category">
                Category <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <select
                id="ticket-category"
                data-testid="ticket-category-select"
                className="form-control"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="Hardware">Hardware</option>
                <option value="Software">Software</option>
                <option value="Network">Network</option>
                <option value="Access">Access</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="ticket-priority">
                Priority <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <select
                id="ticket-priority"
                data-testid="ticket-priority-select"
                className="form-control"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label" htmlFor="ticket-desc">
              Description <span style={{ color: "var(--danger)" }}>*</span>
            </label>
            <textarea
              id="ticket-desc"
              data-testid="ticket-desc-input"
              rows={5}
              className="form-control"
              placeholder="Detailed explanation of the issue, steps to reproduce, or requirements..."
              maxLength={2000}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (errors.description) setErrors((prev) => ({ ...prev, description: null }));
              }}
            />
            <span className="char-counter">{description.length} / 2000 characters</span>
            {errors.description && <span className="error-text">{errors.description}</span>}
          </div>

          {/* Form Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 }}>
            <Link href="/">
              <button type="button" className="btn btn-secondary">
                Cancel
              </button>
            </Link>
            <button
              type="submit"
              data-testid="submit-ticket-btn"
              className="btn btn-primary"
              disabled={isSubmitting || !title.trim() || !description.trim()}
            >
              {isSubmitting ? "Submitting..." : "Submit Ticket"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
