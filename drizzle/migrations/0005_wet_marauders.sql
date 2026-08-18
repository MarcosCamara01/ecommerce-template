DROP INDEX "app_private"."idx_account_provider_account";--> statement-breakpoint
CREATE UNIQUE INDEX "idx_account_provider_account" ON "app_private"."account" USING btree ("provider_id","account_id");