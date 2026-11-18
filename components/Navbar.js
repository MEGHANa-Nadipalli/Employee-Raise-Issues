"use client";

import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";

export default function Navbar() {
  const { currentUser, switchUser } = useAuth();

  const isRavi = currentUser?.name === "Ravi";
  const isPriya = currentUser?.name === "Priya";

  return (
    <header className="app-header" data-testid="app-header">
      <Link href="/" className="brand-title">
        <span>🎫 Employee Support Ticket App</span>
      </Link>

      <div className="header-actions">
        {/* Working Mock Auth Switcher */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>
            Active Profile:
          </span>

          <div className="role-switcher-group" role="group" aria-label="Mock User Profiles">
            <button
              type="button"
              id="switch-ravi"
              data-testid="role-switch-ravi"
              className={`role-switch-btn ${isRavi ? "active" : ""}`}
              onClick={() => switchUser("Ravi")}
              title="Switch to User A: Ravi (Employee)"
            >
              Ravi (Employee)
            </button>
            <button
              type="button"
              id="switch-priya"
              data-testid="role-switch-priya"
              className={`role-switch-btn ${isPriya ? "active" : ""}`}
              onClick={() => switchUser("Priya")}
              title="Switch to User B: Priya (Support Staff)"
            >
              Priya (Support Staff)
            </button>
          </div>

          <select
            id="role-switcher-select"
            data-testid="role-switcher-select"
            aria-label="Role Switcher"
            className="filter-select"
            style={{ padding: "4px 8px", fontSize: "0.8rem", display: "none" }}
            value={currentUser?.name || "Ravi"}
            onChange={(e) => switchUser(e.target.value)}
          >
            <option value="Ravi">Ravi (Employee)</option>
            <option value="Priya">Priya (Support Staff)</option>
          </select>
        </div>

        {/* Current User Badge */}
        {currentUser && (
          <div className="user-badge" data-testid="current-user-badge">
            <span data-testid="active-user-name">{currentUser.name}</span>
            <span className="role-tag" data-testid="active-user-role">{currentUser.role}</span>
          </div>
        )}

        <Link href="/ticket/new">
          <button className="btn btn-primary" data-testid="new-ticket-btn">+ New Ticket</button>
        </Link>
      </div>
    </header>
  );
}
