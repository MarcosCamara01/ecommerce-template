CREATE OR REPLACE FUNCTION app_private.retire_checkout_intents(
  p_user_id text,
  p_checkout_session_ids text[]
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, app_private
AS $function$
  UPDATE app_private.checkout_intents AS intent
  SET expires_at = now()
  WHERE intent.user_id = p_user_id
    AND intent.checkout_session_id = ANY (p_checkout_session_ids)
    AND intent.expires_at > now()
$function$;
ALTER FUNCTION app_private.retire_checkout_intents(text, text[])
  OWNER TO app_owner;
REVOKE ALL ON FUNCTION app_private.retire_checkout_intents(text, text[])
  FROM PUBLIC, app_runtime;
GRANT EXECUTE ON FUNCTION app_private.retire_checkout_intents(text, text[])
  TO app_runtime;
