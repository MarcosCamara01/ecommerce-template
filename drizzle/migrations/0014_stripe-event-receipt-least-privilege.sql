REVOKE SELECT ON app_private.stripe_event_receipts FROM app_runtime;
GRANT SELECT (event_id) ON app_private.stripe_event_receipts TO app_runtime;
