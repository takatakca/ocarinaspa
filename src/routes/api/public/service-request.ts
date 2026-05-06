import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const schema = z.object({
  full_name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(7).max(30),
  email: z.string().trim().email().max(255),
  city: z.string().trim().min(2).max(100),
  postal_code: z.string().trim().max(10).optional().nullable(),
  service_type: z.string().min(1).max(100),
  spa_brand: z.string().trim().max(80).optional().nullable(),
  spa_model: z.string().trim().max(80).optional().nullable(),
  problem_description: z.string().trim().max(1500).optional().nullable(),
  urgency: z.string().max(50).optional().nullable(),
  preferred_date: z.string().optional().nullable(),
  source_url: z.string().max(500).optional().nullable(),
});

export const Route = createFileRoute("/api/public/service-request")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }
        const parsed = schema.safeParse(body);
        if (!parsed.success) {
          return Response.json(
            { error: "Validation", issues: parsed.error.issues },
            { status: 400 },
          );
        }
        const data = parsed.data;
        const payload = {
          ...data,
          preferred_date: data.preferred_date || null,
        };
        const { data: inserted, error } = await supabaseAdmin
          .from("service_requests")
          .insert(payload)
          .select("id")
          .single();
        if (error) {
          console.error("service_requests insert error", error);
          return Response.json({ error: "DB error" }, { status: 500 });
        }
        const id = inserted?.id as string | undefined;

        // Best-effort email dispatch — succeeds silently if email infra not yet configured.
        try {
          await dispatchEmails({ id, ...data });
        } catch (e) {
          console.error("Email dispatch failed (non-blocking)", e);
        }

        return Response.json({ ok: true, id }, { status: 200 });
      },
    },
  },
});

async function dispatchEmails(req: {
  id?: string;
  full_name: string;
  email: string;
  phone: string;
  city: string;
  service_type: string;
  problem_description?: string | null;
  spa_brand?: string | null;
  spa_model?: string | null;
  urgency?: string | null;
  preferred_date?: string | null;
}) {
  // Try Lovable email queue if available (after email_domain--setup_email_infra).
  // We call the same RPC the email infrastructure uses; if missing, this no-ops.
  const adminEmail = "info@ocarinaspa.ca";
  const summary =
    `Nouvelle demande de service — ${req.service_type}\n\n` +
    `Nom: ${req.full_name}\n` +
    `Téléphone: ${req.phone}\n` +
    `Courriel: ${req.email}\n` +
    `Ville: ${req.city}\n` +
    (req.urgency ? `Urgence: ${req.urgency}\n` : "") +
    (req.preferred_date ? `Date souhaitée: ${req.preferred_date}\n` : "") +
    (req.spa_brand ? `Marque: ${req.spa_brand}\n` : "") +
    (req.spa_model ? `Modèle: ${req.spa_model}\n` : "") +
    (req.problem_description ? `\nProblème:\n${req.problem_description}\n` : "");

  // Attempt RPC enqueue (added by setup_email_infra). Will throw silently if not present.
  const tryEnqueue = async (
    queue: "auth_emails" | "transactional_emails",
    rendered: { to: string; subject: string; html: string; text: string },
  ) => {
    const { error } = await supabaseAdmin.rpc("enqueue_email" as never, {
      queue_name: queue,
      message: rendered as never,
    } as never);
    if (error) throw error;
  };

  const adminHtml =
    `<h2>Nouvelle demande de service</h2>` +
    `<p><strong>${escapeHtml(req.service_type)}</strong></p>` +
    `<ul>` +
    `<li>Nom: ${escapeHtml(req.full_name)}</li>` +
    `<li>Téléphone: <a href="tel:${escapeHtml(req.phone)}">${escapeHtml(req.phone)}</a></li>` +
    `<li>Courriel: <a href="mailto:${escapeHtml(req.email)}">${escapeHtml(req.email)}</a></li>` +
    `<li>Ville: ${escapeHtml(req.city)}</li>` +
    (req.urgency ? `<li>Urgence: ${escapeHtml(req.urgency)}</li>` : "") +
    (req.preferred_date ? `<li>Date: ${escapeHtml(req.preferred_date)}</li>` : "") +
    (req.spa_brand ? `<li>Marque: ${escapeHtml(req.spa_brand)}</li>` : "") +
    (req.spa_model ? `<li>Modèle: ${escapeHtml(req.spa_model)}</li>` : "") +
    `</ul>` +
    (req.problem_description
      ? `<p><strong>Description:</strong><br>${escapeHtml(req.problem_description).replace(/\n/g, "<br>")}</p>`
      : "");

  const clientHtml =
    `<h2>Merci ${escapeHtml(req.full_name)} !</h2>` +
    `<p>Nous avons bien reçu votre demande pour <strong>${escapeHtml(req.service_type)}</strong> à ${escapeHtml(req.city)}.</p>` +
    `<p>Notre équipe vous contactera très rapidement. Pour une urgence, appelez-nous au <a href="tel:+18199137727">819-913-7727</a>.</p>` +
    `<p style="color:#666;font-size:13px;margin-top:24px">— L'équipe Ocarina Spa Québec</p>`;

  // Admin notification
  await tryEnqueue("transactional_emails", {
    to: adminEmail,
    subject: `Nouvelle demande — ${req.service_type} (${req.city})`,
    html: adminHtml,
    text: summary,
  });

  // Client acknowledgment
  await tryEnqueue("transactional_emails", {
    to: req.email,
    subject: `Nous avons bien reçu votre demande — Ocarina Spa Québec`,
    html: clientHtml,
    text: `Bonjour ${req.full_name},\n\nNous avons bien reçu votre demande pour ${req.service_type} à ${req.city}.\nNotre équipe vous contactera rapidement.\n\nUrgence ? 819-913-7727\n\n— Ocarina Spa Québec`,
  });
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
