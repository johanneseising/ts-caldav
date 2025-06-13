/**
 * Helper function to format dates for iCalendar.
 * @param date - The date to format.
 * @param utc - Whether to format in UTC (default: true)
 * @returns A formatted date string.
 */
export const formatDate = (date: Date, utc: boolean = true): string => {
  const pad = (n: number): string => n.toString().padStart(2, "0");

  if (utc) {
    return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  } else {
    return (
      date.getFullYear().toString() +
      pad(date.getMonth() + 1) +
      pad(date.getDate()) +
      "T" +
      pad(date.getHours()) +
      pad(date.getMinutes()) +
      pad(date.getSeconds())
    );
  }
};

/**
 * Helper function to format dates for iCalendar with timezone.
 * @param date - The date to format.
 * @param tzid - The timezone ID (optional).
 * @returns A formatted date string for iCalendar with timezone.
 */
export const formatDateWithTz = (date: Date, tzid?: string): string => {
  if (tzid) {
    return `DTSTART;TZID=${tzid}:${formatDate(date, false)}`;
  }
  return `DTSTART:${formatDate(date)}`;
};

/**
 * Helper function to format dates for all-day iCalendar events.
 * @param date - The date to format.
 * @returns A formatted date-only string (YYYYMMDD).
 */
export const formatDateOnly = (date: Date): string => {
  return date.toISOString().split("T")[0].replace(/-/g, "");
};
