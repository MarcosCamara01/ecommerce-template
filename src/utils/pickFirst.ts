type SP = Record<string, string | string[] | undefined>;

export function pickFirst(sp: SP, key: string) {
  const v = sp[key];
  return typeof v === "string" ? v : Array.isArray(v) ? v[0] : undefined;
}
