/**
 * Helper function to format dates for iCalendar.
 * @param date - The date to format.
 * @returns A formatted date string.
 */
export const formatDate = (date: Date): string => {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
};
