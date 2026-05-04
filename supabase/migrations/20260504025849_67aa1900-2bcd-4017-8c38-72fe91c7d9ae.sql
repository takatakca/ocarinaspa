create table public.service_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  full_name text not null,
  phone text not null,
  email text not null,
  city text,
  postal_code text,
  service_type text not null,
  spa_brand text,
  spa_model text,
  problem_description text,
  urgency text,
  preferred_date date,
  status text not null default 'nouveau',
  notes text,
  source_url text
);
alter table public.service_requests enable row level security;

-- Anyone can submit a request (public form)
create policy "anyone can insert service_requests"
on public.service_requests for insert
to anon, authenticated
with check (true);

-- No public read; admin reads via service role only
create policy "no public read"
on public.service_requests for select
to anon, authenticated
using (false);

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  email text not null,
  phone text,
  message text not null,
  status text not null default 'nouveau'
);
alter table public.contact_messages enable row level security;

create policy "anyone can insert contact_messages"
on public.contact_messages for insert
to anon, authenticated
with check (true);

create policy "no public read contact"
on public.contact_messages for select
to anon, authenticated
using (false);