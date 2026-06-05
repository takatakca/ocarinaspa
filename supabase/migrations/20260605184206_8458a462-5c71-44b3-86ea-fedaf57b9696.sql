CREATE TABLE public.diagnostic_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  full_name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  city text NOT NULL,
  brand text NOT NULL,
  model text,
  spa_year text,
  error_code text,
  problem_description text NOT NULL,
  heating text,
  pump_works text,
  pump_noise text,
  since text,
  consent boolean NOT NULL DEFAULT false,
  source_url text,
  ai_diagnostic text,
  ai_causes jsonb,
  ai_actions jsonb,
  ai_urgency text,
  ai_recommend_call boolean,
  status text NOT NULL DEFAULT 'nouveau'
);
GRANT INSERT ON public.diagnostic_leads TO anon, authenticated;
GRANT ALL ON public.diagnostic_leads TO service_role;
ALTER TABLE public.diagnostic_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can insert diagnostic_leads"
  ON public.diagnostic_leads FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "no public read diagnostic_leads"
  ON public.diagnostic_leads FOR SELECT TO anon, authenticated USING (false);