/**
 * Helper function to format dates for iCalendar.
 * @param date - The date to format.
 * @returns A formatted date string.
 */
export const formatDate = (date: Date): string => {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
};

/**
 * Helper function to format dates for all-day iCalendar events.
 * @param date - The date to format.
 * @returns A formatted date-only string (YYYYMMDD).
 */
export const formatDateOnly = (date: Date): string => {
  return date.toISOString().split("T")[0].replace(/-/g, "");
};
