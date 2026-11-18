# Employee Support Ticket App

A centralized web application designed to streamline internal support workflows between Employees and Support Staff. Built with Next.js (App Router), React, and an in-memory data store.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Run Acceptance Criteria & RBAC Tests
```bash
npm run test:ac
node scripts/test-auth-transports.js
```

---

## 👥 Mock Authentication & Role Switcher

A persistent navigation header is available across all pages, allowing one-click role switching between:
- **`Ravi (Employee)`**:
  - Filtered dashboard showing only tickets created by Ravi.
  - Can create new tickets.
  - Can view own submitted ticket details.
  - Status renders as a static read-only badge. Status-change controls are hidden.
  - Can edit Title, Description, Category, Priority for own non-closed tickets.
  - Can post and read comments on own tickets (even when Closed).
- **`Priya (Support Staff)`**:
  - Unified queue of all organizational tickets.
  - "Created By" column is displayed in the dashboard table.
  - Category filter dropdown is enabled.
  - Can open any ticket detail view and see an interactive **Status Dropdown** (`Open | In Progress | Resolved | Closed`).
  - Changing status updates the ticket and automatically refreshes `last_updated_date`.
  - Can edit core ticket fields (Title, Description, Category, Priority) for any non-closed ticket.
  - Can post and read comments on any ticket (even when Closed).

State is synchronized across **React Context**, **LocalStorage**, **Session Cookies** (`currentUser`, `userName`, `userRole`), and the server-side store via `/api/users/active`.

---

## 💬 Ticket Comments Feature (Step 4)

- **Chronological Comment Thread**:
  - Schema: `comment_id`, `ticket_id`, `author_name`, `comment_text`, `created_at`.
  - Initialized with realistic seed comments on preloaded sample tickets.
- **Dedicated Section on Ticket Detail View**:
  - Chronological feed displaying author name, formatted timestamp, and comment body.
  - Comment form with live validation (blocks empty or whitespace-only submissions).
  - Submitting appends the comment to the thread and updates the parent ticket's `last_updated_date`.
  - **Crucial Rule:** Commenting remains fully functional even when a ticket is in `Closed` status.

---

## 🔒 Closed Ticket Rule

- When a ticket status is `Closed`:
  - Core fields (`Title`, `Description`, `Category`, `Priority`) are strictly locked against edits in both UI and API.
  - The "Edit Ticket" button is hidden.
  - Reopening the ticket (changing status to `Open` or `In Progress`) re-enables the editing controls.
  - Comments thread remains open and active.
