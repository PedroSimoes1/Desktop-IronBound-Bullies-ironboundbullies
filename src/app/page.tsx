import { Hero, type HeroSlide } from "@/components/home/Hero";
import { StudsSection } from "@/components/home/StudsSection";
import { BreedingsPreview, ClosingBand, FemalesPreview, KennelStatement } from "@/components/home/HomeSections";
import { availableDogs, dogsByRole, featuredDogs, getDogBySlug, heroSlides } from "@/content/dogs";
import { photos } from "@/content/photos";
import { dogDescriptor } from "@/lib/domain/format";

/**
 * Homepage story (brief section 57), six sections and six layout families:
 *
 *   1  cinematic hero            photographic carousel
 *   2  who Ironbound Bullies is  indented statement, carries the page's h1
 *   3  the studs                 staggered photographic trio plus the terms
 *   4  breedings                 typographic pairing plates on the raised ground
 *   5  the females               one photograph beside a roster
 *   6  availability and inquiry  closing band
 *
 * No photograph appears twice on the page.
 */
export default function HomePage() {
  const slides: HeroSlide[] = heroSlides.flatMap(({ slug, photo }) => {
    const dog = getDogBySlug(slug);
    return dog ? [{ slug, name: dog.name, descriptor: dogDescriptor(dog), photo }] : [];
  });

  const studs = featuredDogs();
  const terms = studs.find((dog) => dog.studFee !== undefined);

  return (
    <>
      <Hero slides={slides} />
      <KennelStatement />
      <StudsSection dogs={studs} studFee={terms?.studFee} lockInFee={terms?.lockInFee} />
      <BreedingsPreview />
      <FemalesPreview females={dogsByRole("female")} photo={photos.minnie02} />
      <ClosingBand available={availableDogs()} />
    </>
  );
}
