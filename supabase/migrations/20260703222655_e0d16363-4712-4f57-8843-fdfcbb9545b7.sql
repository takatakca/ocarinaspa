
CREATE OR REPLACE FUNCTION public.validate_stripe_invoice_row()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.customer_rating IS NOT NULL AND (NEW.customer_rating < 1 OR NEW.customer_rating > 5) THEN
    RAISE EXCEPTION 'customer_rating must be between 1 and 5';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.validate_stripe_invoice_row() FROM PUBLIC, anon, authenticated;
