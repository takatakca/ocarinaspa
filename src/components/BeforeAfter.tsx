import fuite from "@/assets/avant-apres-fuite.jpg";
import pack from "@/assets/avant-apres-pack.jpg";
import pompe from "@/assets/avant-apres-pompe.jpg";
import hiver from "@/assets/avant-apres-hiver.jpg";

const ITEMS = [
  { src: fuite, title: "Fuite réparée", desc: "Joint et raccord PVC remplacés sous le spa." },
  { src: pack, title: "Spa remis en service", desc: "Pack électronique Balboa changé, spa fonctionnel." },
  { src: pompe, title: "Pompe changée", desc: "Pompe Waterway neuve installée." },
  { src: hiver, title: "Spa enneigé sauvé", desc: "Intervention d'urgence en hiver, plomberie sauvée du gel." },
];

export function BeforeAfter() {
  return (
    <section className="bg-background">
      <div className="container mx-auto px-4 py-16 md:py-20">
        <div className="max-w-3xl">
          <p className="text-brand font-semibold uppercase text-sm tracking-wide">
            Travaux réels
          </p>
          <h2 className="mt-3 font-display text-3xl md:text-4xl font-bold text-foreground">
            Avant / après — spas réparés par notre équipe
          </h2>
          <p className="mt-4 text-muted-foreground">
            Aperçu de réparations effectuées chez des clients au Québec. Pompes, packs
            électroniques, fuites et interventions d'urgence l'hiver.
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {ITEMS.map((it) => (
            <figure
              key={it.title}
              className="bg-card border border-border rounded-xl overflow-hidden"
            >
              <img
                src={it.src}
                alt={`${it.title} — réparation de spa Ocarina Spa Québec`}
                width={1280}
                height={800}
                loading="lazy"
                className="w-full h-48 object-cover"
              />
              <figcaption className="p-4">
                <h3 className="font-semibold text-foreground">{it.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{it.desc}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
