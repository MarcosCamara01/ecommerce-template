-- Run once with the external Supabase/Postgres owner credential.
-- Passwords are intentionally not accepted or stored in this file.

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_owner') THEN
    CREATE ROLE app_owner NOLOGIN NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_migrator') THEN
    CREATE ROLE app_migrator LOGIN NOINHERIT NOCREATEDB NOCREATEROLE NOREPLICATION;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_runtime') THEN
    CREATE ROLE app_runtime LOGIN NOINHERIT NOCREATEDB NOCREATEROLE NOREPLICATION;
  END IF;
END
$$;

ALTER ROLE app_migrator NOINHERIT;

DO $$
DECLARE unexpected_parent text;
BEGIN
  SELECT string_agg(parent_role.rolname, ', ' ORDER BY parent_role.rolname)
  INTO unexpected_parent
  FROM pg_auth_members membership
  JOIN pg_roles member_role ON member_role.oid = membership.member
  JOIN pg_roles parent_role ON parent_role.oid = membership.roleid
  WHERE member_role.rolname = 'app_owner';

  IF unexpected_parent IS NOT NULL THEN
    RAISE EXCEPTION 'app_owner must not be a member of other roles: %',
      unexpected_parent;
  END IF;
END
$$;

DO $$
DECLARE unexpected_members text;
DECLARE server_version integer := current_setting('server_version_num')::integer;
BEGIN
  IF server_version >= 160000 THEN
    WITH RECURSIVE prospective_app_owner_members(member_oid) AS (
      SELECT membership.member
      FROM pg_auth_members membership
      JOIN pg_roles granted_role ON granted_role.oid = membership.roleid
      WHERE granted_role.rolname IN ('app_owner', 'app_migrator')
        AND (membership.inherit_option OR membership.set_option)

      UNION

      SELECT membership.member
      FROM pg_auth_members membership
      JOIN prospective_app_owner_members parent
        ON membership.roleid = parent.member_oid
      WHERE membership.inherit_option OR membership.set_option
    ), membership_violations AS (
      SELECT member_role.rolname AS violation
      FROM prospective_app_owner_members prospective
      JOIN pg_roles member_role ON member_role.oid = prospective.member_oid
      WHERE member_role.rolname <> 'app_migrator'

      UNION

      SELECT format(
        '%I is a non-canonical member of %I',
        member_role.rolname,
        granted_role.rolname
      )
      FROM pg_auth_members membership
      JOIN pg_roles granted_role ON granted_role.oid = membership.roleid
      JOIN pg_roles member_role ON member_role.oid = membership.member
      JOIN pg_roles grantor_role ON grantor_role.oid = membership.grantor
      WHERE granted_role.rolname IN ('app_owner', 'app_migrator')
        AND NOT (
          granted_role.rolname = 'app_owner'
          AND member_role.rolname = 'app_migrator'
          AND NOT membership.admin_option
        )
        AND NOT (
          member_role.rolname = current_user
          AND grantor_role.rolsuper
          AND membership.admin_option
          AND NOT membership.inherit_option
          AND NOT membership.set_option
        )
    )
    SELECT string_agg(violation, ', ' ORDER BY violation)
    INTO unexpected_members
    FROM membership_violations;
  ELSE
    WITH RECURSIVE prospective_app_owner_members(member_oid) AS (
      SELECT membership.member
      FROM pg_auth_members membership
      JOIN pg_roles granted_role ON granted_role.oid = membership.roleid
      WHERE granted_role.rolname IN ('app_owner', 'app_migrator')

      UNION

      SELECT membership.member
      FROM pg_auth_members membership
      JOIN prospective_app_owner_members parent
        ON membership.roleid = parent.member_oid
    ), membership_violations AS (
      SELECT member_role.rolname AS violation
      FROM prospective_app_owner_members prospective
      JOIN pg_roles member_role ON member_role.oid = prospective.member_oid
      WHERE member_role.rolname <> 'app_migrator'

      UNION

      SELECT 'app_migrator WITH ADMIN OPTION'
      FROM pg_auth_members membership
      JOIN pg_roles granted_role ON granted_role.oid = membership.roleid
      JOIN pg_roles member_role ON member_role.oid = membership.member
      WHERE granted_role.rolname = 'app_owner'
        AND member_role.rolname = 'app_migrator'
        AND membership.admin_option
    )
    SELECT string_agg(violation, ', ' ORDER BY violation)
    INTO unexpected_members
    FROM membership_violations;
  END IF;

  IF unexpected_members IS NOT NULL THEN
    RAISE EXCEPTION
      'Unexpected app_owner membership detected: %. Revoke every unexpected direct or transitive membership before rerunning bootstrap.',
      unexpected_members;
  END IF;
END
$$;

REVOKE app_owner FROM app_migrator;
GRANT app_owner TO app_migrator;
DO $$
BEGIN
  IF current_setting('server_version_num')::integer >= 160000 THEN
    EXECUTE format(
      'GRANT app_owner, app_migrator TO %I WITH SET TRUE, INHERIT TRUE, ADMIN FALSE',
      current_user
    );
  ELSE
    EXECUTE format(
      'GRANT app_owner, app_migrator TO %I',
      current_user
    );
  END IF;
END
$$;
CREATE SCHEMA IF NOT EXISTS app_private AUTHORIZATION app_owner;
ALTER SCHEMA app_private OWNER TO app_owner;
CREATE SCHEMA IF NOT EXISTS drizzle AUTHORIZATION app_owner;
ALTER SCHEMA drizzle OWNER TO app_owner;
DO $$
BEGIN
  EXECUTE format(
    'REVOKE CREATE ON DATABASE %I FROM PUBLIC, app_migrator, app_runtime',
    current_database()
  );
  EXECUTE format(
    'GRANT CREATE ON DATABASE %I TO app_owner',
    current_database()
  );
END
$$;

-- A previous Drizzle installation may have created its ledger while another
-- role owned the schema. Transfer the ledger relations before app_owner is
-- assumed by migrate.ts or mark-migrations-applied.ts. Index ownership follows
-- its parent table, while owned sequences are also covered explicitly.
DO $$
DECLARE object_row record;
DECLARE unexpected_owner text;
BEGIN
  FOR object_row IN
    SELECT class_row.relname, class_row.relkind
    FROM pg_class class_row
    JOIN pg_namespace namespace_row
      ON namespace_row.oid = class_row.relnamespace
    WHERE namespace_row.nspname = 'drizzle'
      AND class_row.relkind IN ('r', 'p', 'v', 'm', 'f')
    ORDER BY class_row.relname
  LOOP
    EXECUTE format(
      'ALTER %s drizzle.%I OWNER TO app_owner',
      CASE object_row.relkind
        WHEN 'v' THEN 'VIEW'
        WHEN 'm' THEN 'MATERIALIZED VIEW'
        WHEN 'f' THEN 'FOREIGN TABLE'
        ELSE 'TABLE'
      END,
      object_row.relname
    );
  END LOOP;

  FOR object_row IN
    SELECT class_row.relname
    FROM pg_class class_row
    JOIN pg_namespace namespace_row
      ON namespace_row.oid = class_row.relnamespace
    WHERE namespace_row.nspname = 'drizzle'
      AND class_row.relkind = 'S'
    ORDER BY class_row.relname
  LOOP
    EXECUTE format(
      'ALTER SEQUENCE drizzle.%I OWNER TO app_owner',
      object_row.relname
    );
  END LOOP;

  SELECT string_agg(
    format('%I (%s)', class_row.relname, class_row.relkind),
    ', ' ORDER BY class_row.relname
  )
  INTO unexpected_owner
  FROM pg_class class_row
  JOIN pg_namespace namespace_row
    ON namespace_row.oid = class_row.relnamespace
  WHERE namespace_row.nspname = 'drizzle'
    AND class_row.relkind IN ('r', 'p', 'v', 'm', 'f', 'S', 'i', 'I')
    AND pg_get_userbyid(class_row.relowner) IS DISTINCT FROM 'app_owner';

  IF unexpected_owner IS NOT NULL THEN
    RAISE EXCEPTION 'Drizzle objects are not owned by app_owner: %',
      unexpected_owner;
  END IF;
END
$$;

REVOKE ALL ON SCHEMA app_private FROM PUBLIC;
GRANT USAGE ON SCHEMA app_private TO app_runtime;
REVOKE ALL ON SCHEMA app_private FROM app_migrator;
REVOKE ALL ON SCHEMA drizzle FROM PUBLIC, app_runtime;
REVOKE ALL ON ALL TABLES IN SCHEMA drizzle FROM PUBLIC, app_runtime;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA drizzle FROM PUBLIC, app_runtime;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA drizzle FROM PUBLIC, app_runtime;

ALTER DEFAULT PRIVILEGES FOR ROLE app_owner IN SCHEMA app_private
  REVOKE ALL ON TABLES FROM app_runtime;
ALTER DEFAULT PRIVILEGES FOR ROLE app_owner IN SCHEMA app_private
  REVOKE ALL ON SEQUENCES FROM app_runtime;
ALTER DEFAULT PRIVILEGES FOR ROLE app_owner
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES FOR ROLE app_migrator
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- PostgreSQL grants PUBLIC function execution by default. Establish an explicit
-- owner-only effective ACL for functions created by either permitted creator,
-- removing any legacy grants to roles that happen to exist at bootstrap time.
DO $$
DECLARE owner_role text;
DECLARE grantee_role text;
BEGIN
  FOREACH owner_role IN ARRAY ARRAY['app_owner', 'app_migrator'] LOOP
    FOR grantee_role IN
      SELECT rolname
      FROM pg_roles
      WHERE rolname <> owner_role
      ORDER BY rolname
    LOOP
      EXECUTE format(
        'ALTER DEFAULT PRIVILEGES FOR ROLE %I REVOKE ALL ON FUNCTIONS FROM %I',
        owner_role,
        grantee_role
      );
    END LOOP;

    EXECUTE format(
      'ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA app_private GRANT EXECUTE ON FUNCTIONS TO %I',
      owner_role,
      owner_role
    );
  END LOOP;
END
$$;

ALTER DEFAULT PRIVILEGES FOR ROLE app_owner IN SCHEMA drizzle
  REVOKE ALL ON TABLES FROM PUBLIC, app_runtime;
ALTER DEFAULT PRIVILEGES FOR ROLE app_owner IN SCHEMA drizzle
  REVOKE ALL ON SEQUENCES FROM PUBLIC, app_runtime;
ALTER DEFAULT PRIVILEGES FOR ROLE app_owner IN SCHEMA drizzle
  REVOKE ALL ON FUNCTIONS FROM PUBLIC, app_runtime;
ALTER DEFAULT PRIVILEGES FOR ROLE app_owner IN SCHEMA drizzle
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

REVOKE ALL ON ALL FUNCTIONS IN SCHEMA app_private FROM PUBLIC, app_runtime;
DO $$
BEGIN
  IF to_regprocedure(
    'app_private.bind_checkout_intent(text,text,text)'
  ) IS NOT NULL THEN
    GRANT EXECUTE ON FUNCTION
      app_private.bind_checkout_intent(text, text, text)
    TO app_runtime;
  END IF;
END
$$;

REVOKE CREATE ON SCHEMA public FROM PUBLIC;

DO $$
DECLARE api_role text;
BEGIN
  FOREACH api_role IN ARRAY ARRAY['anon', 'authenticated', 'service_role'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = api_role) THEN
      EXECUTE format('REVOKE ALL ON SCHEMA app_private FROM %I', api_role);
    END IF;
  END LOOP;
END
$$;

DO $$
BEGIN
  IF current_setting('server_version_num')::integer >= 160000 THEN
    EXECUTE format(
      'REVOKE app_owner, app_migrator FROM %I GRANTED BY %I',
      current_user,
      current_user
    );
  ELSE
    EXECUTE format(
      'REVOKE app_owner, app_migrator FROM %I',
      current_user
    );
  END IF;
END
$$;

COMMIT;
