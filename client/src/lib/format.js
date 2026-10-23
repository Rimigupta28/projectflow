function formatDate(value) {
  if (!value) return "No due date";
  return new Intl.DateTimeFormat(void 0, { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}
function initials(name) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("");
}
export {
  formatDate,
  initials
};
