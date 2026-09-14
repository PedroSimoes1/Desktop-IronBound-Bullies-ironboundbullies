import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * The database, modelled directly on the domain types in src/lib/domain.
 *
 * Two rules shaped every decision here:
 *
 *   Nothing is invented. Every column exists because a domain type already
 *   had that field. No "notes" column appeared because a database usually has
 *   one; no status defaults to a value the owner never chose. A fact the
 *   business has not given us is NULL, and the site renders nothing for it.
 *
 *   Private data lives in its own tables. The owner's notes and a customer's
 *   contact details are not columns on `dogs` and `inquiries` that a public
 *   query might accidentally select. They are separate tables that only the
 *   owner-side queries ever join, so a mistake in a public page cannot leak
 *   them: the data is never in the result set to begin with.
 */

/* ---------------------------------------------------------------------------
   ENUMS — the same unions the TypeScript domain already uses, so an invalid
   value cannot reach the database even if a bug gets past the type checker.
   -------------------------------------------------------------------------- */

export const sexEnum = pgEnum("sex", ["male", "female"]);

export const dogStatusEnum = pgEnum("dog_status", [
  "available",
  "reserved",
  "sold",
  "not_for_sale",
  "stud_available",
  "retired",
  "upcoming",
]);

export const dogRoleEnum = pgEnum("dog_role", ["stud", "female", "production", "puppy"]);

export const breedingStatusEnum = pgEnum("breeding_status", [
  "planned",
  "confirmed",
  "pregnancy_confirmed",
  "litter_arrived",
  "completed",
]);

export const inquiryTypeEnum = pgEnum("inquiry_type", [
  "puppy",
  "adult_dog",
  "stud_service",
  "upcoming_litter",
  "existing_breeding",
  "general",
]);

export const contactMethodEnum = pgEnum("contact_method", ["email", "phone", "text"]);

/** Where a photograph's file lives. Existing pictures are committed files that
 *  Next optimises at build time; anything the owner uploads later goes to blob
 *  storage. The row is the same either way, so nothing downstream has to care. */
export const photoSourceEnum = pgEnum("photo_source", ["repo", "blob"]);

/** Owner-side bookkeeping on an inquiry. */
export const inquiryStateEnum = pgEnum("inquiry_state", ["new", "replied", "closed"]);

/* ---------------------------------------------------------------------------
   DOGS — what the public site shows. Every column is nullable except the two
   that identify the animal, because the business genuinely does not have most
   of these facts yet and a placeholder would be a lie.
   -------------------------------------------------------------------------- */

export const dogs = pgTable(
  "dogs",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),

    sex: sexEnum("sex"),
    role: dogRoleEnum("role"),
    status: dogStatusEnum("status"),

    breed: text("breed"),
    color: text("color"),
    dogClass: text("dog_class"),
    dateOfBirth: date("date_of_birth"),
    heightInches: numeric("height_inches", { precision: 4, scale: 1 }),
    weightLbs: numeric("weight_lbs", { precision: 5, scale: 1 }),
    bloodline: text("bloodline"),
    registration: text("registration"),

    /** A parent with a profile here. Self-reference, so a pedigree can be walked. */
    sireId: text("sire_id"),
    damId: text("dam_id"),
    /** A parent with no profile here: the owner knows the name and nothing more. */
    sireName: text("sire_name"),
    damName: text("dam_name"),

    summary: text("summary"),
    description: text("description"),
    temperament: text("temperament"),

    /** Money in whole cents. Never a float: 20.10 does not exist in binary. */
    studFeeCents: integer("stud_fee_cents"),
    lockInFeeCents: integer("lock_in_fee_cents"),
    priceCents: integer("price_cents"),
    contactForPrice: boolean("contact_for_price").notNull().default(false),

    featured: boolean("featured").notNull().default(false),

    /** The order the kennel wants them read in. Today that is the order of the
     *  array in dogs.ts; without this the migration would silently reshuffle
     *  the site the first time Postgres felt like returning rows differently. */
    sortOrder: integer("sort_order").notNull().default(0),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("dogs_slug_idx").on(table.slug),
    index("dogs_role_idx").on(table.role),
    index("dogs_status_idx").on(table.status),
    index("dogs_sort_idx").on(table.sortOrder),
  ],
);

/**
 * Unpublished edits.
 *
 * A draft is a partial dog: only the fields the owner has changed. Keeping it
 * in one JSON column rather than a shadow copy of every dogs column means the
 * two can never drift apart when a column is added, and "what is unpublished"
 * stays a single readable object. Publishing is: copy these fields onto the
 * dog, delete the row, in one transaction.
 */
export const dogDrafts = pgTable("dog_drafts", {
  dogId: text("dog_id")
    .primaryKey()
    .references(() => dogs.id, { onDelete: "cascade" }),
  fields: jsonb("fields").notNull().$type<Record<string, unknown>>(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * The owner's private notes about a dog.
 *
 * Deliberately not a column on `dogs`. A public query selects from `dogs`; it
 * would have to deliberately join this table to see a note, and no public
 * query does. "Vet on the 14th" cannot reach a customer by accident.
 */
export const dogNotes = pgTable("dog_notes", {
  dogId: text("dog_id")
    .primaryKey()
    .references(() => dogs.id, { onDelete: "cascade" }),
  body: text("body").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ---------------------------------------------------------------------------
   PHOTOGRAPHS
   -------------------------------------------------------------------------- */

export const photos = pgTable(
  "photos",
  {
    id: text("id").primaryKey(),
    dogId: text("dog_id").references(() => dogs.id, { onDelete: "cascade" }),

    source: photoSourceEnum("source").notNull(),
    /** For a repo photo this is the import key (e.g. "voodoo-01"); the build
     *  resolves it to an optimised image. For an uploaded photo it is the URL. */
    src: text("src").notNull(),

    /** Required, so the browser reserves the right space and the page never
     *  jumps while a photograph loads. */
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    alt: text("alt").notNull(),

    /** The focal-point system: the spot that must survive any crop, as
     *  fractions of the image. A separate portrait anchor exists because the
     *  composition that works on a wide hero rarely works on a phone. */
    focalX: numeric("focal_x", { precision: 4, scale: 3 }).notNull(),
    focalY: numeric("focal_y", { precision: 4, scale: 3 }).notNull(),
    focalPortraitX: numeric("focal_portrait_x", { precision: 4, scale: 3 }),
    focalPortraitY: numeric("focal_portrait_y", { precision: 4, scale: 3 }),

    blurDataUrl: text("blur_data_url"),
    /** True when the photograph already carries the dog's name or a graphic,
     *  so the page knows not to print the name on top of it. */
    hasEmbeddedText: boolean("has_embedded_text").notNull().default(false),
    caption: text("caption"),

    sortOrder: integer("sort_order").notNull().default(0),
    /** The one used on cards and at the top of the profile. */
    isMain: boolean("is_main").notNull().default(false),

    /**
     * Position in the homepage hero, or NULL for the great majority that are
     * not in it. The hero is a curated sequence, not "the newest five": the
     * frames alternate side and front stances and deliberately avoid the ones
     * used further down the page. Keeping the order here rather than in code
     * is what lets the owner re-cut the hero himself later.
     */
    heroSlot: integer("hero_slot"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("photos_dog_idx").on(table.dogId),
    index("photos_order_idx").on(table.dogId, table.sortOrder),
    index("photos_hero_idx").on(table.heroSlot),
  ],
);

/* ---------------------------------------------------------------------------
   BREEDINGS AND LITTERS
   Nothing reproductive is ever assumed: every date and status is NULL until
   the owner enters it.
   -------------------------------------------------------------------------- */

export const breedings = pgTable(
  "breedings",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),

    sireId: text("sire_id").references(() => dogs.id, { onDelete: "set null" }),
    damId: text("dam_id").references(() => dogs.id, { onDelete: "set null" }),
    sireName: text("sire_name"),
    damName: text("dam_name"),

    status: breedingStatusEnum("status"),
    /** The bloodline headline in the owner's own words. */
    headline: text("headline"),
    breedingDate: date("breeding_date"),
    dueDate: date("due_date"),
    litterDate: date("litter_date"),
    notes: text("notes"),
    featured: boolean("featured").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("breedings_slug_idx").on(table.slug)],
);

/** A puppy produced by a breeding. Links to a dog record once one exists. */
export const litterPuppies = pgTable(
  "litter_puppies",
  {
    id: text("id").primaryKey(),
    breedingId: text("breeding_id")
      .notNull()
      .references(() => breedings.id, { onDelete: "cascade" }),
    dogId: text("dog_id").references(() => dogs.id, { onDelete: "set null" }),
    /** For a puppy with no profile of its own yet. */
    name: text("name"),
    sex: sexEnum("sex"),
    color: text("color"),
    status: dogStatusEnum("status"),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [index("litter_puppies_breeding_idx").on(table.breedingId)],
);

/* ---------------------------------------------------------------------------
   INQUIRIES
   Everything here is somebody's personal information. It is never read by a
   public page, and the split below keeps that structural rather than careful:
   `inquiries` holds what was asked, `inquiry_contacts` holds who asked.
   -------------------------------------------------------------------------- */

export const inquiries = pgTable(
  "inquiries",
  {
    id: text("id").primaryKey(),
    type: inquiryTypeEnum("type").notNull(),
    /** What the visitor was looking at when they asked. */
    dogId: text("dog_id").references(() => dogs.id, { onDelete: "set null" }),
    breedingId: text("breeding_id").references(() => breedings.id, { onDelete: "set null" }),
    message: text("message").notNull(),
    state: inquiryStateEnum("state").notNull().default("new"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("inquiries_state_idx").on(table.state), index("inquiries_created_idx").on(table.createdAt)],
);

export const inquiryContacts = pgTable("inquiry_contacts", {
  inquiryId: text("inquiry_id")
    .primaryKey()
    .references(() => inquiries.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  preferredContact: contactMethodEnum("preferred_contact").notNull(),
});

/** The owner's private note about a person who wrote in. */
export const inquiryNotes = pgTable("inquiry_notes", {
  inquiryId: text("inquiry_id")
    .primaryKey()
    .references(() => inquiries.id, { onDelete: "cascade" }),
  body: text("body").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ---------------------------------------------------------------------------
   RELATIONS — how the tables join, for typed queries.
   -------------------------------------------------------------------------- */

export const dogsRelations = relations(dogs, ({ many, one }) => ({
  photos: many(photos),
  draft: one(dogDrafts, { fields: [dogs.id], references: [dogDrafts.dogId] }),
  note: one(dogNotes, { fields: [dogs.id], references: [dogNotes.dogId] }),
}));

export const photosRelations = relations(photos, ({ one }) => ({
  dog: one(dogs, { fields: [photos.dogId], references: [dogs.id] }),
}));

export const breedingsRelations = relations(breedings, ({ many, one }) => ({
  puppies: many(litterPuppies),
  sire: one(dogs, { fields: [breedings.sireId], references: [dogs.id], relationName: "sire" }),
  dam: one(dogs, { fields: [breedings.damId], references: [dogs.id], relationName: "dam" }),
}));

export const litterPuppiesRelations = relations(litterPuppies, ({ one }) => ({
  breeding: one(breedings, { fields: [litterPuppies.breedingId], references: [breedings.id] }),
}));

export const inquiriesRelations = relations(inquiries, ({ one }) => ({
  contact: one(inquiryContacts, { fields: [inquiries.id], references: [inquiryContacts.inquiryId] }),
  note: one(inquiryNotes, { fields: [inquiries.id], references: [inquiryNotes.inquiryId] }),
}));
