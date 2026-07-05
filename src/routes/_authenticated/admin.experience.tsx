import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import {
  listSurveys,
  listCredits,
  listServiceQuestions,
  listFollowups,
  setCreditStatus,
  setServiceQuestionStatus,
  resolveFollowup,
  type AdminSurveyRow,
  type AdminCreditRow,
  type AdminServiceQuestionRow,
  type AdminFollowupRow,
} from "@/lib/admin-experience.functions";
import { checkIsAdmin, listAdminInvoices, type AdminInvoiceRow } from "@/lib/admin-invoices.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { LogOut, FileText, CheckCircle2, XCircle, Star } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/experience")({
  component: AdminExperiencePage,
  head: () => ({
    meta: [
      { title: "Admin — Expérience client Ocarina Spa" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
});

function money(cents: number | null | undefined, currency = "cad") {
  if (cents == null) return "—";
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-CA");
}

function AdminExperiencePage() {
  const navigate = useNavigate();
  const checkFn = useServerFn(checkIsAdmin);
  const surveysFn = useServerFn(listSurveys);
  const creditsFn = useServerFn(listCredits);
  const questionsFn = useServerFn(listServiceQuestions);
  const followupsFn = useServerFn(listFollowups);
  const invoicesFn = useServerFn(listAdminInvoices);
  const creditStatusFn = useServerFn(setCreditStatus);
  const questionStatusFn = useServerFn(setServiceQuestionStatus);
  const resolveFn = useServerFn(resolveFollowup);

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [surveys, setSurveys] = useState<AdminSurveyRow[]>([]);
  const [credits, setCredits] = useState<AdminCreditRow[]>([]);
  const [questions, setQuestions] = useState<AdminServiceQuestionRow[]>([]);
  const [followups, setFollowups] = useState<AdminFollowupRow[]>([]);
  const [invoices, setInvoices] = useState<AdminInvoiceRow[]>([]);
  const [ratingFilter, setRatingFilter] = useState<"all" | "low" | "high">("all");
  const [creditFilter, setCreditFilter] = useState<"all" | "active" | "used">("all");
  const [questionFilter, setQuestionFilter] = useState<"all" | "open" | "closed">("all");

  const [resolveTarget, setResolveTarget] = useState<AdminFollowupRow | null>(null);
  const [resolveNote, setResolveNote] = useState("");

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
      const [s, c, q, f, i] = await Promise.all([
        surveysFn(),
        creditsFn(),
        questionsFn(),
        followupsFn(),
        invoicesFn(),
      ]);
      setSurveys(s);
      setCredits(c);
      setQuestions(q);
      setFollowups(f);
      setInvoices(i);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  const stats = useMemo(() => {
    const ratings = surveys.map((s) => s.overall_rating).filter((n): n is number => n != null);
    const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
    const activeCredits = credits.filter((c) => c.status === "active").length;
    const openQuestions = questions.filter((q) => q.status !== "answered" && q.status !== "closed").length;
    const pendingInterac = invoices.filter((i) => i.status === "pending_interac").length;
    return {
      avgRating: avg,
      surveyCount: surveys.length,
      activeCredits,
      openQuestions,
      followupsCount: followups.length,
      pendingInterac,
    };
  }, [surveys, credits, questions, followups, invoices]);

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
          <CardContent>
            <Button onClick={handleSignOut} variant="outline">
              <LogOut className="w-4 h-4" /> Déconnexion
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredSurveys = surveys.filter((s) => {
    if (ratingFilter === "low") return (s.overall_rating ?? 0) <= 3 && s.overall_rating != null;
    if (ratingFilter === "high") return (s.overall_rating ?? 0) >= 4;
    return true;
  });

  const filteredCredits = credits.filter((c) => {
    if (creditFilter === "active") return c.status === "active";
    if (creditFilter === "used") return c.status === "used";
    return true;
  });

  const filteredQuestions = questions.filter((q) => {
    if (questionFilter === "open") return q.status !== "answered" && q.status !== "closed";
    if (questionFilter === "closed") return q.status === "answered" || q.status === "closed";
    return true;
  });

  async function markCreditUsed(id: string) {
    try {
      await creditStatusFn({ data: { id, status: "used" } });
      toast.success("Crédit marqué utilisé");
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  }

  async function markQuestionAnswered(id: string) {
    try {
      await questionStatusFn({ data: { id, status: "answered" } });
      toast.success("Question marquée répondue");
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  }

  async function confirmResolve() {
    if (!resolveTarget) return;
    try {
      await resolveFn({
        data: {
          invoiceId: resolveTarget.stripe_invoice_id,
          note: resolveNote || undefined,
        },
      });
      toast.success("Suivi résolu");
      setResolveTarget(null);
      setResolveNote("");
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Admin — Expérience client</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Sondages, crédits, questions et suivis clients.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="secondary" size="sm">
            <Link to="/admin/factures">
              <FileText className="w-4 h-4" /> Factures
            </Link>
          </Button>
          <Button onClick={handleSignOut} variant="outline" size="sm">
            <LogOut className="w-4 h-4" /> Déconnexion
          </Button>
        </div>
      </div>

      {/* Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        <Stat
          label="Note moyenne"
          value={stats.avgRating ? stats.avgRating.toFixed(2) + " / 5" : "—"}
          tone="blue"
        />
        <Stat label="Sondages reçus" value={stats.surveyCount.toString()} tone="blue" />
        <Stat label="Crédits actifs" value={stats.activeCredits.toString()} tone="green" />
        <Stat label="Questions ouvertes" value={stats.openQuestions.toString()} tone="yellow" />
        <Stat label="Clients à rappeler" value={stats.followupsCount.toString()} tone="red" />
        <Stat label="Interac en attente" value={stats.pendingInterac.toString()} tone="orange" />
      </div>

      <Tabs defaultValue="surveys">
        <TabsList className="mb-4 flex-wrap h-auto">
          <TabsTrigger value="surveys">Sondages ({surveys.length})</TabsTrigger>
          <TabsTrigger value="credits">Crédits ({credits.length})</TabsTrigger>
          <TabsTrigger value="questions">Questions ({questions.length})</TabsTrigger>
          <TabsTrigger value="followups">
            À rappeler ({followups.length})
          </TabsTrigger>
        </TabsList>

        {/* SURVEYS */}
        <TabsContent value="surveys">
          <Card>
            <CardHeader className="flex-row items-center justify-between gap-3 flex-wrap">
              <CardTitle>Sondages</CardTitle>
              <div className="flex gap-1">
                {(["all", "low", "high"] as const).map((v) => (
                  <Button
                    key={v}
                    size="sm"
                    variant={ratingFilter === v ? "default" : "outline"}
                    onClick={() => setRatingFilter(v)}
                  >
                    {v === "all" ? "Toutes" : v === "low" ? "Notes 1-3" : "Notes 4-5"}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Facture</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead>Recommande</TableHead>
                    <TableHead>Amélioration</TableHead>
                    <TableHead>Question</TableHead>
                    <TableHead>Rappel</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSurveys.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        Aucun sondage
                      </TableCell>
                    </TableRow>
                  )}
                  {filteredSurveys.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="text-xs whitespace-nowrap">
                        {fmtDate(s.submitted_at ?? s.created_at)}
                      </TableCell>
                      <TableCell className="text-sm">
                        <div>{s.customer_name ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">
                          {s.customer_email ?? ""}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {s.invoice_number ?? "—"}
                      </TableCell>
                      <TableCell>
                        <RatingBadge rating={s.overall_rating} />
                      </TableCell>
                      <TableCell className="text-xs">{s.would_recommend ?? "—"}</TableCell>
                      <TableCell className="text-xs max-w-[16rem] truncate">
                        {s.improvement_comment ?? "—"}
                      </TableCell>
                      <TableCell className="text-xs max-w-[16rem] truncate">
                        {s.service_question ?? "—"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {s.wants_callback ? (
                          <span className="text-red-700 font-medium">Oui</span>
                        ) : (
                          "Non"
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CREDITS */}
        <TabsContent value="credits">
          <Card>
            <CardHeader className="flex-row items-center justify-between gap-3 flex-wrap">
              <CardTitle>Crédits clients (10%)</CardTitle>
              <div className="flex gap-1">
                {(["all", "active", "used"] as const).map((v) => (
                  <Button
                    key={v}
                    size="sm"
                    variant={creditFilter === v ? "default" : "outline"}
                    onClick={() => setCreditFilter(v)}
                  >
                    {v === "all" ? "Tous" : v === "active" ? "Actifs" : "Utilisés"}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Facture</TableHead>
                    <TableHead>Valeur</TableHead>
                    <TableHead>Expire</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCredits.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        Aucun crédit
                      </TableCell>
                    </TableRow>
                  )}
                  {filteredCredits.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-xs">{c.credit_code}</TableCell>
                      <TableCell className="text-sm">
                        <div>{c.customer_name ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">
                          {c.customer_email ?? ""}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {c.invoice_number ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {c.credit_value_percent}%{" "}
                        <span className="text-muted-foreground">
                          ({money(c.credit_value_cents, c.currency)})
                        </span>
                      </TableCell>
                      <TableCell className="text-xs">{fmtDate(c.expires_at)}</TableCell>
                      <TableCell>
                        <CreditStatusBadge status={c.status} />
                      </TableCell>
                      <TableCell>
                        {c.status === "active" && (
                          <Button size="sm" variant="outline" onClick={() => markCreditUsed(c.id)}>
                            <CheckCircle2 className="w-4 h-4" /> Marquer utilisé
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* QUESTIONS */}
        <TabsContent value="questions">
          <Card>
            <CardHeader className="flex-row items-center justify-between gap-3 flex-wrap">
              <CardTitle>Questions clients</CardTitle>
              <div className="flex gap-1">
                {(["all", "open", "closed"] as const).map((v) => (
                  <Button
                    key={v}
                    size="sm"
                    variant={questionFilter === v ? "default" : "outline"}
                    onClick={() => setQuestionFilter(v)}
                  >
                    {v === "all" ? "Toutes" : v === "open" ? "Ouvertes" : "Répondues"}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Facture</TableHead>
                    <TableHead>Question</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuestions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Aucune question
                      </TableCell>
                    </TableRow>
                  )}
                  {filteredQuestions.map((q) => (
                    <TableRow key={q.id}>
                      <TableCell className="text-xs whitespace-nowrap">
                        {fmtDate(q.created_at)}
                      </TableCell>
                      <TableCell className="text-sm">
                        <div>{q.customer_name ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">
                          {q.customer_email ?? ""}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {q.customer_phone ?? ""}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {q.invoice_number ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm max-w-md">{q.question}</TableCell>
                      <TableCell>
                        <QuestionStatusBadge status={q.status} />
                      </TableCell>
                      <TableCell>
                        {q.status !== "answered" && q.status !== "closed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => markQuestionAnswered(q.id)}
                          >
                            <CheckCircle2 className="w-4 h-4" /> Marquer répondu
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FOLLOWUPS */}
        <TabsContent value="followups">
          <Card>
            <CardHeader>
              <CardTitle>Clients à rappeler (notes 1-3)</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Facture</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead>Note interne</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {followups.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Aucun client à rappeler
                      </TableCell>
                    </TableRow>
                  )}
                  {followups.map((f) => (
                    <TableRow key={f.stripe_invoice_id}>
                      <TableCell className="text-sm">{f.customer_name ?? "—"}</TableCell>
                      <TableCell className="text-xs">
                        <div>{f.customer_email ?? ""}</div>
                        <div className="text-muted-foreground">{f.customer_phone ?? ""}</div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {f.invoice_number ?? "—"}
                      </TableCell>
                      <TableCell>
                        <RatingBadge rating={f.customer_rating} />
                      </TableCell>
                      <TableCell className="text-xs max-w-md">
                        {f.internal_note ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setResolveTarget(f)}
                        >
                          <XCircle className="w-4 h-4" /> Marquer réglé
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!resolveTarget} onOpenChange={(o) => !o && setResolveTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Marquer suivi réglé — {resolveTarget?.customer_name ?? ""}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">
              Ajoute une note interne pour documenter le suivi (optionnel).
            </p>
            <Textarea
              rows={3}
              value={resolveNote}
              onChange={(e) => setResolveNote(e.target.value)}
              placeholder="Ex : rappelé le 5 juillet, problème réglé"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveTarget(null)}>
              Annuler
            </Button>
            <Button onClick={confirmResolve}>
              <CheckCircle2 className="w-4 h-4" /> Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "blue" | "green" | "yellow" | "red" | "orange";
}) {
  const map: Record<string, string> = {
    blue: "border-blue-200 bg-blue-50",
    green: "border-green-200 bg-green-50",
    yellow: "border-yellow-200 bg-yellow-50",
    red: "border-red-200 bg-red-50",
    orange: "border-orange-200 bg-orange-50",
  };
  return (
    <div className={`border rounded-lg p-3 ${map[tone]}`}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-xl font-bold mt-1">{value}</div>
    </div>
  );
}

function RatingBadge({ rating }: { rating: number | null }) {
  if (rating == null) return <span className="text-xs text-muted-foreground">—</span>;
  const color =
    rating >= 4
      ? "bg-green-100 text-green-800"
      : rating === 3
        ? "bg-yellow-100 text-yellow-800"
        : "bg-red-100 text-red-800";
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${color}`}
    >
      <Star className="w-3 h-3" /> {rating}/5
    </span>
  );
}

function CreditStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    used: "bg-gray-200 text-gray-700",
    expired: "bg-red-100 text-red-700",
    cancelled: "bg-gray-100 text-gray-500",
  };
  const label: Record<string, string> = {
    active: "Actif",
    used: "Utilisé",
    expired: "Expiré",
    cancelled: "Annulé",
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

function QuestionStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    new: "bg-yellow-100 text-yellow-800",
    in_progress: "bg-blue-100 text-blue-800",
    answered: "bg-green-100 text-green-800",
    closed: "bg-gray-200 text-gray-600",
  };
  const label: Record<string, string> = {
    new: "Nouveau",
    in_progress: "En traitement",
    answered: "Répondu",
    closed: "Fermé",
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
