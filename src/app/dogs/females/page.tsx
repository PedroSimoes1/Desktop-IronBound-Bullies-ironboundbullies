import type { Metadata } from "next";
import { DogCollection } from "@/components/dogs/DogCollection";
import { getDogsByRole } from "@/db/queries/public";

export const metadata: Metadata = {
  title: "Females",
  description: "The females of the Ironbound Bullies program, Northern New Jersey.",
  alternates: { canonical: "/dogs/females" },
};

export default async function FemalesPage() {
  return <DogCollection title="Females" lede="The females of the program." filter="females" dogs={await getDogsByRole("female")} />;
}
