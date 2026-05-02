import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().trim().min(2, "Nom requis").max(100),
  phone: z.string().trim().min(7, "Téléphone requis").max(30),
  email: z.string().trim().email("Courriel invalide").max(255),
  city: z.string().trim().min(2, "Ville requise").max(100),
  service: z.string().min(1, "Service requis"),
  message: z.string().trim().max(1000).optional(),
});

const services = [
  "Réparation de spa",
  "Installation de spa",
  "Ouverture de spa",
  "Fermeture de spa",
  "Entretien de spa",
  "Pièces & accessoires",
  "Autre",
];

export function ServiceRequestForm({ defaultCity = "", defaultService = "" }: { defaultCity?: string; defaultService?: string }) {
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = Object.fromEntries(fd.entries());
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      toast.success("Merci ! Nous vous contacterons sous peu.");
      (e.target as HTMLFormElement).reset();
    }, 600);
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-4 bg-card p-6 md:p-8 rounded-xl border border-border shadow-sm">
      <h3 className="font-display text-2xl font-bold text-foreground">Demande de service</h3>
      <p className="text-sm text-muted-foreground -mt-2">Remplissez le formulaire et nous vous rappelons rapidement.</p>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Nom complet" name="name" required />
        <Field label="Téléphone" name="phone" type="tel" required />
        <Field label="Courriel" name="email" type="email" required />
        <Field label="Ville" name="city" defaultValue={defaultCity} required />
      </div>
      <label className="grid gap-1.5">
        <span className="text-sm font-medium text-foreground">Type de service</span>
        <select
          name="service"
          defaultValue={defaultService}
          required
          className="border border-input bg-background rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
        >
          <option value="">Choisir...</option>
          {services.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>
      <label className="grid gap-1.5">
        <span className="text-sm font-medium text-foreground">Décrivez votre besoin</span>
        <textarea
          name="message"
          rows={4}
          maxLength={1000}
          className="border border-input bg-background rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </label>
      <button
        type="submit"
        disabled={submitting}
        className="bg-brand text-brand-foreground font-semibold py-3 rounded-md hover:bg-brand-dark transition-colors disabled:opacity-60"
      >
        {submitting ? "Envoi..." : "Envoyer ma demande"}
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
