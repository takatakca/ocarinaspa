CREATE TABLE public.stripe_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_invoice_id TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  invoice_number TEXT,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  description TEXT,
  amount_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'cad',
  status TEXT NOT NULL DEFAULT 'draft',
  hosted_invoice_url TEXT,
  invoice_pdf TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_stripe_invoices_number ON public.stripe_invoices (invoice_number);
CREATE INDEX idx_stripe_invoices_stripe_id ON public.stripe_invoices (stripe_invoice_id);

GRANT ALL ON public.stripe_invoices TO service_role;

ALTER TABLE public.stripe_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "no public access stripe_invoices"
  ON public.stripe_invoices
  FOR SELECT
  TO anon, authenticated
  USING (false);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_stripe_invoices_updated_at
  BEFORE UPDATE ON public.stripe_invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();