import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
import { toast } from "sonner";
import { Copy, ExternalLink, FileText, Send, LogOut } from "lucide-react";
import { gtag } from "@/lib/gtag";

export const Route = createFileRoute("/_authenticated/admin/factures")({
  component: AdminInvoicesPage,
  head: () => ({
    meta: [
      { title: "Admin — Factures Ocarina Spa" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
});

type FilterStatus = "all" | "open" | "paid" | "uncollectible" | "void";

function money(cents: number, currency = "cad") {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

function AdminInvoicesPage() {
  const navigate = useNavigate();
  const createFn = useServerFn(createAdminInvoice);
  const listFn = useServerFn(listAdminInvoices);
  const sendFn = useServerFn(sendAdminInvoice);
  const checkFn = useServerFn(checkIsAdmin);

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [rows, setRows] = useState<AdminInvoiceRow[]>([]);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [last, setLast] = useState<AdminInvoiceCreated | null>(null);
  const [loading, setLoading] = useState(false);

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
    toast.success("Lien copié");
  }

  async function handleSend(invoiceId: string) {
    try {
      await sendFn({ data: { invoiceId } });
      toast.success("Facture envoyée au client");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur d'envoi");
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
    return r.status === filter;
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Admin — Factures Stripe</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Créez une facture puis donnez son numéro au client.
          </p>
        </div>
        <Button onClick={handleSignOut} variant="outline" size="sm">
          <LogOut className="w-4 h-4" /> Déconnexion
        </Button>
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
            <CardTitle>
              Facture créée : {last.invoiceNumber ?? last.invoiceId}
            </CardTitle>
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
        <CardHeader className="flex-row items-center justify-between gap-4">
          <CardTitle>Toutes les factures ({rows.length})</CardTitle>
          <div className="flex flex-wrap gap-1">
            {(["all", "open", "paid", "uncollectible", "void"] as const).map((s) => (
              <Button
                key={s}
                size="sm"
                variant={filter === s ? "default" : "outline"}
                onClick={() => setFilter(s)}
              >
                {s === "all"
                  ? "Toutes"
                  : s === "open"
                    ? "En attente"
                    : s === "paid"
                      ? "Payées"
                      : s === "uncollectible"
                        ? "Échec"
                        : "Annulées"}
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
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
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
                    <StatusBadge status={r.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {r.hosted_invoice_url && (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            title="Copier lien paiement"
                            onClick={() => copy(r.hosted_invoice_url!)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" title="Ouvrir Stripe invoice" asChild>
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
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
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
    open: "bg-yellow-100 text-yellow-800",
    draft: "bg-gray-100 text-gray-800",
    void: "bg-gray-200 text-gray-600",
    uncollectible: "bg-red-100 text-red-800",
  };
  const label: Record<string, string> = {
    paid: "Payée",
    open: "En attente",
    draft: "Brouillon",
    void: "Annulée",
    uncollectible: "Échec",
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
