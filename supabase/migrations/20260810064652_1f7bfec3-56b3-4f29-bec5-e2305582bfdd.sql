REVOKE INSERT ON public.service_requests FROM anon, authenticated;
DROP POLICY IF EXISTS "anyone can insert service_requests" ON public.service_requests;

REVOKE INSERT ON public.contact_messages FROM anon, authenticated;
DROP POLICY IF EXISTS "anyone can insert contact_messages" ON public.contact_messages;

REVOKE INSERT ON public.diagnostic_leads FROM anon, authenticated;
DROP POLICY IF EXISTS "anyone can insert diagnostic_leads" ON public.diagnostic_leads;

REVOKE INSERT ON public.service_questions FROM anon, authenticated;
DROP POLICY IF EXISTS "anyone can insert service questions" ON public.service_questions;

REVOKE INSERT, UPDATE ON public.customer_surveys FROM anon;
DROP POLICY IF EXISTS "no public survey insert" ON public.customer_surveys;
DROP POLICY IF EXISTS "no public survey update" ON public.customer_surveys;
DROP POLICY IF EXISTS "public survey writes blocked" ON public.customer_surveys;
CREATE POLICY "public survey writes blocked" ON public.customer_surveys
  FOR ALL TO anon USING (false) WITH CHECK (false);

ALTER TABLE public.stripe_invoices
  ADD COLUMN IF NOT EXISTS refunded_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS refund_status text,
  ADD COLUMN IF NOT EXISTS refunded_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_stripe_invoices_refund_status
  ON public.stripe_invoices(refund_status)
  WHERE refund_status IS NOT NULL;