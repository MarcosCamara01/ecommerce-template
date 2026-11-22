import { toNextJsHandler } from "better-auth/next-js";

import { auth, authTrustedOrigins } from "@/utils/auth";

const handlers = toNextJsHandler(auth);

// Better Auth never sends CORS headers. They matter only for a trusted origin
// other than the store's own, which the list does not hold today.
function trustedOriginHeaders(request: Request): Record<string, string> | null {
  const origin = request.headers.get("origin");
  if (!origin || !authTrustedOrigins.includes(origin)) return null;
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-credentials": "true",
  };
}

function withTrustedOrigin(handler: (request: Request) => Promise<Response>) {
  return async (request: Request) => {
    const response = await handler(request);
    const cors = trustedOriginHeaders(request);
    if (!cors) return response;
    const headers = new Headers(response.headers);
    for (const [name, value] of Object.entries(cors)) headers.set(name, value);
    headers.append("vary", "Origin");
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  };
}

export const GET = withTrustedOrigin(handlers.GET);
export const POST = withTrustedOrigin(handlers.POST);

export function OPTIONS(request: Request) {
  const cors = trustedOriginHeaders(request);
  return new Response(null, {
    status: 204,
    headers: cors
      ? {
          ...cors,
          "access-control-allow-methods": "GET, POST",
          "access-control-allow-headers": "content-type",
          vary: "Origin",
        }
      : {},
  });
}
