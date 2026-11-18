export default function PriorityPill({ priority }) {
  const norm = (priority || "").toLowerCase();
  let pillClass = "pill-low";
  if (norm === "high") pillClass = "pill-high";
  else if (norm === "medium") pillClass = "pill-medium";

  return <span className={`pill-priority ${pillClass}`}>{priority}</span>;
}
