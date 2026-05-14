/** Toggle string filter: same value clears (deselect). */
export function toggleString(current: string, next: string): string {
  return current === next ? "" : next;
}

export function isYearMonthKey(key: string): boolean {
  return /^\d{4}-\d{2}$/.test(key);
}
