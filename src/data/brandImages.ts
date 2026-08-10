import jacuzzi from "@/assets/brand-jacuzzi.jpg";
import hydropool from "@/assets/brand-hydropool.jpg";
import arctic from "@/assets/brand-arctic-spas.jpg";
import beachcomber from "@/assets/brand-beachcomber.jpg";
import maax from "@/assets/brand-maax.jpg";
import sundance from "@/assets/brand-sundance.jpg";
import bullfrog from "@/assets/brand-bullfrog.jpg";
import hotspring from "@/assets/brand-hotspring.jpg";
import caldera from "@/assets/brand-caldera.jpg";
import master from "@/assets/brand-master-spas.jpg";

// Only map a brand to its own asset. Never use another manufacturer's photo as a fallback.
export const BRAND_IMAGES: Record<string, string> = {
  Jacuzzi: jacuzzi,
  Hydropool: hydropool,
  "Arctic Spas": arctic,
  Beachcomber: beachcomber,
  "Maax Spas": maax,
  "Sundance Spas": sundance,
  "Bullfrog Spas": bullfrog,
  "Hot Spring": hotspring,
  "Caldera Spas": caldera,
  "Master Spas": master,
};

export const FEATURED_BRANDS: { name: string; img: string; tag: string }[] = [
  { name: "Hydropool", img: hydropool, tag: "Fabriqué en Ontario" },
  { name: "Arctic Spas", img: arctic, tag: "Fabrication canadienne" },
  { name: "Beachcomber", img: beachcomber, tag: "Fabriqué en Colombie-Britannique" },
  { name: "Jacuzzi", img: jacuzzi, tag: "Marque largement distribuée" },
  { name: "Sundance Spas", img: sundance, tag: "Gamme nord-américaine" },
  { name: "Hot Spring", img: hotspring, tag: "Gamme nord-américaine" },
  { name: "Caldera Spas", img: caldera, tag: "Gamme nord-américaine" },
  { name: "Bullfrog Spas", img: bullfrog, tag: "Système de jets modulaires" },
  { name: "Master Spas", img: master, tag: "Spas et spas de nage" },
  { name: "Maax Spas", img: maax, tag: "Marque courante en service" },
];
