CREATE TABLE "project" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "project_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
-- Insert default tandem project for backfill
INSERT INTO "project" ("id", "slug", "name") VALUES (gen_random_uuid()::text, 'tandem', 'Tandem Docs');
--> statement-breakpoint
-- Add column as nullable first
ALTER TABLE "chat" ADD COLUMN "project_id" text;
--> statement-breakpoint
-- Backfill existing chats with the default project
UPDATE "chat" SET "project_id" = (SELECT "id" FROM "project" WHERE "slug" = 'tandem');
--> statement-breakpoint
-- Now make it NOT NULL
ALTER TABLE "chat" ALTER COLUMN "project_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "chat" ADD CONSTRAINT "chat_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "chat_projectId_userId_idx" ON "chat" USING btree ("project_id","user_id");
