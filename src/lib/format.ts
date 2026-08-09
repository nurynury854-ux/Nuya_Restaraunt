export function formatOrderTime(iso: string, todayLabel: string = "Today"): string {
  const date = new Date(iso);
  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");

  if (isToday) return `${todayLabel} ${hh}:${mm}`;

  const MM = String(date.getMonth() + 1).padStart(2, "0");
  const DD = String(date.getDate()).padStart(2, "0");
  return `${MM}/${DD} ${hh}:${mm}`;
}
