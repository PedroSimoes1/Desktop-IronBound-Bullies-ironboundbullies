import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { StatusLabel } from "@/components/ui/StatusLabel";
import { getDogBySlug, getDogSlugs, getDogs } from "@/db/queries/public";
import { formatMoney, formatSex, type Dog } from "@/lib/domain/dog";
import { dogDescriptor } from "@/lib/domain/format";
import { site } from "@/lib/site";
import styles from "./page.module.css";

/**
 * Dog profile (brief section 11).
 *
 * The photograph is shown at its own aspect ratio and never cropped: ten of the
 * twelve frames are finished posters with the dog's name composited in, and a
 * crop would cut through the lettering.
 *
 * Everything the kennel has said about the dog lives in one column beside the
 * photograph: name, descriptor, status, the owner's sentence, the terms, the
 * action, then the facts. A row is rendered only when its value is known, so
 * there are never empty labels, and a dog we hold no photograph of still gets
 * a composed page rather than a grey box.
 */

export async function generateStaticParams() {
  return (await getDogSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/dogs/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const dog = await getDogBySlug(slug);
  if (!dog) return { title: "Dog not found" };
  const descriptor = dogDescriptor(dog);
  return {
    title: dog.name,
    description: [dog.name, descriptor, `at ${site.name}, ${site.region}.`].filter(Boolean).join(", "),
    alternates: { canonical: `/dogs/${dog.slug}` },
    openGraph: dog.mainPhoto
      ? { images: [{ url: dog.mainPhoto.src, width: dog.mainPhoto.width, height: dog.mainPhoto.height, alt: dog.mainPhoto.alt }] }
      : undefined,
  };
}

type Fact = { label: string; value: string };

function factsFor(dog: Dog, others: Dog[]): Fact[] {
  const facts: Fact[] = [];
  if (dog.sex) facts.push({ label: "Sex", value: formatSex(dog.sex) });
  if (dog.color) facts.push({ label: "Color", value: dog.color });
  if (dog.dogClass) facts.push({ label: "Class", value: dog.dogClass });
  if (dog.heightInches) facts.push({ label: "Height", value: `${dog.heightInches} in` });
  if (dog.weightLbs) facts.push({ label: "Weight", value: `${dog.weightLbs} lb` });
  if (dog.dateOfBirth) facts.push({ label: "Born", value: dog.dateOfBirth });

  const byId = (id: string) => others.find((d) => d.id === id || d.slug === id)?.name;
  const sire = dog.sireId ? byId(dog.sireId) : dog.sireName;
  const dam = dog.damId ? byId(dog.damId) : dog.damName;
  if (sire) facts.push({ label: "Sire", value: sire });
  if (dam) facts.push({ label: "Dam", value: dam });
  if (dog.bloodline) facts.push({ label: "Bloodline", value: dog.bloodline });
  if (dog.registration) facts.push({ label: "Registration", value: dog.registration });
  return facts;
}

export default async function DogPage({ params }: PageProps<"/dogs/[slug]">) {
  const { slug } = await params;
  const [dog, others] = await Promise.all([getDogBySlug(slug), getDogs()]);
  if (!dog) notFound();

  const descriptor = dogDescriptor(dog);
  const facts = factsFor(dog, others);
  const isStud = dog.role === "stud";
  const hasPrice = dog.price !== undefined || dog.contactForPrice;
  const gallery = (dog.gallery ?? []).filter((photo) => photo.id !== dog.mainPhoto?.id);
  const inquiryHref = isStud ? `/contact?type=stud&dog=${dog.slug}` : `/contact?dog=${dog.slug}`;

  return (
    <article className={styles.profile} data-bleed-top="">
      <div className={[styles.top, dog.mainPhoto ? "" : styles.topSolo].filter(Boolean).join(" ")}>
        {dog.mainPhoto && (
          <div className={styles.media}>
            <Image
              src={dog.mainPhoto.src}
              alt={dog.mainPhoto.alt}
              width={dog.mainPhoto.width}
              height={dog.mainPhoto.height}
              sizes="(min-width: 1024px) 58vw, 100vw"
              priority
              placeholder={dog.mainPhoto.blurDataUrl ? "blur" : "empty"}
              blurDataURL={dog.mainPhoto.blurDataUrl}
              className={styles.mainPhoto}
            />
          </div>
        )}

        <div className={styles.intro}>
          <div className={styles.introInner}>
          <div className={styles.identity}>
            <h1 className={["display-hero", styles.name].join(" ")}>{dog.name}</h1>
            {descriptor && <p className={["label", styles.descriptor].join(" ")}>{descriptor}</p>}
            {dog.status && <StatusLabel status={dog.status} />}
          </div>

          {dog.summary && <p className={["lede", styles.summary].join(" ")}>{dog.summary}</p>}
          {dog.description && <p className={["body", styles.description].join(" ")}>{dog.description}</p>}

          {isStud && dog.studFee !== undefined && (
            <div className={styles.terms}>
              <p className={["display-2", "numeric"].join(" ")}>{formatMoney(dog.studFee)}</p>
              <p className={["label", "muted"].join(" ")}>
                Stud fee{dog.lockInFee !== undefined ? ` · ${formatMoney(dog.lockInFee)} lock-in` : ""}
              </p>
            </div>
          )}

          {!isStud && hasPrice && (
            <div className={styles.terms}>
              <p className={["display-2", "numeric"].join(" ")}>
                {dog.price !== undefined ? formatMoney(dog.price) : "Contact for pricing"}
              </p>
            </div>
          )}

          <div className={styles.actions}>
            <Button href={inquiryHref}>{isStud ? "Stud service" : "Inquire"}</Button>
            <Button href="/dogs" variant="text">
              Our dogs
            </Button>
          </div>

          {facts.length > 0 && (
            <section className={styles.facts} aria-label={`${dog.name} details`}>
              <dl className={styles.factList}>
                {facts.map((fact) => (
                  <div key={fact.label} className={styles.fact}>
                    <dt className={["label", styles.factLabel].join(" ")}>{fact.label}</dt>
                    <dd className="body">{fact.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
          </div>
        </div>

        {/* The rest of the photographs continue down the same column as the
            first one. A gallery in its own full-width row would leave a single
            photograph stranded beside an empty half page. */}
        {gallery.length > 0 && (
          <section className={styles.gallery} aria-label={`More photographs of ${dog.name}`}>
            <ul role="list" className={styles.galleryList}>
              {gallery.map((photo) => (
                <li key={photo.id}>
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    width={photo.width}
                    height={photo.height}
                    sizes="(min-width: 1024px) 58vw, 100vw"
                    placeholder={photo.blurDataUrl ? "blur" : "empty"}
                    blurDataURL={photo.blurDataUrl}
                    className={styles.galleryPhoto}
                  />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </article>
  );
}
