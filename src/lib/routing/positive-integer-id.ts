export function parsePositiveIntegerId(value: string): number | null {
  const parsed = Number(value);
  return /^[1-9]\d*$/.test(value) && Number.isSafeInteger(parsed)
    ? parsed
    : null;
}
