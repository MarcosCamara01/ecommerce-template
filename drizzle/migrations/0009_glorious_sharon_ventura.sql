ALTER TYPE "app_private"."catalog_sync_state" ADD VALUE 'preparing' BEFORE 'pending';--> statement-breakpoint
ALTER TABLE "app_private"."catalog_sync_operations" ADD COLUMN "request_hash" text;