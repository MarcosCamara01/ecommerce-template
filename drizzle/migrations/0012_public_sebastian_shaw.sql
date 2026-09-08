CREATE TABLE "app_private"."catalog_sync_replay_audit" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"operation_id" uuid NOT NULL,
	"prior_state" text NOT NULL,
	"prior_error_code" text,
	"prior_error_detail" text,
	"operator_user_id" text NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "catalog_sync_replay_prior_state_check" CHECK ("app_private"."catalog_sync_replay_audit"."prior_state" = 'needs_attention'),
	CONSTRAINT "catalog_sync_replay_reason_check" CHECK (char_length(btrim("app_private"."catalog_sync_replay_audit"."reason")) between 1 and 500)
);
--> statement-breakpoint
ALTER TABLE "app_private"."catalog_sync_replay_audit" ADD CONSTRAINT "catalog_sync_replay_operation_fk" FOREIGN KEY ("operation_id") REFERENCES "app_private"."catalog_sync_operations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_catalog_sync_replay_operation" ON "app_private"."catalog_sync_replay_audit" USING btree ("operation_id","created_at");--> statement-breakpoint
REVOKE ALL ON app_private.catalog_sync_replay_audit FROM PUBLIC, app_runtime;
REVOKE ALL ON SEQUENCE app_private.catalog_sync_replay_audit_id_seq FROM PUBLIC, app_runtime;
GRANT INSERT ON app_private.catalog_sync_replay_audit TO app_runtime;
GRANT USAGE ON SEQUENCE app_private.catalog_sync_replay_audit_id_seq TO app_runtime;
