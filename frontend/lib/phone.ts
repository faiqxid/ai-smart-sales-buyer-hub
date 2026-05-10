export function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  if (cleaned.startsWith('+62')) return cleaned.slice(1);
  if (cleaned.startsWith('62')) return cleaned;
  if (cleaned.startsWith('08')) return '62' + cleaned.slice(1);
  if (cleaned.startsWith('8')) return '62' + cleaned;
  return cleaned;
}

export function toWaLink(phone: string): string {
  return `https://wa.me/${normalizePhone(phone)}`;
}

export function toCallLink(phone: string): string {
  return `tel:+${normalizePhone(phone)}`;
}
