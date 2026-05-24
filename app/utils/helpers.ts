/**
 * Utility to split a story string into clean display lines.
 * - Splits on sentence-ending punctuation followed by whitespace.
 * - Removes blank lines and leading/trailing whitespace.
 * - Handles Tamil, Hindi, and English punctuation.
 */
export function splitIntoLines(text: string): string[] {
  // Split on '. ', '! ', '? ', '।', '?' followed by optional whitespace
  const raw = text
    .replace(/\r\n/g, '\n')
    .split(/(?<=[.!?।])\s+|(?<=\n)\s*\n/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  return raw;
}

/**
 * Generate a simple unique ID from current timestamp + random string.
 */
export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Truncate a string to maxChars, appending '…' if truncated.
 */
export function truncate(str: string, maxChars: number): string {
  if (str.length <= maxChars) return str;
  return str.slice(0, maxChars - 1) + '…';
}

/**
 * Format a unix timestamp (ms) as a readable date string.
 */
export function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(timestamp));
}
