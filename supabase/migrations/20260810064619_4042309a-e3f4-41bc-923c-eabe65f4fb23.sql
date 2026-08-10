ALTER TABLE public.customer_credits
  ADD COLUMN IF NOT EXISTS reserved_at timestamptz,
  ADD COLUMN IF NOT EXISTS reserved_request_id text,
  ADD COLUMN IF NOT EXISTS used_request_id text;

CREATE INDEX IF NOT EXISTS idx_customer_credits_redemption
  ON public.customer_credits(status, expires_at, lower(customer_email));

CREATE OR REPLACE FUNCTION public.claim_customer_credit(
  p_credit_code text,
  p_customer_email text,
  p_request_id text
)
RETURNS TABLE (
  id uuid,
  credit_code text,
  credit_value_cents integer,
  currency text,
  expires_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF coalesce(trim(p_credit_code), '') = '' OR coalesce(trim(p_customer_email), '') = '' OR coalesce(trim(p_request_id), '') = '' THEN
    RAISE EXCEPTION 'credit code, customer email, and request id are required';
  END IF;

  RETURN QUERY
  SELECT c.id, c.credit_code, c.credit_value_cents, c.currency, c.expires_at
  FROM public.customer_credits c
  WHERE upper(c.credit_code) = upper(trim(p_credit_code))
    AND lower(coalesce(c.customer_email, '')) = lower(trim(p_customer_email))
    AND c.expires_at > now()
    AND coalesce(c.credit_value_cents, 0) > 0
    AND ((c.status = 'reserved' AND c.reserved_request_id = p_request_id)
      OR (c.status = 'used' AND c.used_request_id = p_request_id));
  IF FOUND THEN
    RETURN;
  END IF;

  RETURN QUERY
  UPDATE public.customer_credits c
  SET status = 'reserved',
      reserved_at = now(),
      reserved_request_id = p_request_id,
      updated_at = now()
  WHERE upper(c.credit_code) = upper(trim(p_credit_code))
    AND lower(coalesce(c.customer_email, '')) = lower(trim(p_customer_email))
    AND c.status = 'active'
    AND c.expires_at > now()
    AND coalesce(c.credit_value_cents, 0) > 0
  RETURNING c.id, c.credit_code, c.credit_value_cents, c.currency, c.expires_at;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_customer_credit(
  p_credit_id uuid,
  p_request_id text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  changed integer;
BEGIN
  UPDATE public.customer_credits
  SET status = 'active',
      reserved_at = NULL,
      reserved_request_id = NULL,
      updated_at = now()
  WHERE id = p_credit_id
    AND status = 'reserved'
    AND reserved_request_id = p_request_id;
  GET DIAGNOSTICS changed = ROW_COUNT;
  RETURN changed = 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.consume_customer_credit(
  p_credit_id uuid,
  p_request_id text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  changed integer;
BEGIN
  IF EXISTS (SELECT 1 FROM public.customer_credits WHERE id = p_credit_id AND status = 'used' AND used_request_id = p_request_id) THEN
    RETURN true;
  END IF;

  UPDATE public.customer_credits
  SET status = 'used',
      used_at = now(),
      used_request_id = p_request_id,
      reserved_at = NULL,
      reserved_request_id = NULL,
      updated_at = now()
  WHERE id = p_credit_id
    AND status = 'reserved'
    AND reserved_request_id = p_request_id;
  GET DIAGNOSTICS changed = ROW_COUNT;
  RETURN changed = 1;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_customer_credit(text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.release_customer_credit(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.consume_customer_credit(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_customer_credit(text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_customer_credit(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.consume_customer_credit(uuid, text) TO service_role;