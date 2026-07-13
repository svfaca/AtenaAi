export function resolveAvatarUrl(
  avatar?: string | null,
  baseUrl?: string | null
): string | null {
  if (!avatar || typeof avatar !== 'string') {
    return null;
  }

  const trimmed = avatar.trim();
  if (!trimmed) {
    return null;
  }

  const normalizedBase = (baseUrl || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');

  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('data:')) {
    if (trimmed.startsWith('data:')) {
      return trimmed;
    }

    if (/^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?/i.test(trimmed)) {
      return trimmed.replace(/^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?/i, normalizedBase);
    }

    return trimmed;
  }

  if (trimmed.startsWith('/')) {
    return `${normalizedBase}${trimmed}`;
  }

  return `${normalizedBase}/${trimmed}`;
}
