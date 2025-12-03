// src/lib/utils.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getUserDisplayName = (user: any): string => {
  if (!user) return 'Неизвестный пользователь';

  if (user.name) return user.name;
  if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
  if (user.firstName) return user.firstName;
  if (user.lastName) return user.lastName;
  if (user.email) return user.email.split('@')[0];
  return 'Неизвестный пользователь';
};

export const formatDate = (date: Date | string | undefined): string => {
  if (!date) return 'Нет срока';

  try {
    const dateObj = date instanceof Date ? date : new Date(date);

    if (isNaN(dateObj.getTime())) {
      return 'Нет срока';
    }

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Сбрасываем время для сравнения только дат
    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    const compareDate = new Date(dateObj);
    compareDate.setHours(0, 0, 0, 0);

    if (compareDate.getTime() === today.getTime()) {
      return 'Сегодня';
    } else if (compareDate.getTime() === tomorrow.getTime()) {
      return 'Завтра';
    } else if (compareDate.getTime() < today.getTime()) {
      // Просроченные
      const diffDays = Math.floor(
        (today.getTime() - compareDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      return `${diffDays} дн. назад`;
    }

    return dateObj.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: dateObj.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    });
  } catch {
    return 'Нет срока';
  }
};

export const getInitials = (user: any): string => {
  if (!user) return 'U';

  if (user.firstName && user.firstName.length > 0) {
    return user.firstName[0].toUpperCase();
  }
  if (user.email && user.email.length > 0) {
    return user.email[0].toUpperCase();
  }
  return 'U';
};
