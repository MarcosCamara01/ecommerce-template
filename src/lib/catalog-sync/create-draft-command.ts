export type StoredCreateCommand = Readonly<{
  id: string;
  fingerprint: string;
}>;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function parseStoredCreateCommand(
  value: string | null,
): StoredCreateCommand | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<StoredCreateCommand>;
    if (
      typeof parsed.id !== "string" ||
      !UUID_PATTERN.test(parsed.id) ||
      typeof parsed.fingerprint !== "string" ||
      !parsed.fingerprint
    ) {
      return null;
    }
    return { id: parsed.id, fingerprint: parsed.fingerprint };
  } catch {
    return null;
  }
}

export function selectCreateCommand(
  storedValue: string | null,
  fingerprint: string,
  createId: () => string,
): StoredCreateCommand {
  const stored = parseStoredCreateCommand(storedValue);
  if (stored?.fingerprint === fingerprint) return stored;
  return { id: createId(), fingerprint };
}

export function serializeCreateCommand(command: StoredCreateCommand): string {
  return JSON.stringify(command);
}
