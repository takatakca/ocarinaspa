import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { draftInvoiceAutomation, listAutomationTasks, approveInvoiceAutomation, rejectAutomationTask, type AutomationTask } from "@/lib/admin-automation.functions";
import { checkIsAdmin } from "@/lib/admin-invoices.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { CheckCircle2, Copy, ExternalLink, FileText, History, Play, XCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/automation")({
  component: AdminAutomationPage,
  head: () => ({ meta: [{ title: "Admin — Assistant opérations Ocarina Spa" }, { name: "robots", content: "noindex,nofollow" }] }),
});

const EMPTY_FORM = {
  customerName: "", customerEmail: "", customerPhone: "", customerAddress: "", customerCity: "",
  description: "", amountBeforeTax: "", notes: "", daysUntilDue: "15", applyTaxes: true, sendInvoice: false,
};

// Empty text becomes null so the server marks it as missing instead of guessing a value.
function toDraft(f: typeof EMPTY_FORM) {
  const text = (v: string) => v.trim() || null;
  const amount = Number.parseFloat(f.amountBeforeTax);
  const days = Number.parseInt(f.daysUntilDue, 10);
  return {
    customerName: text(f.customerName), customerEmail: text(f.customerEmail), customerPhone: text(f.customerPhone),
    customerAddress: text(f.customerAddress), customerCity: text(f.customerCity), description: text(f.description),
    amountBeforeTax: Number.isFinite(amount) && amount > 0 ? amount : null, applyTaxes: f.applyTaxes, notes: text(f.notes),
    daysUntilDue: Number.isFinite(days) ? Math.min(365, Math.max(0, days)) : 15, sendInvoice: f.sendInvoice, missingFields: [],
  };
}

function taskSummary(task: AutomationTask) {
  const d = task.input ?? {};
  if (task.task_type === "create_stripe_invoice") {
    return {
      title: `${String(d.customerName || "Client à préciser")} — ${d.amountBeforeTax != null ? new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD" }).format(Number(d.amountBeforeTax)) : "Montant à préciser"}`,
      detail: String(d.description || task.instruction || "Préparation de facture"),
    };
  }
  if (task.task_type === "post_payment_followup") {
    return {
      title: `Suivi après paiement — ${String(d.invoiceNumber || d.invoiceId || "facture")}`,
      detail: task.status === "needs_delivery" ? "Lien d’expérience à remettre au client." : "Suivi post-paiement préparé automatiquement.",
    };
  }
  if (task.task_type === "credit_recovery") {
    return {
      title: `Contrôle crédit — ${String(d.creditCode || "crédit client")}`,
      detail: task.error_message || "Vérification manuelle requise avant toute réutilisation du crédit.",
    };
  }
  return { title: task.task_type.replace(/_/g, " "), detail: task.instruction || "Tâche système" };
}

function AdminAutomationPage() {
  const checkFn = useServerFn(checkIsAdmin);
  const draftFn = useServerFn(draftInvoiceAutomation);
  const listFn = useServerFn(listAutomationTasks);
  const approveFn = useServerFn(approveInvoiceAutomation);
  const rejectFn = useServerFn(rejectAutomationTask);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const set = (key: keyof typeof EMPTY_FORM) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const [tasks, setTasks] = useState<AutomationTask[]>([]);
  const [busy, setBusy] = useState(false);

  async function copy(text: string) { await navigator.clipboard.writeText(text); toast.success("Copié"); }
  async function refresh() { setTasks(await listFn()); }
  useEffect(() => { checkFn().then((r) => { setIsAdmin(r.isAdmin); if (r.isAdmin) refresh(); }).catch(() => setIsAdmin(false)); }, []);

  async function draft() {
    setBusy(true);
    try { await draftFn({ data: toDraft(form) }); setForm(EMPTY_FORM); await refresh(); toast.success("Brouillon préparé. Vérifiez-le avant approbation."); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Erreur"); }
    finally { setBusy(false); }
  }
  async function approve(id: string) {
    setBusy(true);
    try { await approveFn({ data: { taskId: id } }); await refresh(); toast.success("Facture créée après approbation."); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Erreur"); }
    finally { setBusy(false); }
  }
  async function reject(id: string) { await rejectFn({ data: { taskId: id } }); await refresh(); }

  if (isAdmin === null) return <div className="p-8 text-center text-muted-foreground">Chargement…</div>;
  if (!isAdmin) return <div className="p-8 text-center">Accès réservé à l’administration Ocarina Spa.</div>;

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-3xl font-bold">Assistant opérations</h1><p className="mt-1 text-sm text-muted-foreground">Prépare les factures côté serveur. Aucune opération financière n’est exécutée sans votre approbation.</p></div>
        <div className="flex gap-2"><Button asChild variant="outline" size="sm"><Link to="/admin/factures"><FileText className="h-4 w-4" /> Factures</Link></Button><Button asChild variant="outline" size="sm"><Link to="/admin/historique"><History className="h-4 w-4" /> Historique</Link></Button></div>
      </div>
      <Card className="mb-6">
        <CardHeader><CardTitle>Préparer une facture</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div><Label htmlFor="inv-name">Nom du client</Label><Input id="inv-name" value={form.customerName} onChange={set("customerName")} /></div>
            <div><Label htmlFor="inv-email">Courriel</Label><Input id="inv-email" type="email" value={form.customerEmail} onChange={set("customerEmail")} /></div>
            <div><Label htmlFor="inv-phone">Téléphone</Label><Input id="inv-phone" value={form.customerPhone} onChange={set("customerPhone")} /></div>
            <div><Label htmlFor="inv-city">Ville</Label><Input id="inv-city" value={form.customerCity} onChange={set("customerCity")} /></div>
            <div className="sm:col-span-2"><Label htmlFor="inv-address">Adresse</Label><Input id="inv-address" value={form.customerAddress} onChange={set("customerAddress")} /></div>
            <div className="sm:col-span-2"><Label htmlFor="inv-desc">Description du service</Label><Input id="inv-desc" value={form.description} onChange={set("description")} placeholder="Ex. Réparation pompe" /></div>
            <div><Label htmlFor="inv-amount">Montant avant taxes (CAD)</Label><Input id="inv-amount" type="number" min="0" step="0.01" value={form.amountBeforeTax} onChange={set("amountBeforeTax")} /></div>
            <div><Label htmlFor="inv-due">Échéance (jours)</Label><Input id="inv-due" type="number" min="0" max="365" value={form.daysUntilDue} onChange={set("daysUntilDue")} /></div>
            <div className="sm:col-span-2"><Label htmlFor="inv-notes">Notes</Label><Textarea id="inv-notes" rows={2} value={form.notes} onChange={set("notes")} /></div>
          </div>
          <div className="flex flex-wrap gap-6 text-sm">
            <label className="flex items-center gap-2"><Checkbox checked={form.applyTaxes} onCheckedChange={(v) => setForm((f) => ({ ...f, applyTaxes: v === true }))} /> Appliquer TPS/TVQ</label>
            <label className="flex items-center gap-2"><Checkbox checked={form.sendInvoice} onCheckedChange={(v) => setForm((f) => ({ ...f, sendInvoice: v === true }))} /> Envoyer au client après approbation</label>
          </div>
          <p className="text-xs text-muted-foreground">Un champ obligatoire vide (nom, courriel, description, montant) met le brouillon en attente d’information. Vérifiez toujours le brouillon avant approbation.</p>
          <Button onClick={draft} disabled={busy}><Play className="h-4 w-4" /> Préparer le brouillon</Button>
        </CardContent>
      </Card>
      <div className="space-y-3">
        {tasks.map((task) => {
          const d = task.input ?? {};
          const summary = taskSummary(task);
          const experienceUrl = typeof task.output?.experienceUrl === "string" ? task.output.experienceUrl : null;
          return <Card key={task.id}><CardContent className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-semibold">{summary.title}</div>
                <div className="text-sm text-muted-foreground">{summary.detail}</div>
                <div className="mt-2 text-xs">Type : <strong>{task.task_type}</strong> · Statut : <strong>{task.status}</strong>{Array.isArray(d.missingFields) && d.missingFields.length ? ` · Manquant : ${d.missingFields.join(", ")}` : ""}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                {task.task_type === "create_stripe_invoice" && task.status === "awaiting_approval" && <Button size="sm" onClick={() => approve(task.id)} disabled={busy}><CheckCircle2 className="h-4 w-4" /> Approuver et créer</Button>}
                {task.task_type === "create_stripe_invoice" && ["awaiting_approval","needs_input"].includes(task.status) && <Button size="sm" variant="outline" onClick={() => reject(task.id)}><XCircle className="h-4 w-4" /> Rejeter</Button>}
                {experienceUrl && <><Button size="sm" variant="outline" onClick={() => copy(experienceUrl)}><Copy className="h-4 w-4" /> Copier le lien</Button><Button size="sm" variant="outline" asChild><a href={experienceUrl} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /> Ouvrir</a></Button></>}
              </div>
            </div>
            {task.output && <details className="mt-3"><summary className="cursor-pointer text-xs text-muted-foreground">Détails techniques</summary><pre className="mt-2 overflow-x-auto rounded bg-muted p-3 text-xs">{JSON.stringify(task.output, null, 2)}</pre></details>}
            {task.error_message && <p className="mt-3 text-sm text-destructive">{task.error_message}</p>}
          </CardContent></Card>;
        })}
        {tasks.length === 0 && <p className="text-sm text-muted-foreground">Aucune tâche automatisée.</p>}
      </div>
    </div>
  );
}
