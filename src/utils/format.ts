/**
 * Format date to locale string
 */
export const formatDate = (date: string | Date, locale: string = 'en-US'): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Format time to locale string
 */
export const formatTime = (date: string | Date, locale: string = 'en-US'): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format datetime to locale string
 */
export const formatDateTime = (date: string | Date, locale: string = 'en-US'): string => {
  return `${formatDate(date, locale)} ${formatTime(date, locale)}`;
};

/**
 * Format number with thousand separators
 */
export const formatNumber = (num: number, locale: string = 'en-US'): string => {
  return num.toLocaleString(locale);
};

/**
 * Truncate text to specified length
 */
export const truncate = (text: string, length: number): string => {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};
