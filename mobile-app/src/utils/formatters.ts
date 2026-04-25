export function formatCurrency(amount: number): string {
  return `LKR ${amount.toLocaleString('en-LK', { minimumFractionDigits: 0 })}`;
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-LK', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatTime(date: string | Date): string {
  return new Date(date).toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit' });
}

export function daysUntil(date: string | Date): number {
  const diff = new Date(date).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
