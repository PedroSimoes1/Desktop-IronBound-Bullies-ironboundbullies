import type { Metadata } from "next";
import { DogCollection } from "@/components/dogs/DogCollection";
import { dogs } from "@/content/dogs";

export const metadata: Metadata = {
  title: "Our dogs",
  description: "The studs and females of Ironbound Bullies, an Exotic Bully kennel in Northern New Jersey.",
};

export default function DogsPage() {
  return <DogCollection title="Our dogs" lede="The studs and females of the program." filter="all" dogs={dogs} />;
}
