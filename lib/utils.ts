import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

export function formatDate(dateString: string, pattern = 'dd/MM/yyyy HH:mm'): string {
  try {
    return format(parseISO(dateString), pattern, { locale: es })
  } catch {
    return dateString
  }
}

export function formatRelativeTime(dateString: string): string {
  try {
    return formatDistanceToNow(parseISO(dateString), { addSuffix: true, locale: es })
  } catch {
    return dateString
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(amount)
}

export function truncateId(id: string, length = 8): string {
  return id.length > length ? `...${id.slice(-length)}` : id
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
