import "server-only";

import { dataAccess } from "@/lib/data-access";
import type { UserPrincipal } from "@/lib/identity";

export const getUserOrders = (principal: UserPrincipal) =>
  dataAccess.forUser(principal).orders.list();
