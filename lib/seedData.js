// Shared Seed Data for both Client Context and Server Store

function formatDate(date) {
  const d = new Date(date);
  const day = d.getDate();
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function nowFormatted() {
  return formatDate(new Date());
}

const INITIAL_USERS = [
  { name: "Ravi", role: "Employee" },
  { name: "Priya", role: "Support Staff" },
];

const INITIAL_TICKETS = [
  {
    ticket_id: "1",
    title: "Laptop not charging",
    description:
      "Battery percentage stays at 0% even when plugged into the wall outlet.",
    category: "Hardware",
    priority: "High",
    status: "Open",
    created_by: "Ravi",
    created_date: "18 Nov 2026",
    last_updated_date: "18 Nov 2026",
    comments: [],
  },
  {
    ticket_id: "2",
    title: "Cannot log in to VPN",
    description:
      "Getting a 'connection timed out' error when trying to connect to the corporate VPN from home.",
    category: "Network",
    priority: "High",
    status: "In Progress",
    created_by: "Ravi",
    created_date: "18 Nov 2026",
    last_updated_date: "18 Nov 2026",
    comments: [
      {
        comment_id: "comment-1",
        ticket_id: "2",
        author_name: "Priya",
        comment_text: "Checking VPN gateway logs and user certificate permissions.",
        created_at: "2026-11-18T10:30:00.000Z",
      },
      {
        comment_id: "comment-2",
        ticket_id: "2",
        author_name: "Ravi",
        comment_text: "Thanks Priya, let me know if you need any error logs from my client.",
        created_at: "2026-11-18T11:15:00.000Z",
      },
    ],
  },
  {
    ticket_id: "3",
    title: "Need access to the shared project folder",
    description:
      "I need read/write access to the \\\\fileserver\\projects\\alpha shared folder for the Q4 deliverables.",
    category: "Access",
    priority: "Medium",
    status: "Open",
    created_by: "Ravi",
    created_date: "18 Nov 2026",
    last_updated_date: "18 Nov 2026",
    comments: [],
  },
  {
    ticket_id: "4",
    title: "Excel keeps crashing on startup",
    description:
      "Microsoft Excel crashes immediately upon launch. Tried restarting, issue persists.",
    category: "Software",
    priority: "Medium",
    status: "Resolved",
    created_by: "Ravi",
    created_date: "18 Nov 2026",
    last_updated_date: "18 Nov 2026",
    comments: [],
  },
  {
    ticket_id: "5",
    title: "Request a second monitor",
    description:
      "Requesting an additional monitor for my workstation to improve productivity.",
    category: "Hardware",
    priority: "Low",
    status: "Closed",
    created_by: "Ravi",
    created_date: "18 Nov 2026",
    last_updated_date: "18 Nov 2026",
    comments: [
      {
        comment_id: "comment-3",
        ticket_id: "5",
        author_name: "Priya",
        comment_text: "Monitor delivered and configured at workstation #4B. Closing ticket as completed.",
        created_at: "2026-11-18T14:00:00.000Z",
      },
    ],
  },
];

module.exports = {
  formatDate,
  nowFormatted,
  INITIAL_USERS,
  INITIAL_TICKETS,
};
