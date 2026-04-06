// Utilitários de uso geral

/**
 * Combina classes CSS com tratamento de valores falsy
 * Versão simplificada sem tailwind-merge (classes são concatenadas diretamente)
 */
export function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs
    .filter((input): input is string => Boolean(input) && typeof input === 'string')
    .join(' ')
    .trim();
}

/**
 * Formata data em formato brasileiro (pt-BR)
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

/**
 * Formata data em formato relativo (ex: "5m atrás")
 */
export function formatRelative(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Agora';
  if (diffMins < 60) return `${diffMins}m atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  if (diffDays < 7) return `${diffDays}d atrás`;
  return formatDate(dateString);
}
