import type { Metadata } from "next";
import { DogCollection } from "@/components/dogs/DogCollection";
import { dogsByRole } from "@/content/dogs";

export const metadata: Metadata = {
  title: "Studs",
  description: "Exotic Bully studs at Ironbound Bullies, Northern New Jersey.",
  alternates: { canonical: "/dogs/studs" },
};

export default function StudsPage() {
  return <DogCollection title="Studs" lede="Males standing at stud." filter="studs" dogs={dogsByRole("stud")} />;
}
