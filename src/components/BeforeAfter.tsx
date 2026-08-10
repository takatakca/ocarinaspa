import fuite from "@/assets/avant-apres-fuite.jpg";
import pack from "@/assets/avant-apres-pack.jpg";
import pompe from "@/assets/avant-apres-pompe.jpg";
import hiver from "@/assets/avant-apres-hiver.jpg";

const ITEMS = [
  { src: fuite, title: "Fuites et raccords", desc: "Inspection des joints, raccords et sections de plomberie accessibles." },
  { src: pack, title: "Pack de contrôle", desc: "Diagnostic du système de contrôle et remplacement lorsque la compatibilité est confirmée." },
  { src: pompe, title: "Pompe et circulation", desc: "Diagnostic du débit, de la pompe et des composantes de circulation." },
  { src: hiver, title: "Panne en période de gel", desc: "Priorité aux situations où une panne peut exposer la plomberie au gel." },
];

export function BeforeAfter() {
  return (
    <section className="bg-background">
      <div className="container mx-auto px-4 py-16 md:py-20">
        <div className="max-w-3xl">
          <p className="text-brand font-semibold uppercase text-sm tracking-wide">
            Interventions courantes
          </p>
          <h2 className="mt-3 font-display text-3xl md:text-4xl font-bold text-foreground">
            Problèmes de spa que nous pouvons diagnostiquer
          </h2>
          <p className="mt-4 text-muted-foreground">
            Fuites, circulation, chauffage, commandes et pannes hivernales. Le diagnostic final
            dépend toujours du modèle, de l'installation et de l'inspection sur place.
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {ITEMS.map((it) => (
            <figure key={it.title} className="bg-card border border-border rounded-xl overflow-hidden">
              <img
                src={it.src}
                alt={`${it.title} — exemple visuel de service de spa`}
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
        <p className="mt-4 text-xs text-muted-foreground">
          Visuels illustratifs. Les photos d'interventions clients seront ajoutées uniquement avec autorisation.
        </p>
      </div>
    </section>
  );
}
