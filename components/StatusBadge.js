export default function StatusBadge({ status }) {
  const norm = (status || "").toLowerCase().replace(/\s+/g, "-");
  let badgeClass = "badge-open";
  if (norm === "in-progress") badgeClass = "badge-in-progress";
  else if (norm === "resolved") badgeClass = "badge-resolved";
  else if (norm === "closed") badgeClass = "badge-closed";

  return (
    <span
      className={`badge-status ${badgeClass}`}
      data-testid="status-badge"
      data-status={status}
    >
      {status}
    </span>
  );
}
