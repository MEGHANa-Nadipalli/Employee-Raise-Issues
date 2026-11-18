"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import PriorityPill from "@/components/PriorityPill";
import StatusBadge from "@/components/StatusBadge";
import { useAuth } from "@/lib/AuthContext";

export default function Dashboard() {
  const { currentUser, isSupport, tickets } = useAuth();

  // Local Filter Controls
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");

  // Automatically filter tickets based on user role & active filters
  const displayedTickets = useMemo(() => {
    if (!tickets) return [];

    // RBAC: Employee (Ravi) only sees tickets where created_by === "Ravi"
    // Support Staff (Priya) sees all tickets across all users
    let result = isSupport
      ? [...tickets]
      : tickets.filter(
          (t) => t.created_by.toLowerCase() === currentUser?.name?.toLowerCase()
        );

    // Apply Filter Bar criteria
    if (statusFilter !== "All") {
      result = result.filter((t) => t.status === statusFilter);
    }
    if (priorityFilter !== "All") {
      result = result.filter((t) => t.priority === priorityFilter);
    }
    if (categoryFilter !== "All") {
      result = result.filter((t) => t.category === categoryFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((t) => t.title.toLowerCase().includes(q));
    }

    return result;
  }, [tickets, currentUser, isSupport, statusFilter, priorityFilter, categoryFilter, search]);

  return (
    <div data-testid="dashboard-view">
      {/* Filter Bar */}
      <div className="filter-bar" data-testid="filter-bar">
        <input
          type="text"
          data-testid="search-input"
          className="search-input"
          placeholder="Search tickets by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          data-testid="status-filter"
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All Statuses</option>
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
          <option value="Closed">Closed</option>
        </select>

        <select
          data-testid="priority-filter"
          className="filter-select"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
        >
          <option value="All">All Priorities</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>

        {isSupport && (
          <select
            data-testid="category-filter"
            className="filter-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="All">All Categories</option>
            <option value="Hardware">Hardware</option>
            <option value="Software">Software</option>
            <option value="Network">Network</option>
            <option value="Access">Access</option>
            <option value="Other">Other</option>
          </select>
        )}
      </div>

      {/* Ticket List Table */}
      <div className="table-card" data-testid="tickets-table-container">
        {displayedTickets.length === 0 ? (
          <div className="empty-state" data-testid="empty-tickets">
            <h3>No tickets found</h3>
            <p>
              {search || statusFilter !== "All" || priorityFilter !== "All" || categoryFilter !== "All"
                ? "Try adjusting your filters or search term."
                : currentUser?.role === "Employee"
                ? "You haven't submitted any support tickets yet."
                : "No support tickets found in the queue."}
            </p>
          </div>
        ) : (
          <table className="ticket-table" data-testid="tickets-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                {/* Show "Created By" column only for Support Staff (Priya) */}
                {isSupport && <th data-testid="th-created-by">Created By</th>}
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {displayedTickets.map((t) => (
                <tr key={t.ticket_id} data-testid={`ticket-row-${t.ticket_id}`}>
                  <td>
                    <Link
                      href={`/ticket/${t.ticket_id}`}
                      className="ticket-title-link"
                      data-testid={`ticket-title-${t.ticket_id}`}
                    >
                      {t.title}
                    </Link>
                  </td>
                  <td>{t.category}</td>
                  <td>
                    <PriorityPill priority={t.priority} />
                  </td>
                  <td>
                    <StatusBadge status={t.status} />
                  </td>
                  {/* Created By data cell visible only for Support Staff */}
                  {isSupport && (
                    <td data-testid={`ticket-created-by-${t.ticket_id}`}>
                      <span style={{ fontWeight: 600, color: "#334155" }}>
                        {t.created_by}
                      </span>
                    </td>
                  )}
                  <td style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                    {t.last_updated_date}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
