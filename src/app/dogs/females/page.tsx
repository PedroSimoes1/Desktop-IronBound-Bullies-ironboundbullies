import type { Metadata } from "next";
import { DogCollection } from "@/components/dogs/DogCollection";
import { dogsByRole } from "@/content/dogs";

export const metadata: Metadata = {
  title: "Females",
  description: "The females of the Ironbound Bullies program, Northern New Jersey.",
  alternates: { canonical: "/dogs/females" },
};

export default function FemalesPage() {
  return <DogCollection title="Females" lede="The females of the program." filter="females" dogs={dogsByRole("female")} />;
}
