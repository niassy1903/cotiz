export function generateId(prefix: string): string {
  const random = Math.random().toString(36).substring(2, 8);
  const time = Date.now().toString(36).slice(-4);
  return `${prefix}-${time}-${random}`;
}

export function copyToClipboard(text: string): Promise<boolean> {
  if (navigator?.clipboard?.writeText) {
    return navigator.clipboard.writeText(text).then(() => true).catch(() => false);
  }
  return Promise.resolve(false);
}

export function canUndo(timestamp: string, maxHours = 1): boolean {
  try {
    const actionTime = new Date(timestamp).getTime();
    const now = Date.now();
    const diffHours = (now - actionTime) / (1000 * 60 * 60);
    return diffHours <= maxHours;
  } catch {
    return false;
  }
}
