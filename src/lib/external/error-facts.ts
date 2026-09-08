export type ExternalErrorFacts = Readonly<{
  code: string | null;
  type: string | null;
  statusCode: number | null;
  detail: string;
}>;

export function externalErrorFacts(error: unknown): ExternalErrorFacts {
  if (typeof error !== "object" || error === null) {
    return {
      code: null,
      type: null,
      statusCode: null,
      detail: String(error),
    };
  }

  const statusCode =
    "statusCode" in error ? Number(error.statusCode) : Number.NaN;
  return {
    code: "code" in error ? String(error.code) : null,
    type: "type" in error ? String(error.type) : null,
    statusCode: Number.isFinite(statusCode) ? statusCode : null,
    detail: error instanceof Error ? error.message : String(error),
  };
}
