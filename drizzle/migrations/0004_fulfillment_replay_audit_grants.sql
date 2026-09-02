ALTER TABLE app_private.historical_order_price_evidence OWNER TO app_owner;
ALTER TABLE app_private.fulfillment_replay_audit OWNER TO app_owner;
ALTER SEQUENCE app_private.fulfillment_replay_audit_id_seq OWNER TO app_owner;

REVOKE ALL ON app_private.historical_order_price_evidence
  FROM PUBLIC, app_runtime;
REVOKE ALL ON app_private.fulfillment_replay_audit
  FROM PUBLIC, app_runtime;
REVOKE ALL ON SEQUENCE app_private.fulfillment_replay_audit_id_seq
  FROM PUBLIC, app_runtime;

GRANT INSERT ON app_private.fulfillment_replay_audit TO app_runtime;
GRANT USAGE ON SEQUENCE app_private.fulfillment_replay_audit_id_seq
  TO app_runtime;
