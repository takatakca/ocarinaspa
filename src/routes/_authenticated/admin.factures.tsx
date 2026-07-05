import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  createAdminInvoice,
  listAdminInvoices,
  sendAdminInvoice,
  checkIsAdmin,
  type AdminInvoiceCreated,
  type AdminInvoiceRow,
} from "@/lib/admin-invoices.functions";
import {
  markInteracReceived,
  ensureSurveyLink,
} from "@/lib/admin-experience.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Copy,
  ExternalLink,
  FileText,
  Send,
  LogOut,
  CheckCircle2,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { gtag, trackInteracReceived } from "@/lib/gtag";

export const Route = createFileRoute("/_authenticated/admin/factures")({
  component: AdminInvoicesPage,
  head: () => ({
    meta: [
      { title: "Admin — Factures Ocarina Spa" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
});

type FilterStatus =
  | "all"
  | "open"
  | "paid"
  | "failed"
  | "void"
  | "pending_interac"
  | "interac_received";

function money(cents: number, currency = "cad") {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

function surveyLink(token: string) {
  if (typeof window === "undefined") return `/sondage?token=${token}`;
  return `${window.location.origin}/sondage?token=${token}`;
}

function AdminInvoicesPage() {
  const navigate = useNavigate();
  const createFn = useServerFn(createAdminInvoice);
  const listFn = useServerFn(listAdminInvoices);
  const sendFn = useServerFn(sendAdminInvoice);
  const checkFn = useServerFn(checkIsAdmin);
  const interacFn = useServerFn(markInteracReceived);
  const surveyFn = useServerFn(ensureSurveyLink);

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [rows, setRows] = useState<AdminInvoiceRow[]>([]);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [last, setLast] = useState<AdminInvoiceCreated | null>(null);
  const [loading, setLoading] = useState(false);
  const [interacTarget, setInteracTarget] = useState<AdminInvoiceRow | null>(null);
  const [interacNote, setInteracNote] = useState("");

  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerAddress: "",
    customerCity: "",
    description: "",
    amountBeforeTax: "",
    applyTaxes: true,
    notes: "",
    daysUntilDue: "15",
  });

  useEffect(() => {
    checkFn()
      .then((r) => {
        setIsAdmin(r.isAdmin);
        if (r.isAdmin) refresh();
      })
      .catch(() => setIsAdmin(false));
  }, []);

  async function refresh() {
    try {
      const data = await listFn();
      setRows(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await createFn({
        data: {
          customerName: form.customerName,
          customerEmail: form.customerEmail,
          customerPhone: form.customerPhone || undefined,
          customerAddress: form.customerAddress || undefined,
          customerCity: form.customerCity || undefined,
          description: form.description,
          amountBeforeTax: Number(form.amountBeforeTax),
          applyTaxes: form.applyTaxes,
          notes: form.notes || undefined,
          daysUntilDue: Number(form.daysUntilDue) || 15,
        },
      });
      setLast(result);
      toast.success(`Facture créée : ${result.invoiceNumber ?? result.invoiceId}`);
      if (typeof window !== "undefined") {
        gtag("event", "admin_invoice_created", {
          event_category: "Admin",
          value: result.amountDueCents / 100,
          currency: result.currency,
        });
      }
      setForm({ ...form, description: "", amountBeforeTax: "", notes: "" });
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur de création");
    } finally {
      setLoading(false);
    }
  }

  async function copy(text: string) {
    await navigator.clipboard.writeText(text);
    toast.success("Copié");
  }

  async function handleSend(invoiceId: string) {
    try {
      await sendFn({ data: { invoiceId } });
      toast.success("Facture envoyée au client");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur d'envoi");
    }
  }

  async function confirmInterac() {
    if (!interacTarget) return;
    try {
      await interacFn({
        data: {
          invoiceId: interacTarget.stripe_invoice_id,
          note: interacNote || undefined,
        },
      });
      trackInteracReceived();
      toast.success("Paiement Interac marqué comme reçu");
      const target = interacTarget;
      setInteracTarget(null);
      setInteracNote("");
      await refresh();
      // Offer to generate survey link right away
      try {
        const r = await surveyFn({ data: { invoiceId: target.stripe_invoice_id } });
        const link = surveyLink(r.token);
        await navigator.clipboard.writeText(link);
        toast.success("Lien sondage copié dans le presse-papier");
      } catch {
        // silent
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  }

  async function handleGenerateSurvey(row: AdminInvoiceRow) {
    try {
      const r = await surveyFn({ data: { invoiceId: row.stripe_invoice_id } });
      const link = surveyLink(r.token);
      await navigator.clipboard.writeText(link);
      toast.success("Lien sondage copié");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  if (isAdmin === null) {
    return <div className="p-8 text-center text-muted-foreground">Chargement…</div>;
  }
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Accès refusé</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Votre compte n'a pas le rôle admin. Contactez l'administrateur pour obtenir l'accès.
            </p>
            <Button onClick={handleSignOut} variant="outline">
              <LogOut className="w-4 h-4" /> Déconnexion
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filtered = rows.filter((r) => {
    if (filter === "all") return true;
    if (filter === "failed")
      return r.status === "uncollectible" || r.status === "failed";
    return r.status === filter;
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Admin — Factures</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Créez une facture puis donnez son numéro au client.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="secondary" size="sm">
            <Link to="/admin/experience">
              <Sparkles className="w-4 h-4" /> Voir expérience client
            </Link>
          </Button>
          <Button onClick={handleSignOut} variant="outline" size="sm">
            <LogOut className="w-4 h-4" /> Déconnexion
          </Button>
        </div>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Créer une facture</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-2">
            <Field label="Nom complet *">
              <Input
                required
                value={form.customerName}
                onChange={(e) => setForm({ ...form, customerName: e.target.value })}
              />
            </Field>
            <Field label="Courriel *">
              <Input
                type="email"
                required
                value={form.customerEmail}
                onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
              />
            </Field>
            <Field label="Téléphone">
              <Input
                value={form.customerPhone}
                onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
              />
            </Field>
            <Field label="Ville">
              <Input
                value={form.customerCity}
                onChange={(e) => setForm({ ...form, customerCity: e.target.value })}
              />
            </Field>
            <Field label="Adresse" className="md:col-span-2">
              <Input
                value={form.customerAddress}
                onChange={(e) => setForm({ ...form, customerAddress: e.target.value })}
              />
            </Field>
            <Field label="Description du service *" className="md:col-span-2">
              <Input
                required
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="ex: Réparation pompe spa modèle X"
              />
            </Field>
            <Field label="Montant avant taxes (CAD) *">
              <Input
                type="number"
                min="0"
                step="0.01"
                required
                value={form.amountBeforeTax}
                onChange={(e) => setForm({ ...form, amountBeforeTax: e.target.value })}
              />
            </Field>
            <Field label="Échéance (jours)">
              <Input
                type="number"
                min="0"
                max="365"
                value={form.daysUntilDue}
                onChange={(e) => setForm({ ...form, daysUntilDue: e.target.value })}
              />
            </Field>
            <label className="flex items-center gap-2 text-sm md:col-span-2">
              <input
                type="checkbox"
                checked={form.applyTaxes}
                onChange={(e) => setForm({ ...form, applyTaxes: e.target.checked })}
              />
              Appliquer TPS 5% + TVQ 9.975%
            </label>
            <Field label="Notes internes / bas de facture" className="md:col-span-2">
              <Input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </Field>
            <div className="md:col-span-2">
              <Button type="submit" disabled={loading} className="w-full md:w-auto">
                {loading ? "Création…" : "Créer la facture Stripe"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {last && (
        <Card className="mb-8 border-brand/40">
          <CardHeader>
            <CardTitle>Facture créée : {last.invoiceNumber ?? last.invoiceId}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <Info label="Numéro" value={last.invoiceNumber ?? "—"} />
              <Info label="Statut" value={last.status} />
              <Info label="Montant" value={money(last.amountDueCents, last.currency)} />
              <Info label="Devise" value={last.currency.toUpperCase()} />
            </div>
            <div className="flex flex-wrap gap-2">
              {last.hostedInvoiceUrl && (
                <>
                  <Button size="sm" variant="outline" onClick={() => copy(last.hostedInvoiceUrl!)}>
                    <Copy className="w-4 h-4" /> Copier le lien
                  </Button>
                  <Button size="sm" asChild>
                    <a href={last.hostedInvoiceUrl} target="_blank" rel="noreferrer">
                      <ExternalLink className="w-4 h-4" /> Ouvrir la facture
                    </a>
                  </Button>
                </>
              )}
              {last.invoicePdf && (
                <Button size="sm" variant="outline" asChild>
                  <a href={last.invoicePdf} target="_blank" rel="noreferrer">
                    <FileText className="w-4 h-4" /> Voir PDF
                  </a>
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => handleSend(last.invoiceId)}>
                <Send className="w-4 h-4" /> Envoyer au client
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4 flex-wrap">
          <CardTitle>Toutes les factures ({rows.length})</CardTitle>
          <div className="flex flex-wrap gap-1">
            {(
              [
                "all",
                "open",
                "paid",
                "pending_interac",
                "interac_received",
                "failed",
                "void",
              ] as const
            ).map((s) => (
              <Button
                key={s}
                size="sm"
                variant={filter === s ? "default" : "outline"}
                onClick={() => setFilter(s)}
              >
                {statusFilterLabel(s)}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Numéro</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Méthode</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    Aucune facture
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs whitespace-nowrap">
                    {new Date(r.created_at).toLocaleDateString("fr-CA")}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{r.invoice_number ?? "—"}</TableCell>
                  <TableCell>{r.customer_name ?? "—"}</TableCell>
                  <TableCell className="text-xs">
                    <div>{r.customer_email ?? ""}</div>
                    <div className="text-muted-foreground">{r.customer_phone ?? ""}</div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {money(r.amount_cents, r.currency)}
                  </TableCell>
                  <TableCell>
                    <MethodBadge method={r.payment_method} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={r.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {r.status === "pending_interac" && (
                        <Button
                          size="sm"
                          variant="default"
                          title="Marquer Interac reçu"
                          onClick={() => setInteracTarget(r)}
                        >
                          <CheckCircle2 className="w-4 h-4" /> Interac reçu
                        </Button>
                      )}
                      {(r.status === "paid" || r.status === "interac_received") && (
                        <Button
                          size="sm"
                          variant="outline"
                          title="Générer / copier lien sondage"
                          onClick={() => handleGenerateSurvey(r)}
                        >
                          <MessageSquare className="w-4 h-4" /> Sondage
                        </Button>
                      )}
                      {r.hosted_invoice_url && (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            title="Copier lien paiement Stripe"
                            onClick={() => copy(r.hosted_invoice_url!)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" title="Ouvrir facture Stripe" asChild>
                            <a href={r.hosted_invoice_url} target="_blank" rel="noreferrer">
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </Button>
                        </>
                      )}
                      {r.invoice_pdf && (
                        <Button size="icon" variant="ghost" title="Voir PDF" asChild>
                          <a href={r.invoice_pdf} target="_blank" rel="noreferrer">
                            <FileText className="w-4 h-4" />
                          </a>
                        </Button>
                      )}
                      {r.status === "open" && r.hosted_invoice_url && (
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Envoyer par courriel"
                          onClick={() => handleSend(r.stripe_invoice_id)}
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!interacTarget} onOpenChange={(o) => !o && setInteracTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Marquer Interac reçu — {interacTarget?.invoice_number ?? ""}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">
              Confirme que le virement Interac a été reçu de {interacTarget?.customer_name ?? "ce client"}
              {" "}
              ({interacTarget && money(interacTarget.amount_cents, interacTarget.currency)}).
              Un lien sondage sera généré automatiquement.
            </p>
            <label className="block">
              <span className="text-sm font-medium">Note interne (optionnel)</span>
              <Textarea
                className="mt-1"
                rows={3}
                value={interacNote}
                onChange={(e) => setInteracNote(e.target.value)}
                placeholder="Ex : reçu le 5 juillet, référence #123"
              />
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInteracTarget(null)}>
              Annuler
            </Button>
            <Button onClick={confirmInterac}>
              <CheckCircle2 className="w-4 h-4" /> Confirmer réception
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function statusFilterLabel(s: FilterStatus) {
  switch (s) {
    case "all":
      return "Toutes";
    case "open":
      return "En attente";
    case "paid":
      return "Payées";
    case "pending_interac":
      return "Interac en attente";
    case "interac_received":
      return "Interac reçu";
    case "failed":
      return "Échec";
    case "void":
      return "Annulées";
  }
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="text-sm font-medium block mb-1">{label}</label>
      {children}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    paid: "bg-green-100 text-green-800",
    interac_received: "bg-green-100 text-green-800",
    open: "bg-yellow-100 text-yellow-800",
    pending_interac: "bg-orange-100 text-orange-800",
    draft: "bg-gray-100 text-gray-800",
    void: "bg-gray-200 text-gray-600",
    uncollectible: "bg-red-100 text-red-800",
    failed: "bg-red-100 text-red-800",
  };
  const label: Record<string, string> = {
    paid: "Payée",
    interac_received: "Interac reçu",
    open: "En attente",
    pending_interac: "Interac en attente",
    draft: "Brouillon",
    void: "Annulée",
    uncollectible: "Échec",
    failed: "Échec",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
        map[status] ?? "bg-gray-100 text-gray-800"
      }`}
    >
      {label[status] ?? status}
    </span>
  );
}

function MethodBadge({ method }: { method: string | null }) {
  if (!method) return <span className="text-xs text-muted-foreground">—</span>;
  const map: Record<string, string> = {
    stripe: "bg-blue-100 text-blue-800",
    card: "bg-blue-100 text-blue-800",
    interac: "bg-purple-100 text-purple-800",
  };
  const label: Record<string, string> = {
    stripe: "Stripe",
    card: "Stripe",
    interac: "Interac",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
        map[method] ?? "bg-gray-100 text-gray-800"
      }`}
    >
      {label[method] ?? method}
    </span>
  );
}
