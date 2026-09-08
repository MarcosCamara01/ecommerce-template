import postgres from "postgres";

import {
  compareSchemaContract,
  inspectDatabaseStructure,
  loadSchemaContract,
} from "./schema-contract";
import {
  checkoutBindingContractFailures,
  inspectCheckoutBinding,
} from "./checkout-binding-contract";

const EXPECTED_PRIVILEGES: Record<string, string[]> = {
  user: ["DELETE", "INSERT", "SELECT", "UPDATE"],
  session: ["DELETE", "INSERT", "SELECT", "UPDATE"],
  account: ["DELETE", "INSERT", "SELECT", "UPDATE"],
  verification: ["DELETE", "INSERT", "SELECT", "UPDATE"],
  products_items: ["INSERT", "SELECT", "UPDATE"],
  products_variants: ["INSERT", "SELECT", "UPDATE"],
  catalog_sync_operations: ["INSERT", "SELECT", "UPDATE"],
  catalog_sync_replay_audit: ["INSERT"],
  cart_items: ["DELETE", "INSERT", "SELECT", "UPDATE"],
  wishlist: ["DELETE", "INSERT", "SELECT", "UPDATE"],
  checkout_intents: ["INSERT", "SELECT"],
  order_items: ["INSERT", "SELECT"],
  customer_info: ["INSERT", "SELECT"],
  order_products: ["INSERT", "SELECT"],
  stripe_event_receipts: ["INSERT"],
  fulfillment_work: ["INSERT", "SELECT", "UPDATE"],
  fulfillment_effects: ["INSERT", "SELECT", "UPDATE"],
  fulfillment_replay_audit: ["INSERT"],
};

const failures: string[] = [];

async function main() {
  const url = process.env.VERIFY_DATABASE_URL;
  if (!url) throw new Error("VERIFY_DATABASE_URL must use the app_runtime credential");
  const sql = postgres(url, { max: 1, prepare: false });
  try {
    const expectedSchema = await loadSchemaContract();
    const [identity] = await sql`
      select current_user as current_user, session_user as session_user
    `;
    check(
      identity.current_user === "app_runtime" &&
        identity.session_user === "app_runtime",
      "authenticated connection and current role are app_runtime",
    );

    const roles = await sql`
      select rolname, rolsuper, rolcreatedb, rolcreaterole, rolcanlogin, rolinherit,
             rolreplication, rolbypassrls
      from pg_roles
      where rolname in ('app_owner', 'app_migrator', 'app_runtime')
    `;
    const roleByName = new Map(roles.map((role) => [role.rolname, role]));
    const owner = roleByName.get("app_owner");
    const migrator = roleByName.get("app_migrator");
    const runtime = roleByName.get("app_runtime");
    check(roles.length === 3, "all three application roles exist");
    check(owner?.rolcanlogin === false, "app_owner cannot log in");
    check(migrator?.rolcanlogin === true, "app_migrator can log in");
    check(runtime?.rolcanlogin === true, "app_runtime can log in");
    check(migrator?.rolinherit === false, "app_migrator does not inherit app_owner");
    check(
      [owner, migrator, runtime].every(
        (role) => role && !role.rolsuper && !role.rolcreatedb &&
          !role.rolcreaterole && !role.rolreplication && !role.rolbypassrls,
      ),
      "application roles have no elevated attributes",
    );

    const [databaseFacts] = await sql`
      select current_setting('server_version_num')::integer as version,
             pg_get_userbyid(database_row.datdba) as owner_name
      from pg_database database_row
      where database_row.datname = current_database()
    `;
    const hasPerGrantMembershipOptions = databaseFacts.version >= 160000;
    const directAppOwnerMembers = hasPerGrantMembershipOptions
      ? await sql`
          select member_role.rolname as member_name,
                 member_role.rolcreaterole as member_can_create_roles,
                 membership.admin_option,
                 membership.inherit_option,
                 membership.set_option,
                 grantor_role.rolsuper as grantor_is_superuser
          from pg_auth_members membership
          join pg_roles granted_role on granted_role.oid = membership.roleid
          join pg_roles member_role on member_role.oid = membership.member
          join pg_roles grantor_role on grantor_role.oid = membership.grantor
          where granted_role.rolname = 'app_owner'
          order by member_role.rolname
        `
      : await sql`
          select member_role.rolname as member_name,
                 member_role.rolcreaterole as member_can_create_roles,
                 membership.admin_option,
                 false as inherit_option,
                 false as set_option,
                 grantor_role.rolsuper as grantor_is_superuser
          from pg_auth_members membership
          join pg_roles granted_role on granted_role.oid = membership.roleid
          join pg_roles member_role on member_role.oid = membership.member
          join pg_roles grantor_role on grantor_role.oid = membership.grantor
          where granted_role.rolname = 'app_owner'
          order by member_role.rolname
        `;
    const canonicalAppOwnerMembers = directAppOwnerMembers.filter(
      (membership) =>
        membership.member_name === "app_migrator" &&
        membership.admin_option === false &&
        (!hasPerGrantMembershipOptions ||
          (membership.inherit_option === false &&
            membership.set_option === true)),
    );
    const creatorAdministrativeMembers = directAppOwnerMembers.filter(
      (membership) =>
        hasPerGrantMembershipOptions &&
        membership.member_name === databaseFacts.owner_name &&
        membership.member_can_create_roles === true &&
        membership.grantor_is_superuser === true &&
        membership.admin_option === true &&
        membership.inherit_option === false &&
        membership.set_option === false,
    );
    check(
      canonicalAppOwnerMembers.length === 1 &&
        creatorAdministrativeMembers.length <= 1 &&
        directAppOwnerMembers.length ===
          canonicalAppOwnerMembers.length +
            creatorAdministrativeMembers.length,
      "app_owner has only the migrator and optional database-owner creator administration",
    );

    const unexpectedAppOwnerMembers = hasPerGrantMembershipOptions
      ? await sql`
          with recursive app_owner_members(member_oid) as (
            select membership.member
            from pg_auth_members membership
            join pg_roles granted_role on granted_role.oid = membership.roleid
            where granted_role.rolname = 'app_owner'
              and (membership.inherit_option or membership.set_option)

            union

            select membership.member
            from pg_auth_members membership
            join app_owner_members parent
              on membership.roleid = parent.member_oid
            where membership.inherit_option or membership.set_option
          )
          select member_role.rolname as member_name
          from app_owner_members membership
          join pg_roles member_role on member_role.oid = membership.member_oid
          where member_role.rolname <> 'app_migrator'
          order by member_role.rolname
        `
      : await sql`
          with recursive app_owner_members(member_oid) as (
            select membership.member
            from pg_auth_members membership
            join pg_roles granted_role on granted_role.oid = membership.roleid
            where granted_role.rolname = 'app_owner'

            union

            select membership.member
            from pg_auth_members membership
            join app_owner_members parent
              on membership.roleid = parent.member_oid
          )
          select member_role.rolname as member_name
          from app_owner_members membership
          join pg_roles member_role on member_role.oid = membership.member_oid
          where member_role.rolname <> 'app_migrator'
          order by member_role.rolname
        `;
    check(
      unexpectedAppOwnerMembers.length === 0,
      `no other role can reach app_owner membership${
        unexpectedAppOwnerMembers.length
          ? `: ${unexpectedAppOwnerMembers.map((row) => row.member_name).join(", ")}`
          : ""
      }`,
    );

    const contractFailures = compareSchemaContract(
      expectedSchema,
      await inspectDatabaseStructure(sql),
    );
    check(contractFailures.length === 0, `schema matches Drizzle snapshot${contractFailures.length ? `: ${contractFailures.join("; ")}` : ""}`);
    const publicTables = await sql`
      select tablename from pg_tables
      where schemaname = 'public' and tablename = any(${expectedSchema.tables})
    `;
    check(publicTables.length === 0, "public contains no application tables");

    const ownership = await sql`
      select c.relname, c.relkind, pg_get_userbyid(c.relowner) as owner,
             c.relrowsecurity
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'app_private' and c.relkind in ('r', 'S')
    `;
    check(ownership.every((row) => row.owner === "app_owner"), "tables and sequences are owned by app_owner");
    check(
      ownership.filter((row) => row.relkind === "r").every((row) => row.relrowsecurity === false),
      "private tables do not use RLS",
    );
    const policies = await sql`
      select count(*)::int as count from pg_policies where schemaname = 'app_private'
    `;
    check(policies[0].count === 0, "private schema has zero policies");
    const schemas = await sql`
      select nspname, pg_get_userbyid(nspowner) as owner
      from pg_namespace where nspname in ('app_private', 'drizzle')
    `;
    check(
      schemas.length === 2 && schemas.every((schema) => schema.owner === "app_owner"),
      "private and migration schemas are owned by app_owner",
    );
    const enumOwnership = await sql`
      select t.typname, pg_get_userbyid(t.typowner) as owner
      from pg_type t join pg_namespace n on n.oid = t.typnamespace
      where n.nspname = 'app_private' and t.typtype = 'e'
    `;
    check(
      enumOwnership.length > 0 && enumOwnership.every((type) => type.owner === "app_owner"),
      "private enums are owned by app_owner",
    );

    const memberships = await sql`
      select member.rolname as member, parent.rolname as parent
      from pg_auth_members membership
      join pg_roles member on member.oid = membership.member
      join pg_roles parent on parent.oid = membership.roleid
      where member.rolname in ('app_migrator', 'app_runtime')
    `;
    const migratorParents = memberships
      .filter((row) => row.member === "app_migrator")
      .map((row) => String(row.parent))
      .sort();
    const runtimeParents = memberships
      .filter((row) => row.member === "app_runtime")
      .map((row) => String(row.parent))
      .sort();
    check(
      JSON.stringify(migratorParents) === JSON.stringify(["app_owner"]),
      "app_migrator belongs only to app_owner",
    );
    check(runtimeParents.length === 0, "app_runtime has no role memberships");
    const appOwnerParents = await sql`
      select parent_role.rolname as parent
      from pg_auth_members membership
      join pg_roles member_role on member_role.oid = membership.member
      join pg_roles parent_role on parent_role.oid = membership.roleid
      where member_role.rolname = 'app_owner'
      order by parent_role.rolname
    `;
    check(
      appOwnerParents.length === 0,
      "app_owner has no parent role memberships",
    );
    const [databasePrivileges] = await sql`
      select
        has_database_privilege('app_owner', current_database(), 'CREATE') as owner_can_create,
        has_database_privilege('app_runtime', current_database(), 'CREATE') as runtime_can_create,
        exists(
          select 1
          from pg_database database_row
          cross join lateral aclexplode(
            coalesce(database_row.datacl, acldefault('d', database_row.datdba))
          ) acl
          where database_row.datname = current_database()
            and acl.grantee = 0
            and acl.privilege_type = 'CREATE'
        ) as public_can_create
    `;
    check(
      databasePrivileges.owner_can_create === true &&
        databasePrivileges.runtime_can_create === false &&
        databasePrivileges.public_can_create === false,
      "database CREATE is reserved for app_owner",
    );

    const privileges = await sql`
      select table_name, privilege_type
      from information_schema.role_table_grants
      where grantee = 'app_runtime' and table_schema = 'app_private'
      order by table_name, privilege_type
    `;
    const actualPrivileges: Record<string, string[]> = {};
    for (const row of privileges) {
      (actualPrivileges[row.table_name] ??= []).push(row.privilege_type);
    }
    check(
      JSON.stringify(actualPrivileges) === JSON.stringify(
        Object.fromEntries(Object.entries(EXPECTED_PRIVILEGES).sort(([a], [b]) => a.localeCompare(b))),
      ),
      "runtime table grants match the exact allowlist",
    );
    const runtimeColumnPrivileges = await sql`
      select table_row.relname as table_name,
             attribute.attname as column_name,
             upper(acl.privilege_type) as privilege_type
      from pg_attribute attribute
      join pg_class table_row on table_row.oid = attribute.attrelid
      join pg_namespace namespace_row on namespace_row.oid = table_row.relnamespace
      cross join lateral aclexplode(attribute.attacl) acl
      join pg_roles grantee on grantee.oid = acl.grantee
      where namespace_row.nspname = 'app_private'
        and grantee.rolname = 'app_runtime'
      order by table_row.relname, attribute.attname, privilege_type
    `;
    check(
      JSON.stringify(runtimeColumnPrivileges.map((row) =>
        `${row.table_name}.${row.column_name}:${row.privilege_type}`
      )) === JSON.stringify(["stripe_event_receipts.event_id:SELECT"]),
      "runtime column grants match the exact allowlist",
    );
    const runtimeFunctionPrivileges = await sql`
      select routine.oid::regprocedure::text as signature,
             upper(acl.privilege_type) as privilege_type
      from pg_proc routine
      join pg_namespace namespace_row on namespace_row.oid = routine.pronamespace
      cross join lateral aclexplode(routine.proacl) acl
      join pg_roles grantee on grantee.oid = acl.grantee
      where namespace_row.nspname = 'app_private'
        and grantee.rolname = 'app_runtime'
      order by signature, privilege_type
    `;
    check(
      JSON.stringify(runtimeFunctionPrivileges.map((row) =>
        `${row.signature}:${row.privilege_type}`
      )) === JSON.stringify([
        "app_private.bind_checkout_intent(text,text,text):EXECUTE",
      ]),
      "runtime function grants match the exact allowlist",
    );
    const runtimeSequencePrivileges = await sql`
      select sequence_row.relname as sequence_name,
             upper(acl.privilege_type) as privilege_type
      from pg_class sequence_row
      join pg_namespace namespace_row on namespace_row.oid = sequence_row.relnamespace
      cross join lateral aclexplode(sequence_row.relacl) acl
      join pg_roles grantee on grantee.oid = acl.grantee
      where namespace_row.nspname = 'app_private'
        and sequence_row.relkind = 'S'
        and grantee.rolname = 'app_runtime'
      order by sequence_name, privilege_type
    `;
    check(
      JSON.stringify(runtimeSequencePrivileges.map((row) =>
        `${row.sequence_name}:${row.privilege_type}`
      )) === JSON.stringify(
        expectedSchema.sequences.map((name) => `${name}:USAGE`),
      ),
      "runtime sequence grants match the exact allowlist",
    );
    const publicTablePrivileges = await sql`
      select count(*)::int as count
      from information_schema.role_table_grants
      where grantee = 'PUBLIC' and table_schema = 'app_private'
    `;
    check(publicTablePrivileges[0].count === 0, "PUBLIC has no private table grants");

    const unexpectedPrivateAcl = await sql`
      with explicit_acl as (
        select 'relation'::text as object_type,
               class_row.relname::text as object_name,
               coalesce(grantee.rolname, 'PUBLIC')::text as grantee,
               acl.privilege_type::text as privilege_type
        from pg_class class_row
        join pg_namespace namespace_row on namespace_row.oid = class_row.relnamespace
        cross join lateral aclexplode(class_row.relacl) acl
        left join pg_roles grantee on grantee.oid = acl.grantee
        where namespace_row.nspname = 'app_private'
        union all
        select 'column', class_row.relname || '.' || attribute.attname,
               coalesce(grantee.rolname, 'PUBLIC'), acl.privilege_type
        from pg_attribute attribute
        join pg_class class_row on class_row.oid = attribute.attrelid
        join pg_namespace namespace_row on namespace_row.oid = class_row.relnamespace
        cross join lateral aclexplode(attribute.attacl) acl
        left join pg_roles grantee on grantee.oid = acl.grantee
        where namespace_row.nspname = 'app_private'
        union all
        select 'function', routine.proname,
               coalesce(grantee.rolname, 'PUBLIC'), acl.privilege_type
        from pg_proc routine
        join pg_namespace namespace_row on namespace_row.oid = routine.pronamespace
        cross join lateral aclexplode(routine.proacl) acl
        left join pg_roles grantee on grantee.oid = acl.grantee
        where namespace_row.nspname = 'app_private'
        union all
        select 'schema', namespace_row.nspname,
               coalesce(grantee.rolname, 'PUBLIC'), acl.privilege_type
        from pg_namespace namespace_row
        cross join lateral aclexplode(namespace_row.nspacl) acl
        left join pg_roles grantee on grantee.oid = acl.grantee
        where namespace_row.nspname = 'app_private'
      )
      select object_type, object_name, grantee, privilege_type
      from explicit_acl
      where grantee not in ('app_owner', 'app_runtime')
      order by object_type, object_name, grantee, privilege_type
    `;
    check(
      unexpectedPrivateAcl.length === 0,
      "private object ACL grantees match the exact allowlist",
    );
    const privateFunctionOwners = await sql`
      select routine.proname, pg_get_userbyid(routine.proowner) as owner
      from pg_proc routine
      join pg_namespace namespace_row on namespace_row.oid = routine.pronamespace
      where namespace_row.nspname = 'app_private'
        and pg_get_userbyid(routine.proowner) <> 'app_owner'
    `;
    check(
      privateFunctionOwners.length === 0,
      "private functions are owned by app_owner",
    );

    const unexpectedDefaultAcl = await sql`
      select pg_get_userbyid(defaults.defaclrole) as owner,
             defaults.defaclobjtype as object_type,
             coalesce(grantee.rolname, 'PUBLIC') as grantee,
             acl.privilege_type
      from pg_default_acl defaults
      left join pg_namespace namespace_row
        on namespace_row.oid = defaults.defaclnamespace
      cross join lateral aclexplode(defaults.defaclacl) acl
      left join pg_roles grantee on grantee.oid = acl.grantee
      where (
        (
          defaults.defaclnamespace = 0
          and pg_get_userbyid(defaults.defaclrole) in ('app_owner', 'app_migrator')
        ) or namespace_row.nspname = 'app_private'
      )
      and (
        pg_get_userbyid(defaults.defaclrole) not in ('app_owner', 'app_migrator')
        or defaults.defaclobjtype not in ('r', 'S', 'f')
        or coalesce(grantee.rolname, 'PUBLIC')
          <> pg_get_userbyid(defaults.defaclrole)
      )
      order by owner, object_type, grantee, privilege_type
    `;
    check(
      unexpectedDefaultAcl.length === 0,
      "default private-object ACLs are owner-only",
    );

    const publicFunctionPrivileges = await sql`
      select count(*)::int as count
      from information_schema.routine_privileges
      where routine_schema = 'app_private' and grantee = 'PUBLIC'
    `;
    check(
      publicFunctionPrivileges[0].count === 0,
      "PUBLIC cannot execute private functions",
    );
    const effectiveDefaultFunctionPrivileges = await sql`
      with expected_owners as (
        select oid, rolname
        from pg_roles
        where rolname in ('app_owner', 'app_migrator')
      ), private_schema as (
        select oid
        from pg_namespace
        where nspname = 'app_private'
      ), global_acl as (
        select owner_role.oid as owner_oid,
               owner_role.rolname as owner_role,
               coalesce(defaults.defaclacl, acldefault('f', owner_role.oid)) as privileges
        from expected_owners owner_role
        left join pg_default_acl defaults
          on defaults.defaclrole = owner_role.oid
          and defaults.defaclnamespace = 0
          and defaults.defaclobjtype = 'f'
      ), effective_privileges as (
        select global_acl.owner_role, privilege.grantee, privilege.privilege_type
        from global_acl
        cross join lateral aclexplode(global_acl.privileges) privilege
        union
        select owner_role.rolname, privilege.grantee, privilege.privilege_type
        from expected_owners owner_role
        cross join private_schema
        join pg_default_acl defaults
          on defaults.defaclrole = owner_role.oid
          and defaults.defaclnamespace = private_schema.oid
          and defaults.defaclobjtype = 'f'
        cross join lateral aclexplode(defaults.defaclacl) privilege
      )
      select effective_privileges.owner_role,
             case
               when effective_privileges.grantee = 0 then 'PUBLIC'
               else grantee_role.rolname
             end as grantee_role,
             effective_privileges.privilege_type
      from effective_privileges
      left join pg_roles grantee_role on grantee_role.oid = effective_privileges.grantee
      order by effective_privileges.owner_role, grantee_role, effective_privileges.privilege_type
    `;
    const actualDefaultFunctionPrivileges = effectiveDefaultFunctionPrivileges
      .map((row) =>
        `${row.owner_role}:${row.grantee_role}:${row.privilege_type}`
      )
      .sort();
    const expectedDefaultFunctionPrivileges = [
      "app_migrator:app_migrator:EXECUTE",
      "app_owner:app_owner:EXECUTE",
    ];
    check(
      JSON.stringify(actualDefaultFunctionPrivileges) ===
        JSON.stringify(expectedDefaultFunctionPrivileges),
      `default private-function privileges are owner-only${
        actualDefaultFunctionPrivileges.length
          ? `: ${actualDefaultFunctionPrivileges.join(", ")}`
          : ": no effective privileges found"
      }`,
    );

    const schemaPrivileges = await sql`
      select
        has_schema_privilege('app_runtime', 'app_private', 'USAGE') as can_use,
        has_schema_privilege('app_runtime', 'app_private', 'CREATE') as can_create,
        has_schema_privilege('app_runtime', 'public', 'CREATE') as can_create_public
    `;
    check(schemaPrivileges[0].can_use === true, "runtime can use app_private");
    check(schemaPrivileges[0].can_create === false, "runtime cannot create private objects");
    check(schemaPrivileges[0].can_create_public === false, "runtime cannot create public objects");

    await sql.begin(async (tx) => {
      const id = `verify-${Date.now()}`;
      await tx`
        insert into app_private."user"
          (id, name, email, email_verified, role, banned, created_at, updated_at)
        values (${id}, 'Verify', ${`${id}@invalid.test`}, true, 'user', false, now(), now())
      `;
      await tx`update app_private."user" set name = 'Verified' where id = ${id}`;
      await tx`delete from app_private."user" where id = ${id}`;

      const eventId = `evt_${id}`;
      const checkoutSessionId = `cs_${id}`;
      await tx`
        insert into app_private.stripe_event_receipts
          (event_id, event_type, stripe_created_at, payload)
        values (${eventId}, 'verification.probe', now(), '{}'::jsonb)
      `;
      const duplicateReceipt = await tx`
        insert into app_private.stripe_event_receipts
          (event_id, event_type, stripe_created_at, payload)
        values (${eventId}, 'verification.duplicate', now(), '{}'::jsonb)
        on conflict (event_id) do nothing
        returning event_id
      `;
      check(duplicateReceipt.length === 0, "duplicate event receipt is rejected");

      const [work] = await tx`
        insert into app_private.fulfillment_work
          (checkout_session_id, source_event_id)
        values (${checkoutSessionId}, ${eventId})
        returning id
      `;
      const duplicateWork = await tx`
        insert into app_private.fulfillment_work
          (checkout_session_id, source_event_id)
        values (${checkoutSessionId}, ${eventId})
        on conflict (checkout_session_id) do nothing
        returning id
      `;
      check(duplicateWork.length === 0, "duplicate checkout work is rejected");

      const firstClaim = await tx`
        with candidate as (
          select id from app_private.fulfillment_work
          where checkout_session_id = ${checkoutSessionId}
            and state in ('pending', 'processing')
            and next_attempt_at <= now()
            and (lease_expires_at is null or lease_expires_at < now())
          for update skip locked
          limit 1
        )
        update app_private.fulfillment_work as claimed
        set state = 'processing', lease_owner = 'verification',
            lease_expires_at = now() + interval '60 seconds', updated_at = now()
        from candidate where claimed.id = candidate.id
        returning claimed.id
      `;
      const secondClaim = await tx`
        with candidate as (
          select id from app_private.fulfillment_work
          where checkout_session_id = ${checkoutSessionId}
            and state in ('pending', 'processing')
            and next_attempt_at <= now()
            and (lease_expires_at is null or lease_expires_at < now())
          for update skip locked
          limit 1
        )
        update app_private.fulfillment_work as claimed
        set state = 'processing', lease_owner = 'verification-duplicate',
            lease_expires_at = now() + interval '60 seconds', updated_at = now()
        from candidate where claimed.id = candidate.id
        returning claimed.id
      `;
      check(
        firstClaim.length === 1 && secondClaim.length === 0,
        "an active lease excludes duplicate fulfillment claims",
      );

      await tx`
        update app_private.fulfillment_work
        set state = 'succeeded', lease_owner = null, lease_expires_at = null
        where id = ${work.id}
      `;
      await tx`
        insert into app_private.fulfillment_effects
          (work_id, kind, idempotency_key)
        values
          (${work.id}, 'order_email', ${`email:${id}`}),
          (${work.id}, 'cart_cleanup', ${`cart:${id}`})
      `;
      const duplicateEffect = await tx`
        insert into app_private.fulfillment_effects
          (work_id, kind, idempotency_key)
        values (${work.id}, 'order_email', ${`email:${id}`})
        on conflict (idempotency_key) do nothing
        returning id
      `;
      check(duplicateEffect.length === 0, "duplicate effect is rejected");
      await tx`
        update app_private.fulfillment_effects
        set state = 'needs_attention', last_error_code = 'verification_failure'
        where idempotency_key = ${`email:${id}`}
      `;
      const effectStates = await tx`
        select work.state as work_state, effect.kind, effect.state as effect_state
        from app_private.fulfillment_work work
        join app_private.fulfillment_effects effect on effect.work_id = work.id
        where work.id = ${work.id}
        order by effect.kind
      `;
      check(
        effectStates.every((row) => row.work_state === "succeeded") &&
          effectStates.some(
            (row) => row.kind === "order_email" && row.effect_state === "needs_attention",
          ) &&
          effectStates.some(
            (row) => row.kind === "cart_cleanup" && row.effect_state === "pending",
          ),
        "effect failure cannot roll back or suppress the completed order",
      );

      await tx`
        insert into app_private.fulfillment_replay_audit
          (target_kind, target_id, prior_state, operator_user_id, reason)
        values ('work', ${checkoutSessionId}, 'needs_attention', ${id}, 'verification replay')
      `;

      throw new RollbackProbe();
    }).catch((error) => {
      if (!(error instanceof RollbackProbe)) throw error;
    });

    const missingEventId = `evt_missing_${Date.now()}`;
    await expectDenied(
      () => sql`delete from app_private.products_items where id = -1`,
      "runtime product delete is denied",
    );
    await expectDenied(
      () => sql`delete from app_private.products_variants where id = -1`,
      "runtime variant delete is denied",
    );
    await expectDenied(
      () => sql`update app_private.stripe_event_receipts set event_type = 'tampered' where event_id = ${missingEventId}`,
      "event receipt update is denied",
    );
    await expectDenied(
      () => sql`delete from app_private.stripe_event_receipts where event_id = ${missingEventId}`,
      "event receipt delete is denied",
    );
    await sql`
      select event_id from app_private.stripe_event_receipts
      where event_id = ${missingEventId}
    `;
    check(true, "runtime can read only the receipt idempotency key");
    await expectDenied(
      () => sql`
        select payload from app_private.stripe_event_receipts
        where event_id = ${missingEventId}
      `,
      "runtime event receipt payload read is denied",
    );
    await expectDenied(
      () => sql`update app_private.fulfillment_replay_audit set reason = 'tampered' where id = -1`,
      "replay audit update is denied",
    );
    await expectDenied(
      () => sql`delete from app_private.fulfillment_replay_audit where id = -1`,
      "replay audit delete is denied",
    );
    await expectDenied(
      () => sql`update app_private.catalog_sync_replay_audit set reason = 'tampered' where id = -1`,
      "catalog replay audit update is denied",
    );
    await expectDenied(
      () => sql`delete from app_private.catalog_sync_replay_audit where id = -1`,
      "catalog replay audit delete is denied",
    );
    const checkoutBindingFailures = checkoutBindingContractFailures(
      await inspectCheckoutBinding(sql),
    );
    check(
      checkoutBindingFailures.length === 0,
      "checkout binding function matches the write-once contract",
    );
    await sql`
      select id
      from app_private.bind_checkout_intent(
        '__missing_user__',
        '__missing_checkout_intent__',
        'cs_missing'
      )
    `;
    check(true, "runtime guarded checkout binding is allowed");
    await expectDenied(
      () => sql`
        update app_private.checkout_intents
        set checkout_session_id = checkout_session_id
        where id = '__missing_checkout_intent__'
      `,
      "runtime direct checkout session update is denied",
    );
    await expectDenied(
      () => sql`
        update app_private.checkout_intents
        set items = items
        where id = '__missing_checkout_intent__'
      `,
      "runtime checkout snapshot update is denied",
    );
    try {
      await sql.begin(async (tx) => {
        await tx.unsafe("create table app_private.__runtime_ddl_probe(id integer)");
        throw new RollbackProbe();
      });
      failures.push("runtime DDL is denied");
    } catch (error) {
      if (error instanceof RollbackProbe) failures.push("runtime DDL is denied");
      else if (postgresErrorCode(error) === "42501") {
        console.log("PASS runtime DDL is denied");
      } else throw error;
    }
  } finally {
    await sql.end();
  }

  if (failures.length) {
    console.error(failures.map((failure) => `FAIL ${failure}`).join("\n"));
    process.exitCode = 1;
  } else {
    console.log("Database role and schema evidence: PASS");
  }
}

class RollbackProbe extends Error {}

async function expectDenied(operation: () => Promise<unknown>, label: string) {
  try {
    await operation();
    failures.push(label);
  } catch (error) {
    if (postgresErrorCode(error) !== "42501") throw error;
    console.log(`PASS ${label}`);
  }
}

function postgresErrorCode(error: unknown): string | null {
  return typeof error === "object" && error !== null && "code" in error
    ? String(error.code)
    : null;
}

function check(condition: boolean, label: string) {
  if (condition) console.log(`PASS ${label}`);
  else failures.push(label);
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
