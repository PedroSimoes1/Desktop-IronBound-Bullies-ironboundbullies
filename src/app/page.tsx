import { Hero, type HeroSlide } from "@/components/home/Hero";
import { StudsSection } from "@/components/home/StudsSection";
import { BreedingsPreview, ClosingBand, FemalesPreview, KennelStatement } from "@/components/home/HomeSections";
import {
  getAvailableDogs,
  getBreedings,
  getDogs,
  getDogsByRole,
  getFeaturedDogs,
  getHeroSlides,
  requirePhotoById,
} from "@/db/queries/public";
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
export default async function HomePage() {
  // One pass for everything the page needs, so the six sections below are not
  // six separate round trips to the database.
  const [hero, studs, females, available, breedings, allDogs, femalePhoto] = await Promise.all([
    getHeroSlides(),
    getFeaturedDogs(),
    getDogsByRole("female"),
    getAvailableDogs(),
    getBreedings(),
    getDogs(),
    requirePhotoById("minnie-02"),
  ]);

  const slides: HeroSlide[] = hero.map(({ slug, name, dog, photo }) => ({
    slug,
    name,
    descriptor: dogDescriptor(dog),
    photo,
  }));

  const terms = studs.find((dog) => dog.studFee !== undefined);

  return (
    <>
      <Hero slides={slides} />
      <KennelStatement />
      <StudsSection dogs={studs} studFee={terms?.studFee} lockInFee={terms?.lockInFee} />
      <BreedingsPreview breedings={breedings} dogs={allDogs} />
      <FemalesPreview females={females} photo={femalePhoto} />
      <ClosingBand available={available} />
    </>
  );
}
