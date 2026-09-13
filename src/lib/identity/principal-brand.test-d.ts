import type { UserPrincipal } from "./index";

// @ts-expect-error Principals can only be issued by the identity authority.
const fabricatedPrincipal: UserPrincipal = {
  kind: "user",
  userId: "attacker-controlled",
  capabilities: ["catalog:manage"],
};

void fabricatedPrincipal;
