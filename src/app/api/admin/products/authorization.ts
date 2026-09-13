type CapabilityResolver<Principal> = (
  headers: Headers,
  capability: "catalog:manage",
) => Promise<Principal>;

export type CatalogRouteAuthorization<Principal> =
  | Readonly<{ ok: true; principal: Principal }>
  | Readonly<{ ok: false; response: Response }>;

export async function authorizeCatalogRoute<Principal>(
  headers: Headers,
  resolveCapability: CapabilityResolver<Principal>,
  classifyError: (error: unknown) => 401 | 403 | null,
): Promise<CatalogRouteAuthorization<Principal>> {
  try {
    return {
      ok: true,
      principal: await resolveCapability(headers, "catalog:manage"),
    };
  } catch (error) {
    const status = classifyError(error);
    if (!status) throw error;
    return {
      ok: false,
      response: Response.json(
        { error: status === 401 ? "Unauthorized" : "Forbidden" },
        { status },
      ),
    };
  }
}

export function createCatalogRouteHandler<
  Request extends { headers: Headers },
  Principal,
>(
  resolveCapability: CapabilityResolver<Principal>,
  classifyError: (error: unknown) => 401 | 403 | null,
  handleAuthorized: (request: Request, principal: Principal) => Promise<Response>,
) {
  return async (request: Request): Promise<Response> => {
    const authorization = await authorizeCatalogRoute(
      request.headers,
      resolveCapability,
      classifyError,
    );
    if (!authorization.ok) return authorization.response;
    return handleAuthorized(request, authorization.principal);
  };
}
