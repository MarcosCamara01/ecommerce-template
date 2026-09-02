import { createSystemPrincipalForOrderFulfillment } from "../identity/principal-authority.ts";

export function getOrderFulfillmentSystemPrincipal() {
  return createSystemPrincipalForOrderFulfillment();
}
