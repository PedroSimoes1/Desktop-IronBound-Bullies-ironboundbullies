import type { Metadata } from "next";
import { DogCollection } from "@/components/dogs/DogCollection";
import { getDogs } from "@/db/queries/public";

export const metadata: Metadata = {
  title: "Our dogs",
  description: "The studs and females of Ironbound Bullies, an Exotic Bully kennel in Northern New Jersey.",
};

export default async function DogsPage() {
  return <DogCollection title="Our dogs" lede="The studs and females of the program." filter="all" dogs={await getDogs()} />;
}
