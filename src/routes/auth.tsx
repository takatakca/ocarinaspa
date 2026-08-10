import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  ssr: false,
  component: AuthPage,
  head: () => ({
    meta: [{ title: "Connexion — Ocarina Spa" }, { name: "robots", content: "noindex,nofollow" }],
  }),
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/admin/factures" });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Connecté");
      navigate({ to: "/admin/factures" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Connexion administration</CardTitle>
          <CardDescription>
            Accès réservé à l'équipe Ocarina Spa. Les comptes administrateurs sont créés ou invités par l'administrateur du projet.{" "}
            <Link to="/" className="text-brand hover:underline">Retour au site</Link>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Courriel</label>
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </div>
            <div>
              <label className="text-sm font-medium">Mot de passe</label>
              <Input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Connexion…" : "Se connecter"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
