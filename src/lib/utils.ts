import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Locale } from '@/i18n/types';
import { getMessages, translate } from '@/i18n/get-messages';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeTime(
  date: string | Date,
  locale: Locale = 'en'
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const m = getMessages(locale);
  const diff = Date.now() - d.getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return translate(m, 'time.justNow');
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return translate(m, 'time.minutesAgo', { n: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return translate(m, 'time.hoursAgo', { n: hours });
  const days = Math.floor(hours / 24);
  if (days < 7) return translate(m, 'time.daysAgo', { n: days });
  return d.toLocaleDateString(locale === 'ja' ? 'ja-JP' : 'en-US');
}
