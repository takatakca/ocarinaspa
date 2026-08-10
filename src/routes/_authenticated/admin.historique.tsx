import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { listBusinessEvents, searchOperationalMemory, type BusinessEventRow, type OperationalMemorySearchResult } from "@/lib/admin-memory.functions";
import { checkIsAdmin } from "@/lib/admin-invoices.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, RefreshCw, Workflow } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/historique")({
  component: AdminHistoryPage,
  head: () => ({ meta: [{ title: "Admin — Historique Ocarina Spa" }, { name: "robots", content: "noindex,nofollow" }] }),
});

function AdminHistoryPage() {
  const checkFn = useServerFn(checkIsAdmin);
  const listFn = useServerFn(listBusinessEvents);
  const searchFn = useServerFn(searchOperationalMemory);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [rows, setRows] = useState<BusinessEventRow[]>([]);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<OperationalMemorySearchResult | null>(null);
  const [searchBusy, setSearchBusy] = useState(false);

  async function refresh() {
    setRows(await listFn({ data: {} }));
  }
  useEffect(() => {
    checkFn().then((r) => { setIsAdmin(r.isAdmin); if (r.isAdmin) refresh(); }).catch(() => setIsAdmin(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    if (searchResults) return searchResults.events;
    return rows.filter((r) => [r.entity_type, r.entity_id, r.event_type, r.actor_type, JSON.stringify(r.payload)].join(" ").toLowerCase().includes(q));
  }, [rows, query, searchResults]);

  async function runSearch() {
    const q = query.trim();
    if (q.length < 2) { setSearchResults(null); return; }
    setSearchBusy(true);
    try { setSearchResults(await searchFn({ data: { q } })); } finally { setSearchBusy(false); }
  }

  if (isAdmin === null) return <div className="p-8 text-center text-muted-foreground">Chargement…</div>;
  if (!isAdmin) return <div className="p-8 text-center">Accès réservé à l’administration Ocarina Spa.</div>;

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Historique des opérations</h1>
          <p className="mt-1 text-sm text-muted-foreground">Mémoire chronologique des factures, paiements, suivis et automatisations.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm"><Link to="/admin/factures"><FileText className="h-4 w-4" /> Factures</Link></Button>
          <Button asChild variant="outline" size="sm"><Link to="/admin/automation"><Workflow className="h-4 w-4" /> Assistant opérations</Link></Button>
          <Button onClick={refresh} variant="outline" size="sm"><RefreshCw className="h-4 w-4" /> Actualiser</Button>
        </div>
      </div>
      <Card>
        <CardHeader className="gap-3">
          <CardTitle>Événements récents</CardTitle>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input value={query} onChange={(e) => { setQuery(e.target.value); if (!e.target.value.trim()) setSearchResults(null); }} onKeyDown={(e) => { if (e.key === "Enter") runSearch(); }} placeholder="Numéro facture, nom, email, téléphone, tâche…" />
            <Button type="button" variant="outline" onClick={runSearch} disabled={searchBusy || query.trim().length < 2}>{searchBusy ? "Recherche…" : "Rechercher partout"}</Button>
          </div>
          {searchResults && <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-md border p-3"><strong>{searchResults.invoices.length}</strong> facture(s)</div>
            <div className="rounded-md border p-3"><strong>{searchResults.requests.length}</strong> demande(s)</div>
            <div className="rounded-md border p-3"><strong>{searchResults.diagnostics.length}</strong> diagnostic(s)</div>
            <div className="rounded-md border p-3"><strong>{searchResults.tasks.length}</strong> tâche(s)</div>
            <div className="rounded-md border p-3"><strong>{searchResults.events.length}</strong> événement(s)</div>
          </div>}
          {searchResults?.invoices.map((invoice) => <div key={invoice.id} className="rounded-md border bg-muted/30 p-3 text-sm">
            <div className="font-semibold">Facture {invoice.invoice_number || invoice.stripe_invoice_id} · {invoice.status}</div>
            <div className="text-muted-foreground">{invoice.customer_name || "Client"} · {invoice.customer_email || invoice.customer_phone || "contact non disponible"} · {new Intl.NumberFormat("fr-CA", { style: "currency", currency: invoice.currency?.toUpperCase?.() || "CAD" }).format((invoice.amount_cents || 0) / 100)}</div>
          </div>)}
          {searchResults?.requests.map((request) => <div key={request.id} className="rounded-md border bg-muted/30 p-3 text-sm">
            <div className="font-semibold">Demande service · {request.service_type} · {request.status}</div>
            <div className="text-muted-foreground">{request.full_name} · {request.email} · {request.phone} · {request.city || "ville non précisée"}{request.spa_brand ? ` · ${request.spa_brand}` : ""}</div>
          </div>)}
          {searchResults?.diagnostics.map((lead) => <div key={lead.id} className="rounded-md border bg-muted/30 p-3 text-sm">
            <div className="font-semibold">Pré-diagnostic · {lead.brand}{lead.model ? ` ${lead.model}` : ""} · {lead.ai_urgency || lead.status}</div>
            <div className="text-muted-foreground">{lead.full_name} · {lead.email} · {lead.phone} · {lead.city}{lead.error_code ? ` · code ${lead.error_code}` : ""}</div>
          </div>)}
          {searchResults?.tasks.map((task) => <div key={task.id} className="rounded-md border bg-muted/30 p-3 text-sm">
            <div className="font-semibold">Tâche {task.task_type} · {task.status}</div>
            <div className="text-muted-foreground">{task.instruction || "Tâche système"}</div>
          </div>)}
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Événement</TableHead><TableHead>Entité</TableHead><TableHead>Acteur</TableHead><TableHead>Détails</TableHead></TableRow></TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap text-xs">{new Date(r.created_at).toLocaleString("fr-CA")}</TableCell>
                  <TableCell className="font-medium text-sm">{r.event_type}</TableCell>
                  <TableCell className="text-xs"><div>{r.entity_type}</div><div className="font-mono text-muted-foreground max-w-[220px] truncate">{r.entity_id}</div></TableCell>
                  <TableCell className="text-xs">{r.actor_type}</TableCell>
                  <TableCell className="max-w-md text-xs"><pre className="whitespace-pre-wrap break-words font-sans">{JSON.stringify(r.payload, null, 2)}</pre></TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">Aucun événement.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
