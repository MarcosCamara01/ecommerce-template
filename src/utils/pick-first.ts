type SearchParams = Record<string, string | string[] | undefined>;

export function pickFirst(params: SearchParams, key: string) {
  const value = params[key];
  return typeof value === "string" ? value : Array.isArray(value) ? value[0] : undefined;
}
