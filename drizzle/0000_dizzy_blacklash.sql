CREATE TYPE "public"."breeding_status" AS ENUM('planned', 'confirmed', 'pregnancy_confirmed', 'litter_arrived', 'completed');--> statement-breakpoint
CREATE TYPE "public"."contact_method" AS ENUM('email', 'phone', 'text');--> statement-breakpoint
CREATE TYPE "public"."dog_role" AS ENUM('stud', 'female', 'production', 'puppy');--> statement-breakpoint
CREATE TYPE "public"."dog_status" AS ENUM('available', 'reserved', 'sold', 'not_for_sale', 'stud_available', 'retired', 'upcoming');--> statement-breakpoint
CREATE TYPE "public"."inquiry_state" AS ENUM('new', 'replied', 'closed');--> statement-breakpoint
CREATE TYPE "public"."inquiry_type" AS ENUM('puppy', 'adult_dog', 'stud_service', 'upcoming_litter', 'existing_breeding', 'general');--> statement-breakpoint
CREATE TYPE "public"."photo_source" AS ENUM('repo', 'blob');--> statement-breakpoint
CREATE TYPE "public"."sex" AS ENUM('male', 'female');--> statement-breakpoint
CREATE TABLE "breedings" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"sire_id" text,
	"dam_id" text,
	"sire_name" text,
	"dam_name" text,
	"status" "breeding_status",
	"headline" text,
	"breeding_date" date,
	"due_date" date,
	"litter_date" date,
	"notes" text,
	"featured" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dog_drafts" (
	"dog_id" text PRIMARY KEY NOT NULL,
	"fields" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dog_notes" (
	"dog_id" text PRIMARY KEY NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dogs" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"sex" "sex",
	"role" "dog_role",
	"status" "dog_status",
	"breed" text,
	"color" text,
	"dog_class" text,
	"date_of_birth" date,
	"height_inches" numeric(4, 1),
	"weight_lbs" numeric(5, 1),
	"bloodline" text,
	"registration" text,
	"sire_id" text,
	"dam_id" text,
	"sire_name" text,
	"dam_name" text,
	"summary" text,
	"description" text,
	"temperament" text,
	"stud_fee_cents" integer,
	"lock_in_fee_cents" integer,
	"price_cents" integer,
	"contact_for_price" boolean DEFAULT false NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inquiries" (
	"id" text PRIMARY KEY NOT NULL,
	"type" "inquiry_type" NOT NULL,
	"dog_id" text,
	"breeding_id" text,
	"message" text NOT NULL,
	"state" "inquiry_state" DEFAULT 'new' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inquiry_contacts" (
	"inquiry_id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"preferred_contact" "contact_method" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inquiry_notes" (
	"inquiry_id" text PRIMARY KEY NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "litter_puppies" (
	"id" text PRIMARY KEY NOT NULL,
	"breeding_id" text NOT NULL,
	"dog_id" text,
	"name" text,
	"sex" "sex",
	"color" text,
	"status" "dog_status",
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "photos" (
	"id" text PRIMARY KEY NOT NULL,
	"dog_id" text,
	"source" "photo_source" NOT NULL,
	"src" text NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"alt" text NOT NULL,
	"focal_x" numeric(4, 3) NOT NULL,
	"focal_y" numeric(4, 3) NOT NULL,
	"focal_portrait_x" numeric(4, 3),
	"focal_portrait_y" numeric(4, 3),
	"blur_data_url" text,
	"has_embedded_text" boolean DEFAULT false NOT NULL,
	"caption" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_main" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "breedings" ADD CONSTRAINT "breedings_sire_id_dogs_id_fk" FOREIGN KEY ("sire_id") REFERENCES "public"."dogs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "breedings" ADD CONSTRAINT "breedings_dam_id_dogs_id_fk" FOREIGN KEY ("dam_id") REFERENCES "public"."dogs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dog_drafts" ADD CONSTRAINT "dog_drafts_dog_id_dogs_id_fk" FOREIGN KEY ("dog_id") REFERENCES "public"."dogs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dog_notes" ADD CONSTRAINT "dog_notes_dog_id_dogs_id_fk" FOREIGN KEY ("dog_id") REFERENCES "public"."dogs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_dog_id_dogs_id_fk" FOREIGN KEY ("dog_id") REFERENCES "public"."dogs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_breeding_id_breedings_id_fk" FOREIGN KEY ("breeding_id") REFERENCES "public"."breedings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiry_contacts" ADD CONSTRAINT "inquiry_contacts_inquiry_id_inquiries_id_fk" FOREIGN KEY ("inquiry_id") REFERENCES "public"."inquiries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiry_notes" ADD CONSTRAINT "inquiry_notes_inquiry_id_inquiries_id_fk" FOREIGN KEY ("inquiry_id") REFERENCES "public"."inquiries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "litter_puppies" ADD CONSTRAINT "litter_puppies_breeding_id_breedings_id_fk" FOREIGN KEY ("breeding_id") REFERENCES "public"."breedings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "litter_puppies" ADD CONSTRAINT "litter_puppies_dog_id_dogs_id_fk" FOREIGN KEY ("dog_id") REFERENCES "public"."dogs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "photos" ADD CONSTRAINT "photos_dog_id_dogs_id_fk" FOREIGN KEY ("dog_id") REFERENCES "public"."dogs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "breedings_slug_idx" ON "breedings" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "dogs_slug_idx" ON "dogs" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "dogs_role_idx" ON "dogs" USING btree ("role");--> statement-breakpoint
CREATE INDEX "dogs_status_idx" ON "dogs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "dogs_sort_idx" ON "dogs" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "inquiries_state_idx" ON "inquiries" USING btree ("state");--> statement-breakpoint
CREATE INDEX "inquiries_created_idx" ON "inquiries" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "litter_puppies_breeding_idx" ON "litter_puppies" USING btree ("breeding_id");--> statement-breakpoint
CREATE INDEX "photos_dog_idx" ON "photos" USING btree ("dog_id");--> statement-breakpoint
CREATE INDEX "photos_order_idx" ON "photos" USING btree ("dog_id","sort_order");