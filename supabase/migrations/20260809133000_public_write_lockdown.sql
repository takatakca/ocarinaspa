-- Ocarina Spa production lockdown
-- All public lead/customer writes must cross validated, rate-limited server boundaries.
-- The browser's anon key must not be able to bypass those controls through PostgREST.

REVOKE INSERT ON public.service_requests FROM anon, authenticated;
DROP POLICY IF EXISTS "anyone can insert service_requests" ON public.service_requests;

REVOKE INSERT ON public.contact_messages FROM anon, authenticated;
DROP POLICY IF EXISTS "anyone can insert contact_messages" ON public.contact_messages;

-- Reinforce previous hardening in case older environments applied migrations out of sequence.
REVOKE INSERT ON public.diagnostic_leads FROM anon, authenticated;
DROP POLICY IF EXISTS "anyone can insert diagnostic_leads" ON public.diagnostic_leads;

REVOKE INSERT ON public.service_questions FROM anon, authenticated;
DROP POLICY IF EXISTS "anyone can insert service questions" ON public.service_questions;

REVOKE INSERT, UPDATE ON public.customer_surveys FROM anon;
DROP POLICY IF EXISTS "no public survey insert" ON public.customer_surveys;
DROP POLICY IF EXISTS "no public survey update" ON public.customer_surveys;
CREATE POLICY "public survey writes blocked" ON public.customer_surveys
  FOR ALL TO anon USING (false) WITH CHECK (false);
