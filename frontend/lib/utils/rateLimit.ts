const LIMIT = 10;
const WINDOW = 24 * 60 * 60 * 1000; // 24h
const KEY = 'public-chat-limit';

type LimitData = {
  count: number;
  resetAt: number;
};

export function getLimitData(): LimitData | null {
  if (typeof window === 'undefined') return null;

  const raw = localStorage.getItem(KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<LimitData>;

    if (typeof parsed.count !== 'number' || typeof parsed.resetAt !== 'number') {
      localStorage.removeItem(KEY);
      return null;
    }

    return { count: parsed.count, resetAt: parsed.resetAt };
  } catch {
    localStorage.removeItem(KEY);
    return null;
  }
}

export function canSendMessage(): boolean {
  if (typeof window === 'undefined') return true;

  const data = getLimitData();

  if (!data) return true;

  if (Date.now() > data.resetAt) {
    localStorage.removeItem(KEY);
    return true;
  }

  return data.count < LIMIT;
}

export function registerMessage(): void {
  if (typeof window === 'undefined') return;

  const data = getLimitData();

  if (!data) {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        count: 1,
        resetAt: Date.now() + WINDOW,
      })
    );
    return;
  }

  data.count += 1;
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function getRemainingTime(): number {
  if (typeof window === 'undefined') return 0;

  const data = getLimitData();
  if (!data) return 0;

  return Math.max(0, data.resetAt - Date.now());
}

export function resetLimitData(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEY);
}
