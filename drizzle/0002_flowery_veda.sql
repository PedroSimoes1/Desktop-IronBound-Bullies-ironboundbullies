-- HAND-EDITED. Drizzle generated `ADD COLUMN "kennel_id" text NOT NULL` for
-- three tables that already hold records, and Postgres rejects that: it cannot
-- invent a value for the twelve dogs already there.
--
-- So the column arrives nullable, the existing records are given the kennel
-- they have always belonged to, and only then is the constraint applied. In
-- that order this is safe to run against a database with real records in it.
--
-- The kennel row is inserted below, after CREATE TABLE "kennels" has run.

CREATE TYPE "public"."currency" AS ENUM('USD');--> statement-breakpoint
CREATE TYPE "public"."kennel_role" AS ENUM('admin', 'owner');--> statement-breakpoint
CREATE TABLE "kennels" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"kennel_id" text NOT NULL,
	"role" "kennel_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"token_hash" text NOT NULL,
	"user_id" text NOT NULL,
	"password_version" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_agent" text
);
--> statement-breakpoint
CREATE TABLE "sign_in_attempts" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"ip" text NOT NULL,
	"succeeded" boolean NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"password_hash" text NOT NULL,
	"password_salt" text NOT NULL,
	"password_version" integer DEFAULT 1 NOT NULL,
	"disabled" boolean DEFAULT false NOT NULL,
	"last_sign_in_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "dogs_slug_idx";--> statement-breakpoint
INSERT INTO "kennels" ("id", "slug", "name")
VALUES ('ironbound', 'ironbound-bullies', 'Ironbound Bullies')
ON CONFLICT ("id") DO NOTHING;--> statement-breakpoint
ALTER TABLE "breedings" ADD COLUMN "kennel_id" text;--> statement-breakpoint
UPDATE "breedings" SET "kennel_id" = 'ironbound' WHERE "kennel_id" IS NULL;--> statement-breakpoint
ALTER TABLE "breedings" ALTER COLUMN "kennel_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "dog_drafts" ADD COLUMN "updated_by" text;--> statement-breakpoint
ALTER TABLE "dogs" ADD COLUMN "kennel_id" text;--> statement-breakpoint
UPDATE "dogs" SET "kennel_id" = 'ironbound' WHERE "kennel_id" IS NULL;--> statement-breakpoint
ALTER TABLE "dogs" ALTER COLUMN "kennel_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "dogs" ADD COLUMN "currency" "currency" DEFAULT 'USD' NOT NULL;--> statement-breakpoint
ALTER TABLE "photos" ADD COLUMN "kennel_id" text;--> statement-breakpoint
UPDATE "photos" SET "kennel_id" = 'ironbound' WHERE "kennel_id" IS NULL;--> statement-breakpoint
ALTER TABLE "photos" ALTER COLUMN "kennel_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "photos" ADD COLUMN "storage_key" text;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_kennel_id_kennels_id_fk" FOREIGN KEY ("kennel_id") REFERENCES "public"."kennels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "kennels_slug_idx" ON "kennels" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "memberships_user_kennel_idx" ON "memberships" USING btree ("user_id","kennel_id");--> statement-breakpoint
CREATE INDEX "memberships_user_idx" ON "memberships" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_token_idx" ON "sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sign_in_attempts_email_idx" ON "sign_in_attempts" USING btree ("email","at");--> statement-breakpoint
CREATE INDEX "sign_in_attempts_ip_idx" ON "sign_in_attempts" USING btree ("ip","at");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
ALTER TABLE "breedings" ADD CONSTRAINT "breedings_kennel_id_kennels_id_fk" FOREIGN KEY ("kennel_id") REFERENCES "public"."kennels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dog_drafts" ADD CONSTRAINT "dog_drafts_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dogs" ADD CONSTRAINT "dogs_kennel_id_kennels_id_fk" FOREIGN KEY ("kennel_id") REFERENCES "public"."kennels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "photos" ADD CONSTRAINT "photos_kennel_id_kennels_id_fk" FOREIGN KEY ("kennel_id") REFERENCES "public"."kennels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "photos_kennel_idx" ON "photos" USING btree ("kennel_id");--> statement-breakpoint
CREATE UNIQUE INDEX "dogs_slug_idx" ON "dogs" USING btree ("kennel_id","slug");