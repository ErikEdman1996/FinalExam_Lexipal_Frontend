export function getViteStringEnv(key: string, fallback: string): string
{
  const value = (import.meta.env as unknown as Record<string, unknown>)[key];

  if (typeof value === 'string' && value.trim() !== '') {
    return value;
  }

  return fallback;
}
