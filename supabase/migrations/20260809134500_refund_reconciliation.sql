-- Track Stripe refunds against paid invoices so post-payment rewards cannot drift from accounting.
ALTER TABLE public.stripe_invoices
  ADD COLUMN IF NOT EXISTS refunded_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS refund_status text,
  ADD COLUMN IF NOT EXISTS refunded_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_stripe_invoices_refund_status
  ON public.stripe_invoices(refund_status)
  WHERE refund_status IS NOT NULL;
