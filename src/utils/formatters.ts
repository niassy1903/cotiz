/**
 * Utility formatters for Cotiz
 * Currency is strictly FCFA (XOF) in v1
 */

export function formatFCFA(amount: number): string {
  if (isNaN(amount)) return '0 FCFA';
  // Use non-breaking space for thousands
  const formatted = Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${formatted} FCFA`;
}

export function formatDate(dateString: string, options?: { showTime?: boolean; short?: boolean }): string {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;

    if (options?.short) {
      return d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
      });
    }

    if (options?.showTime) {
      return d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }

    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function formatPhone(phone: string): string {
  if (!phone) return '';
  return phone;
}

export function getInitials(name: string): string {
  if (!name) return 'CO';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
