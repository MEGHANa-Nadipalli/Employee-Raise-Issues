"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { INITIAL_USERS, INITIAL_TICKETS, nowFormatted } from "./seedData";

const AppContext = createContext(null);

export function AuthProvider({ children }) {
  // User A: { name: "Ravi", role: "Employee" }
  // User B: { name: "Priya", role: "Support Staff" }
  const [currentUser, setCurrentUser] = useState(INITIAL_USERS[0]);
  const [tickets, setTickets] = useState(INITIAL_TICKETS);
  const [isClientLoaded, setIsClientLoaded] = useState(false);

  // Sync cookies and local/session storage
  const syncUserState = useCallback((user) => {
    if (typeof window !== "undefined" && user) {
      try {
        localStorage.setItem("currentUser", JSON.stringify(user));
        sessionStorage.setItem("currentUser", JSON.stringify(user));
        document.cookie = `currentUser=${encodeURIComponent(JSON.stringify(user))}; path=/; max-age=86400`;
        document.cookie = `userName=${encodeURIComponent(user.name)}; path=/; max-age=86400`;
        document.cookie = `userRole=${encodeURIComponent(user.role)}; path=/; max-age=86400`;
      } catch (e) {}
    }
  }, []);

  const syncTicketsState = useCallback((updatedTickets) => {
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem("app_tickets", JSON.stringify(updatedTickets));
      } catch (e) {}
    }
  }, []);

  // Hydrate on mount from session storage if present
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Restore user
      let savedUser = null;
      try {
        const raw = sessionStorage.getItem("currentUser") || localStorage.getItem("currentUser");
        if (raw) {
          const parsed = JSON.parse(raw);
          savedUser = INITIAL_USERS.find(
            (u) => u.name.toLowerCase() === parsed.name?.toLowerCase()
          );
        }
      } catch (e) {}

      const activeUser = savedUser || INITIAL_USERS[0];
      setCurrentUser(activeUser);
      syncUserState(activeUser);

      // Restore tickets
      try {
        const rawTickets = sessionStorage.getItem("app_tickets");
        if (rawTickets) {
          const parsedTickets = JSON.parse(rawTickets);
          if (Array.isArray(parsedTickets) && parsedTickets.length >= 5) {
            setTickets(parsedTickets);
          }
        }
      } catch (e) {}

      setIsClientLoaded(true);

      // Notify backend if available
      fetch("/api/users/active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(activeUser),
      }).catch(() => {});
    }
  }, [syncUserState]);

  // Instant switch between Ravi (Employee) and Priya (Support Staff)
  const switchUser = useCallback(
    (nameOrRole) => {
      const target = INITIAL_USERS.find(
        (u) =>
          u.name.toLowerCase() === String(nameOrRole).toLowerCase() ||
          u.role.toLowerCase() === String(nameOrRole).toLowerCase()
      );

      if (target) {
        setCurrentUser(target);
        syncUserState(target);

        // Notify server in background
        fetch("/api/users/active", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(target),
        }).catch(() => {});
      }
    },
    [syncUserState]
  );

  // Update Ticket Status (Support Staff privilege)
  const updateTicketStatus = useCallback(
    async (ticketId, newStatus) => {
      const now = nowFormatted();
      let updatedTicket = null;

      setTickets((prev) => {
        const next = prev.map((t) => {
          if (String(t.ticket_id) === String(ticketId)) {
            updatedTicket = {
              ...t,
              status: newStatus,
              last_updated_date: now,
            };
            return updatedTicket;
          }
          return t;
        });
        syncTicketsState(next);
        return next;
      });

      // Background API sync
      fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-name": currentUser.name,
          "x-user-role": currentUser.role,
        },
        body: JSON.stringify({ status: newStatus }),
      }).catch(() => {});

      return updatedTicket;
    },
    [currentUser, syncTicketsState]
  );

  // Update Ticket Details (Title, Description, Category, Priority)
  const updateTicketFields = useCallback(
    async (ticketId, fields) => {
      const now = nowFormatted();
      let updatedTicket = null;

      setTickets((prev) => {
        const next = prev.map((t) => {
          if (String(t.ticket_id) === String(ticketId)) {
            // Cannot edit if closed
            if (t.status === "Closed") return t;
            updatedTicket = {
              ...t,
              ...fields,
              last_updated_date: now,
            };
            return updatedTicket;
          }
          return t;
        });
        syncTicketsState(next);
        return next;
      });

      // Background API sync
      fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-name": currentUser.name,
          "x-user-role": currentUser.role,
        },
        body: JSON.stringify(fields),
      }).catch(() => {});

      return updatedTicket;
    },
    [currentUser, syncTicketsState]
  );

  // Add Comment to Ticket (Step 4)
  const addCommentToTicket = useCallback(
    async (ticketId, commentText) => {
      if (!commentText || !commentText.trim()) {
        return { success: false, error: "Comment text cannot be empty or whitespace-only." };
      }

      const now = nowFormatted();
      const newComment = {
        comment_id: `comment-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        ticket_id: String(ticketId),
        author_name: currentUser.name,
        comment_text: commentText.trim(),
        created_at: new Date().toISOString(),
      };

      let updatedTicket = null;

      setTickets((prev) => {
        const next = prev.map((t) => {
          if (String(t.ticket_id) === String(ticketId)) {
            const currentComments = Array.isArray(t.comments) ? t.comments : [];
            updatedTicket = {
              ...t,
              last_updated_date: now,
              comments: [...currentComments, newComment],
            };
            return updatedTicket;
          }
          return t;
        });
        syncTicketsState(next);
        return next;
      });

      // Background API sync
      fetch(`/api/tickets/${ticketId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-name": currentUser.name,
          "x-user-role": currentUser.role,
        },
        body: JSON.stringify({ comment_text: commentText.trim() }),
      }).catch(() => {});

      return { success: true, comment: newComment, ticket: updatedTicket };
    },
    [currentUser, syncTicketsState]
  );

  // Create Ticket
  const createTicket = useCallback(
    async ({ title, description, category, priority }) => {
      const now = nowFormatted();
      const newId = String(Date.now());
      const newTicket = {
        ticket_id: newId,
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        status: "Open",
        created_by: currentUser.name,
        created_date: now,
        last_updated_date: now,
        comments: [],
      };

      setTickets((prev) => {
        const next = [...prev, newTicket];
        syncTicketsState(next);
        return next;
      });

      fetch("/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-name": currentUser.name,
          "x-user-role": currentUser.role,
        },
        body: JSON.stringify({ title, description, category, priority }),
      }).catch(() => {});

      return newTicket;
    },
    [currentUser, syncTicketsState]
  );

  const isSupport = currentUser?.role === "Support Staff";
  const isEmployee = currentUser?.role === "Employee";

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users: INITIAL_USERS,
        switchUser,
        isSupport,
        isEmployee,
        tickets,
        updateTicketStatus,
        updateTicketFields,
        addCommentToTicket,
        createTicket,
        isClientLoaded,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export function useTickets() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useTickets must be used inside AuthProvider");
  return ctx;
}
