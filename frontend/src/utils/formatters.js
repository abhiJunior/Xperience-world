import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';

export function formatDate(date, fmt = 'MMM d, yyyy') {
  if (!date) return '—';
  const d = typeof date === 'string' ? parseISO(date) : new Date(date);
  return isValid(d) ? format(d, fmt) : '—';
}

export function formatDateShort(date) {
  return formatDate(date, 'MMM d');
}

export function formatDateTime(date) {
  return formatDate(date, 'MMM d, yyyy · h:mm a');
}

export function formatRelative(date) {
  if (!date) return '—';
  const d = typeof date === 'string' ? parseISO(date) : new Date(date);
  return isValid(d) ? formatDistanceToNow(d, { addSuffix: true }) : '—';
}

export function formatCurrency(amount, currency = 'INR') {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(n) {
  if (n == null) return '—';
  return new Intl.NumberFormat('en-IN').format(n);
}

export function formatPercent(value, total) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function formatActionLabel(action) {
  return action.replace(/_/g, ' ').replace(/\./g, ' › ');
}
