import postgres from "postgres";

type SqlClient = ReturnType<typeof postgres>;

export type CheckoutBindingRoutine = Readonly<{
  owner: string;
  securityDefiner: boolean;
  language: string;
  argumentNames: string[] | null;
  argumentTypes: string;
  result: string;
  settings: string[] | null;
  body: string;
  privileges: string[];
}>;

const EXPECTED_BODY = `
  update app_private.checkout_intents as intent
  set checkout_session_id = p_checkout_session_id
  where intent.id = p_intent_id
    and intent.user_id = p_user_id
    and (
      intent.checkout_session_id is null
      or intent.checkout_session_id = p_checkout_session_id
    )
  returning intent.*
`;

const normalizeSql = (value: string) =>
  value
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\s*([(),=])\s*/g, "$1")
    .toLowerCase();

export async function inspectCheckoutBinding(
  sql: SqlClient,
): Promise<CheckoutBindingRoutine[]> {
  const rows = await sql`
    select
      pg_get_userbyid(routine.proowner) as owner,
      routine.prosecdef as "securityDefiner",
      language.lanname as language,
      routine.proargnames as "argumentNames",
      oidvectortypes(routine.proargtypes) as "argumentTypes",
      pg_get_function_result(routine.oid) as result,
      routine.proconfig as settings,
      routine.prosrc as body,
      array(
        select coalesce(grantee.rolname, 'PUBLIC') || ':' || acl.privilege_type
        from aclexplode(
          coalesce(routine.proacl, acldefault('f', routine.proowner))
        ) acl
        left join pg_roles grantee on grantee.oid = acl.grantee
        order by coalesce(grantee.rolname, 'PUBLIC'), acl.privilege_type
      ) as privileges
    from pg_proc routine
    join pg_namespace namespace_row on namespace_row.oid = routine.pronamespace
    join pg_language language on language.oid = routine.prolang
    where namespace_row.nspname = 'app_private'
      and routine.proname = 'bind_checkout_intent'
  `;
  return rows as unknown as CheckoutBindingRoutine[];
}

export function checkoutBindingContractFailures(
  routines: readonly CheckoutBindingRoutine[],
): string[] {
  if (routines.length !== 1) {
    return [`bind_checkout_intent overload count is ${routines.length}, expected 1`];
  }
  const routine = routines[0];
  const failures: string[] = [];
  if (routine.owner !== "app_owner") failures.push("owner is not app_owner");
  if (!routine.securityDefiner) failures.push("SECURITY DEFINER is missing");
  if (routine.language !== "sql") failures.push("language is not sql");
  if (
    JSON.stringify(routine.argumentNames) !==
      JSON.stringify(["p_user_id", "p_intent_id", "p_checkout_session_id"]) ||
    routine.argumentTypes !== "text, text, text"
  ) {
    failures.push("argument contract differs");
  }
  if (routine.result !== "SETOF app_private.checkout_intents") {
    failures.push("return contract differs");
  }
  if (
    JSON.stringify(routine.settings) !==
    JSON.stringify(["search_path=pg_catalog, app_private"])
  ) {
    failures.push("fixed search_path differs");
  }
  if (normalizeSql(routine.body) !== normalizeSql(EXPECTED_BODY)) {
    failures.push("write-once function body differs");
  }
  if (
    JSON.stringify(routine.privileges) !==
    JSON.stringify(["app_owner:EXECUTE", "app_runtime:EXECUTE"])
  ) {
    failures.push("function ACL differs");
  }
  return failures;
}
