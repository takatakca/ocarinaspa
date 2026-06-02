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

export const BRAND_IMAGES: Record<string, string> = {
  "Jacuzzi": jacuzzi,
  "Hydropool": hydropool,
  "Arctic Spas": arctic,
  "Beachcomber": beachcomber,
  "Maax Spas": maax,
  "Sundance Spas": sundance,
  "Bullfrog Spas": bullfrog,
  "Hot Spring": hotspring,
  "Caldera Spas": caldera,
  "Master Spas": master,
  // Aliases used elsewhere
  "Vita Spa": beachcomber,
  "Coast Spas": maax,
  "Wellis": sundance,
  "Passion Spas": bullfrog,
};

export const FEATURED_BRANDS: { name: string; img: string; tag: string }[] = [
  { name: "Jacuzzi", img: jacuzzi, tag: "Marque iconique" },
  { name: "Hydropool", img: hydropool, tag: "Auto-nettoyant" },
  { name: "Arctic Spas", img: arctic, tag: "Conçu pour l'hiver" },
  { name: "Beachcomber", img: beachcomber, tag: "Fabriqué au Canada" },
  { name: "Maax Spas", img: maax, tag: "Marque québécoise" },
  { name: "Sundance Spas", img: sundance, tag: "Haut de gamme" },
  { name: "Bullfrog Spas", img: bullfrog, tag: "Jets modulables" },
  { name: "Hot Spring", img: hotspring, tag: "Confort premium" },
  { name: "Caldera Spas", img: caldera, tag: "Design moderne" },
  { name: "Master Spas", img: master, tag: "Spas de nage" },
];
