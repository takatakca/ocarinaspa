import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const schema = z.object({
  full_name: z.string().trim().min(2, "Nom requis").max(100),
  phone: z.string().trim().min(7, "Téléphone requis").max(30),
  email: z.string().trim().email("Courriel invalide").max(255),
  city: z.string().trim().min(2, "Ville requise").max(100),
  postal_code: z.string().trim().max(10).optional().or(z.literal("")),
  service_type: z.string().min(1, "Service requis"),
  spa_brand: z.string().trim().max(80).optional().or(z.literal("")),
  spa_model: z.string().trim().max(80).optional().or(z.literal("")),
  problem_description: z.string().trim().max(1500).optional().or(z.literal("")),
  urgency: z.string().optional().or(z.literal("")),
  preferred_date: z.string().optional().or(z.literal("")),
  consent: z.literal("on", { message: "Veuillez accepter le contact" }),
});

const SERVICES = [
  "Réparation de spa",
  "Entretien de spa",
  "Vente de spa",
  "Installation de spa",
  "Ouverture de spa",
  "Fermeture de spa",
  "Pièces et accessoires",
  "Hot tub repair",
  "Nettoyage de piscine",
  "Ouverture de piscine",
  "Fermeture de piscine",
  "Autre",
];

export function ServiceRequestForm({
  defaultCity = "",
  defaultService = "",
}: { defaultCity?: string; defaultService?: string }) {
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    const { consent: _c, ...rest } = parsed.data;
    const payload = {
      ...rest,
      source_url: typeof window !== "undefined" ? window.location.href : null,
    };
    try {
      const res = await fetch("/api/public/service-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Demande envoyée ! Nous vous contactons rapidement.");
      form.reset();
    } catch (err) {
      console.error(err);
      toast.error("Une erreur est survenue. Appelez-nous au 819-913-7727.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-4 bg-card p-6 md:p-8 rounded-xl border border-border shadow-sm">
      <div>
        <h3 className="font-display text-2xl font-bold text-foreground">Demande de service</h3>
        <p className="text-sm text-muted-foreground mt-1">Remplissez le formulaire — nous vous rappelons rapidement.</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Nom complet *" name="full_name" required />
        <Field label="Téléphone *" name="phone" type="tel" required />
        <Field label="Courriel *" name="email" type="email" required />
        <Field label="Ville *" name="city" defaultValue={defaultCity} required />
        <Field label="Code postal" name="postal_code" />
        <Select label="Type de service *" name="service_type" defaultValue={defaultService} required options={SERVICES} />
        <Field label="Marque du spa" name="spa_brand" />
        <Field label="Modèle (si connu)" name="spa_model" />
        <Select label="Urgence" name="urgency" options={["Standard", "Sous 48h", "Urgent — aujourd'hui"]} />
        <Field label="Date souhaitée" name="preferred_date" type="date" />
      </div>
      <label className="grid gap-1.5">
        <span className="text-sm font-medium text-foreground">Décrivez le problème ou le besoin</span>
        <textarea
          name="problem_description"
          rows={4}
          maxLength={1500}
          className="border border-input bg-background rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </label>
      <label className="flex items-start gap-2 text-sm text-muted-foreground">
        <input type="checkbox" name="consent" required className="mt-1 accent-[var(--brand)]" />
        <span>J'accepte d'être contacté par Ocarina Spa au sujet de ma demande.</span>
      </label>
      <button
        type="submit"
        disabled={submitting}
        className="bg-brand text-brand-foreground font-semibold py-3.5 rounded-md hover:bg-brand-dark transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2"
      >
        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
        {submitting ? "Envoi en cours..." : "Envoyer ma demande"}
      </button>
    </form>
  );
}

function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <input
        {...props}
        className="border border-input bg-background rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
      />
    </label>
  );
}

function Select({
  label, name, options, defaultValue, required,
}: { label: string; name: string; options: string[]; defaultValue?: string; required?: boolean }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue ?? ""}
        required={required}
        className="border border-input bg-background rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
      >
        <option value="">Choisir...</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}
