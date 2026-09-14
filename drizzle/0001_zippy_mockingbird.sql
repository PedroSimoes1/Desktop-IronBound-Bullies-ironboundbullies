ALTER TABLE "photos" ADD COLUMN "hero_slot" integer;--> statement-breakpoint
CREATE INDEX "photos_hero_idx" ON "photos" USING btree ("hero_slot");