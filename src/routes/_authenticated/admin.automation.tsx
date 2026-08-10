import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { draftInvoiceAutomation, listAutomationTasks, approveInvoiceAutomation, rejectAutomationTask, type AutomationTask } from "@/lib/admin-automation.functions";
import { checkIsAdmin } from "@/lib/admin-invoices.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CheckCircle2, Copy, ExternalLink, FileText, History, Play, XCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/automation")({
  component: AdminAutomationPage,
  head: () => ({ meta: [{ title: "Admin — Assistant opérations Ocarina Spa" }, { name: "robots", content: "noindex,nofollow" }] }),
});

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
  const [instruction, setInstruction] = useState("");
  const [tasks, setTasks] = useState<AutomationTask[]>([]);
  const [busy, setBusy] = useState(false);

  async function copy(text: string) { await navigator.clipboard.writeText(text); toast.success("Copié"); }
  async function refresh() { setTasks(await listFn()); }
  useEffect(() => { checkFn().then((r) => { setIsAdmin(r.isAdmin); if (r.isAdmin) refresh(); }).catch(() => setIsAdmin(false)); }, []);

  async function draft() {
    setBusy(true);
    try { await draftFn({ data: { instruction } }); setInstruction(""); await refresh(); toast.success("Brouillon préparé. Vérifiez-le avant approbation."); }
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
        <CardHeader><CardTitle>Préparer une facture à partir d’une instruction</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Textarea rows={5} value={instruction} onChange={(e) => setInstruction(e.target.value)} placeholder="Ex. Prépare une facture pour Jean Tremblay, jean@exemple.ca, réparation pompe 325 $ avant taxes, échéance 15 jours. Ne l’envoie pas encore." />
          <p className="text-xs text-muted-foreground">Le système refuse d’inventer un nom, un courriel ou un montant manquant. Vérifiez toujours le brouillon avant approbation.</p>
          <Button onClick={draft} disabled={busy || instruction.trim().length < 10}><Play className="h-4 w-4" /> Préparer le brouillon</Button>
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
