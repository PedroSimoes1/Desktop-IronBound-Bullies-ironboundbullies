import type { Metadata } from "next";
import { DogCollection } from "@/components/dogs/DogCollection";
import { getDogsByRole } from "@/db/queries/public";

export const metadata: Metadata = {
  title: "Studs",
  description: "Exotic Bully studs at Ironbound Bullies, Northern New Jersey.",
  alternates: { canonical: "/dogs/studs" },
};

export default async function StudsPage() {
  return <DogCollection title="Studs" lede="Males standing at stud." filter="studs" dogs={await getDogsByRole("stud")} />;
}
