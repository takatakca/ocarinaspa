-- Ocarina Spa pre-live hardening
-- Adds idempotency/replay protection, post-payment access tokens, immutable business memory,
-- and uniqueness constraints that prevent duplicate surveys/credits.

-- One survey shell per Stripe invoice.
CREATE UNIQUE INDEX IF NOT EXISTS uq_customer_surveys_stripe_invoice
  ON public.customer_surveys(stripe_invoice_id)
  WHERE stripe_invoice_id IS NOT NULL;

-- One store credit per completed survey.
CREATE UNIQUE INDEX IF NOT EXISTS uq_customer_credits_survey
  ON public.customer_credits(survey_id)
  WHERE survey_id IS NOT NULL;

-- Opaque token used to reach the post-payment experience without putting customer PII in URLs.
CREATE TABLE IF NOT EXISTS public.payment_experience_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  stripe_invoice_id text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz
);
GRANT ALL ON public.payment_experience_tokens TO service_role;
ALTER TABLE public.payment_experience_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "no public payment tokens" ON public.payment_experience_tokens;
CREATE POLICY "no public payment tokens" ON public.payment_experience_tokens
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

-- Stripe can retry and reorder webhooks. Keep a durable ledger of processed event IDs.
CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  event_id text PRIMARY KEY,
  event_type text NOT NULL,
  stripe_object_id text,
  status text NOT NULL DEFAULT 'processing',
  error_message text,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);
GRANT ALL ON public.stripe_webhook_events TO service_role;
GRANT SELECT ON public.stripe_webhook_events TO authenticated;
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admins read stripe webhook events" ON public.stripe_webhook_events;
CREATE POLICY "admins read stripe webhook events" ON public.stripe_webhook_events
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Immutable operational memory. Financial and customer actions are retractable/auditable here.
CREATE TABLE IF NOT EXISTS public.business_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  event_type text NOT NULL,
  actor_type text NOT NULL DEFAULT 'system',
  actor_id text,
  correlation_id text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_business_events_entity
  ON public.business_events(entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_business_events_type
  ON public.business_events(event_type, created_at DESC);
GRANT ALL ON public.business_events TO service_role;
GRANT SELECT ON public.business_events TO authenticated;
ALTER TABLE public.business_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admins read business events" ON public.business_events;
CREATE POLICY "admins read business events" ON public.business_events
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Backend automation/checkpoint queue. An AI can draft work, but financial writes execute only
-- after an authenticated admin approval.
CREATE TABLE IF NOT EXISTS public.automation_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_type text NOT NULL,
  idempotency_key text UNIQUE,
  status text NOT NULL DEFAULT 'draft',
  requested_by uuid,
  approved_by uuid,
  instruction text,
  input jsonb NOT NULL DEFAULT '{}'::jsonb,
  output jsonb,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_automation_tasks_status
  ON public.automation_tasks(status, created_at DESC);
ALTER TABLE public.automation_tasks
  ADD COLUMN IF NOT EXISTS idempotency_key text;
CREATE UNIQUE INDEX IF NOT EXISTS uq_automation_tasks_idempotency
  ON public.automation_tasks(idempotency_key)
  WHERE idempotency_key IS NOT NULL;
GRANT ALL ON public.automation_tasks TO service_role;
GRANT SELECT, UPDATE ON public.automation_tasks TO authenticated;
ALTER TABLE public.automation_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admins read automation tasks" ON public.automation_tasks;
CREATE POLICY "admins read automation tasks" ON public.automation_tasks
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "admins update automation tasks" ON public.automation_tasks;
CREATE POLICY "admins update automation tasks" ON public.automation_tasks
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS trg_automation_tasks_updated ON public.automation_tasks;
CREATE TRIGGER trg_automation_tasks_updated
BEFORE UPDATE ON public.automation_tasks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- The public site writes diagnostic leads through server functions, not directly through the Data API.
REVOKE INSERT ON public.diagnostic_leads FROM anon, authenticated;
DROP POLICY IF EXISTS "anyone can insert diagnostic_leads" ON public.diagnostic_leads;

-- Standalone service questions also go through a validated server function.
REVOKE INSERT ON public.service_questions FROM anon, authenticated;
DROP POLICY IF EXISTS "anyone can insert service questions" ON public.service_questions;

-- Lightweight durable rate limiter for sensitive public server functions.
CREATE TABLE IF NOT EXISTS public.rate_limit_buckets (
  bucket_key text PRIMARY KEY,
  count integer NOT NULL DEFAULT 0,
  window_started_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.rate_limit_buckets TO service_role;
ALTER TABLE public.rate_limit_buckets ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.consume_rate_limit(
  p_bucket_key text,
  p_limit integer,
  p_window_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now timestamptz := now();
  v_count integer;
  v_started timestamptz;
BEGIN
  INSERT INTO public.rate_limit_buckets(bucket_key, count, window_started_at, updated_at)
  VALUES (p_bucket_key, 1, v_now, v_now)
  ON CONFLICT (bucket_key) DO UPDATE SET
    count = CASE
      WHEN EXTRACT(EPOCH FROM (v_now - rate_limit_buckets.window_started_at)) >= p_window_seconds
        THEN 1
      ELSE rate_limit_buckets.count + 1
    END,
    window_started_at = CASE
      WHEN EXTRACT(EPOCH FROM (v_now - rate_limit_buckets.window_started_at)) >= p_window_seconds
        THEN v_now
      ELSE rate_limit_buckets.window_started_at
    END,
    updated_at = v_now
  RETURNING count, window_started_at INTO v_count, v_started;

  RETURN v_count <= p_limit;
END;
$$;
REVOKE ALL ON FUNCTION public.consume_rate_limit(text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_rate_limit(text, integer, integer) TO service_role;