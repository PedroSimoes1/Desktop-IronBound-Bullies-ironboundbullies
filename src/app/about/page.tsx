import type { Metadata } from "next";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { photos } from "@/content/photos";
import { focalFor, focalToObjectPosition } from "@/lib/images/focal";
import { contact, site } from "@/lib/site";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "About",
  description: site.description,
  alternates: { canonical: "/about" },
};

/**
 * About (brief section 30).
 *
 * Everything on this page is the kennel's own. The statement is the sentence
 * the business publishes about itself, word for word. There are no claims
 * about health testing, registration, championships, or years of experience,
 * because the owner has not made any: inventing them would be the fastest way
 * to make a real business look fake.
 *
 * Still to come from the owner: the kennel's story, breeding philosophy, care
 * and health practices, registration, and the puppy process.
 */
export default function AboutPage() {
  const photo = photos.missy01;

  return (
    <article className={styles.page}>
      {/* This frame deliberately does not run under the header: the kennel
          crest sits at the top of the photograph and the header would dim it. */}
      <div className={styles.banner}>
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          sizes="100vw"
          priority
          placeholder={photo.blurDataUrl ? "blur" : "empty"}
          blurDataURL={photo.blurDataUrl}
          className={styles.bannerImage}
          style={{ objectPosition: focalToObjectPosition(focalFor(photo, "landscape")) }}
        />
      </div>

      <Container width="wide">
        <div className={styles.body}>
          <h1 className="display-1">About {site.name}</h1>
          <p className={["lede", styles.statement].join(" ")}>{site.description}</p>
          <p className={["body-lg", "muted", styles.prose].join(" ")}>
            Voodoo, Knuckles and Shadow stand at stud. The females of the program, the current pairings, and anything available are all
            listed on this site, each with the photographs and the details the kennel has confirmed.
          </p>
          <div className={styles.links}>
            <Button href="/dogs" variant="secondary">
              Our dogs
            </Button>
            <Button href="/breedings" variant="text">
              Breedings
            </Button>
          </div>
        </div>

        <section className={styles.contact} aria-labelledby="about-contact">
          <h2 id="about-contact" className={["display-3", styles.contactTitle].join(" ")}>
            Reach the kennel
          </h2>
          <ul role="list" className={styles.channels}>
            <li>
              <span className={["label", styles.channelLabel].join(" ")}>Phone</span>
              <a href={contact.phone.href} className={["body-lg", styles.channelLink].join(" ")}>
                {contact.phone.display}
              </a>
            </li>
            <li>
              <span className={["label", styles.channelLabel].join(" ")}>Email</span>
              <a href={contact.email.href} className={["body-lg", styles.channelLink].join(" ")}>
                {contact.email.display}
              </a>
            </li>
            <li>
              <span className={["label", styles.channelLabel].join(" ")}>Instagram</span>
              <a href={contact.instagram.href} className={["body-lg", styles.channelLink].join(" ")} target="_blank" rel="noopener noreferrer">
                {contact.instagram.display}
              </a>
            </li>
          </ul>
          <div className={styles.contactAction}>
            <Button href="/contact">Inquire</Button>
          </div>
        </section>
      </Container>
    </article>
  );
}
