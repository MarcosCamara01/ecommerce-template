CREATE TABLE "app_private"."checkout_intents" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"checkout_session_id" text,
	"items" jsonb NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "checkout_intent_session_unique" UNIQUE("checkout_session_id")
);
--> statement-breakpoint
ALTER TABLE "app_private"."checkout_intents" ADD CONSTRAINT "checkout_intents_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "app_private"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_checkout_intent_user" ON "app_private"."checkout_intents" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_checkout_intent_expires" ON "app_private"."checkout_intents" USING btree ("expires_at");