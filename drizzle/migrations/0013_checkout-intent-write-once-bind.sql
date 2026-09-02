REVOKE UPDATE ON app_private.checkout_intents FROM app_runtime;
CREATE OR REPLACE FUNCTION app_private.bind_checkout_intent(
  p_user_id text,
  p_intent_id text,
  p_checkout_session_id text
)
RETURNS SETOF app_private.checkout_intents
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, app_private
AS $function$
  UPDATE app_private.checkout_intents AS intent
  SET checkout_session_id = p_checkout_session_id
  WHERE intent.id = p_intent_id
    AND intent.user_id = p_user_id
    AND (
      intent.checkout_session_id IS NULL
      OR intent.checkout_session_id = p_checkout_session_id
    )
  RETURNING intent.*
$function$;
ALTER FUNCTION app_private.bind_checkout_intent(text, text, text)
  OWNER TO app_owner;
REVOKE ALL ON FUNCTION app_private.bind_checkout_intent(text, text, text)
  FROM PUBLIC, app_runtime;
GRANT EXECUTE ON FUNCTION app_private.bind_checkout_intent(text, text, text)
  TO app_runtime;
