import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { StatusLabel } from "@/components/ui/StatusLabel";
import { dogs, getDogBySlug } from "@/content/dogs";
import { formatMoney, formatSex, type Dog } from "@/lib/domain/dog";
import { dogDescriptor } from "@/lib/domain/format";
import { site } from "@/lib/site";
import styles from "./page.module.css";

/**
 * Dog profile (brief section 11). Photograph first, then the name, the
 * descriptor, the status, the owner's own sentence, and a specification in
 * three clusters (Physical, Pedigree, Terms). A row is rendered only when its
 * value is known: no empty labels, ever.
 */

export function generateStaticParams() {
  return dogs.map((dog) => ({ slug: dog.slug }));
}

export async function generateMetadata({ params }: PageProps<"/dogs/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const dog = getDogBySlug(slug);
  if (!dog) return { title: "Dog not found" };
  const descriptor = dogDescriptor(dog);
  return {
    title: dog.name,
    description: [dog.name, descriptor, `at ${site.name}, Northern New Jersey.`].filter(Boolean).join(", "),
    alternates: { canonical: `/dogs/${dog.slug}` },
    openGraph: dog.mainPhoto
      ? { images: [{ url: dog.mainPhoto.src, width: dog.mainPhoto.width, height: dog.mainPhoto.height, alt: dog.mainPhoto.alt }] }
      : undefined,
  };
}

type SpecRow = { label: string; value: string };

function physicalRows(dog: Dog): SpecRow[] {
  const rows: SpecRow[] = [];
  if (dog.sex) rows.push({ label: "Sex", value: formatSex(dog.sex) });
  if (dog.color) rows.push({ label: "Color", value: dog.color });
  if (dog.dogClass) rows.push({ label: "Class", value: dog.dogClass });
  if (dog.heightInches) rows.push({ label: "Height", value: `${dog.heightInches} in` });
  if (dog.weightLbs) rows.push({ label: "Weight", value: `${dog.weightLbs} lb` });
  if (dog.dateOfBirth) rows.push({ label: "Born", value: dog.dateOfBirth });
  return rows;
}

function pedigreeRows(dog: Dog): SpecRow[] {
  const rows: SpecRow[] = [];
  const sire = dog.sireId ? getDogBySlug(dog.sireId)?.name : dog.sireName;
  const dam = dog.damId ? getDogBySlug(dog.damId)?.name : dog.damName;
  if (sire) rows.push({ label: "Sire", value: sire });
  if (dam) rows.push({ label: "Dam", value: dam });
  if (dog.bloodline) rows.push({ label: "Bloodline", value: dog.bloodline });
  if (dog.registration) rows.push({ label: "Registration", value: dog.registration });
  return rows;
}

function SpecCluster({ title, rows }: { title: string; rows: SpecRow[] }) {
  if (rows.length === 0) return null;
  return (
    <div className={styles.cluster}>
      <h2 className={["label", styles.clusterTitle].join(" ")}>{title}</h2>
      <dl className={styles.specList}>
        {rows.map((row) => (
          <div key={row.label} className={styles.specRow}>
            <dt className={["body-sm", "muted"].join(" ")}>{row.label}</dt>
            <dd className="body">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default async function DogPage({ params }: PageProps<"/dogs/[slug]">) {
  const { slug } = await params;
  const dog = getDogBySlug(slug);
  if (!dog) notFound();

  const descriptor = dogDescriptor(dog);
  const physical = physicalRows(dog);
  const pedigree = pedigreeRows(dog);
  const isStud = dog.role === "stud";
  const hasPrice = dog.price !== undefined || dog.contactForPrice;
  const gallery = (dog.gallery ?? []).filter((photo) => photo.id !== dog.mainPhoto?.id);

  return (
    <article className={styles.profile}>
      <div className={styles.top}>
        <div className={styles.media}>
          {dog.mainPhoto ? (
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
          ) : (
            <div className={styles.placeholder} aria-hidden="true">
              <span className="label">Photo coming</span>
            </div>
          )}
        </div>

        <div className={styles.intro}>
          <h1 className="display-hero">{dog.name}</h1>
          {descriptor && <p className={["label", styles.descriptor].join(" ")}>{descriptor}</p>}
          {dog.status && <StatusLabel status={dog.status} />}
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
              <p className={["display-2", "numeric"].join(" ")}>{dog.price !== undefined ? formatMoney(dog.price) : "Contact for pricing"}</p>
            </div>
          )}

          <div className={styles.actions}>
            <Button href={`/contact?dog=${dog.slug}`}>Inquire</Button>
            <Button href="/dogs" variant="text">
              Our dogs
            </Button>
          </div>
        </div>
      </div>

      {(physical.length > 0 || pedigree.length > 0) && (
        <Container width="standard">
          <section className={styles.specs} aria-label="Details">
            <SpecCluster title="Physical" rows={physical} />
            <SpecCluster title="Pedigree" rows={pedigree} />
          </section>
        </Container>
      )}

      {gallery.length > 0 && (
        <Container width="wide">
          <section className={styles.gallery} aria-label={`More photographs of ${dog.name}`}>
            <ul role="list" className={styles.galleryGrid}>
              {gallery.map((photo) => (
                <li key={photo.id}>
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    width={photo.width}
                    height={photo.height}
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    placeholder={photo.blurDataUrl ? "blur" : "empty"}
                    blurDataURL={photo.blurDataUrl}
                    className={styles.galleryPhoto}
                  />
                </li>
              ))}
            </ul>
          </section>
        </Container>
      )}
    </article>
  );
}
