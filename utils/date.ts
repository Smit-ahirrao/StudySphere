// Get YYYY-MM-DD string for a date in local time
export const getLocalDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Format YYYY-MM-DD string to locale date string
export const formatDisplayDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  // Create date at local noon to avoid timezone shifts causing previous day
  const date = new Date(year, month - 1, day, 12, 0, 0);
  return date.toLocaleDateString();
};

// Get last 7 days as YYYY-MM-DD strings in local time
export const getLast7Days = (): string[] => {
  const dates = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    dates.push(getLocalDateKey(d));
  }
  return dates;
};