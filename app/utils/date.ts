import { format, parseISO } from "date-fns";

export function extractDateString(date: string): string {
  const isoMatch = date.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return isoMatch[0];
  }

  const parsedDate = new Date(date);
  if (!Number.isNaN(parsedDate.getTime())) {
    return parsedDate.toISOString().split("T")[0];
  }

  return date;
}

export function formatDisplayDate(date: string): string {
  return format(parseISO(date), "d MMMM yyyy");
}
