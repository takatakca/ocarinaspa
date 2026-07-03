
-- 1) Extend stripe_invoices with post-payment / Interac / rating columns
ALTER TABLE public.stripe_invoices
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS interac_received_at timestamptz,
  ADD COLUMN IF NOT EXISTS internal_note text,
  ADD COLUMN IF NOT EXISTS customer_rating smallint,
  ADD COLUMN IF NOT EXISTS customer_rating_at timestamptz,
  ADD COLUMN IF NOT EXISTS needs_followup boolean NOT NULL DEFAULT false;

-- Validation trigger for rating range (1..5) and status set
CREATE OR REPLACE FUNCTION public.validate_stripe_invoice_row()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.customer_rating IS NOT NULL AND (NEW.customer_rating < 1 OR NEW.customer_rating > 5) THEN
    RAISE EXCEPTION 'customer_rating must be between 1 and 5';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_stripe_invoice ON public.stripe_invoices;
CREATE TRIGGER trg_validate_stripe_invoice
BEFORE INSERT OR UPDATE ON public.stripe_invoices
FOR EACH ROW EXECUTE FUNCTION public.validate_stripe_invoice_row();

-- 2) customer_surveys
CREATE TABLE IF NOT EXISTS public.customer_surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text,
  stripe_invoice_id text,
  customer_name text,
  customer_email text,
  customer_phone text,
  token text NOT NULL UNIQUE,
  overall_rating smallint,
  technician_professional text,
  problem_resolved text,
  delay_acceptable text,
  price_clear text,
  would_recommend text,
  improvement_comment text,
  service_question text,
  wants_callback boolean NOT NULL DEFAULT false,
  callback_time text,
  submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.customer_surveys TO authenticated;
GRANT INSERT, SELECT, UPDATE ON public.customer_surveys TO anon;
GRANT ALL ON public.customer_surveys TO service_role;

ALTER TABLE public.customer_surveys ENABLE ROW LEVEL SECURITY;

-- Admins can read/update all
CREATE POLICY "admins read surveys" ON public.customer_surveys
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins update surveys" ON public.customer_surveys
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Public: no direct SELECT/INSERT/UPDATE.
-- Survey creation (by token) + submission go through server fns using service role.
CREATE POLICY "no public survey select" ON public.customer_surveys
  FOR SELECT TO anon USING (false);
CREATE POLICY "no public survey insert" ON public.customer_surveys
  FOR INSERT TO anon WITH CHECK (false);
CREATE POLICY "no public survey update" ON public.customer_surveys
  FOR UPDATE TO anon USING (false) WITH CHECK (false);

CREATE INDEX IF NOT EXISTS idx_customer_surveys_token ON public.customer_surveys(token);
CREATE INDEX IF NOT EXISTS idx_customer_surveys_invoice ON public.customer_surveys(invoice_number);

CREATE TRIGGER trg_customer_surveys_updated
BEFORE UPDATE ON public.customer_surveys
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) customer_credits
CREATE TABLE IF NOT EXISTS public.customer_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text,
  customer_email text,
  customer_phone text,
  invoice_number text,
  stripe_invoice_id text,
  survey_id uuid REFERENCES public.customer_surveys(id) ON DELETE SET NULL,
  credit_code text NOT NULL UNIQUE,
  credit_type text NOT NULL DEFAULT 'percent',
  credit_value_percent numeric(5,2) NOT NULL DEFAULT 10,
  credit_value_cents integer,
  currency text NOT NULL DEFAULT 'cad',
  status text NOT NULL DEFAULT 'active',
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '90 days'),
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE ON public.customer_credits TO authenticated;
GRANT ALL ON public.customer_credits TO service_role;

ALTER TABLE public.customer_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins read credits" ON public.customer_credits
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins update credits" ON public.customer_credits
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "no public credits select" ON public.customer_credits
  FOR SELECT TO anon USING (false);

CREATE INDEX IF NOT EXISTS idx_customer_credits_code ON public.customer_credits(credit_code);
CREATE INDEX IF NOT EXISTS idx_customer_credits_invoice ON public.customer_credits(invoice_number);

CREATE TRIGGER trg_customer_credits_updated
BEFORE UPDATE ON public.customer_credits
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) service_questions
CREATE TABLE IF NOT EXISTS public.service_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text,
  customer_name text,
  customer_email text,
  customer_phone text,
  question text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  internal_note text,
  answered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.service_questions TO authenticated;
GRANT INSERT ON public.service_questions TO anon;
GRANT ALL ON public.service_questions TO service_role;

ALTER TABLE public.service_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins read service questions" ON public.service_questions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins update service questions" ON public.service_questions
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Anyone can submit a service question (like contact_messages)
CREATE POLICY "anyone can insert service questions" ON public.service_questions
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "no public service questions select" ON public.service_questions
  FOR SELECT TO anon USING (false);

CREATE TRIGGER trg_service_questions_updated
BEFORE UPDATE ON public.service_questions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
