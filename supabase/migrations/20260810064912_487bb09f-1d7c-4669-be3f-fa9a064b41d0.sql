REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.validate_stripe_invoice_row() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

DROP POLICY IF EXISTS "no public rate limit access" ON public.rate_limit_buckets;
CREATE POLICY "no public rate limit access" ON public.rate_limit_buckets
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);