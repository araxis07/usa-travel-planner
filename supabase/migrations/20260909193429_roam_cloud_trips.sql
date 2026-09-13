-- Private-by-default trip storage; no service key is used by the web application.
create schema if not exists roam_private;
revoke all on schema roam_private from public, anon, authenticated;

create table public.roam_trips (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  payload jsonb not null check (jsonb_typeof(payload) = 'object' and octet_length(payload::text) <= 1000000 and payload ? 'stops' and jsonb_typeof(payload->'stops') = 'array'),
  revision bigint not null default 1,
  updated_at timestamptz not null default now()
);
create index roam_trips_owner_updated on public.roam_trips (owner_id, updated_at desc);
alter table public.roam_trips enable row level security;
revoke all on public.roam_trips from public, anon, authenticated;
grant select, delete on public.roam_trips to authenticated;
grant insert (payload) on public.roam_trips to authenticated;
grant update (payload) on public.roam_trips to authenticated;
create policy trips_read on public.roam_trips for select to authenticated using ((select auth.uid()) = owner_id);
create policy trips_insert on public.roam_trips for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy trips_update on public.roam_trips for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy trips_delete on public.roam_trips for delete to authenticated using ((select auth.uid()) = owner_id);

create function roam_private.bump_trip_revision() returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  new.revision := old.revision + 1;
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function roam_private.bump_trip_revision() from public, anon, authenticated;
create trigger bump_trip_revision before update on public.roam_trips for each row execute function roam_private.bump_trip_revision();

-- A share is an explicit, immutable snapshot. Future private edits never leak into it.
create table public.roam_shares (
  token uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  payload jsonb not null check (jsonb_typeof(payload) = 'object' and octet_length(payload::text) <= 1000000 and payload ? 'stops' and jsonb_typeof(payload->'stops') = 'array'),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days' check (expires_at <= created_at + interval '30 days' and expires_at > created_at)
);
create index roam_shares_owner on public.roam_shares(owner_id);
alter table public.roam_shares enable row level security;
revoke all on public.roam_shares from public, anon, authenticated;
grant select, delete on public.roam_shares to authenticated;
grant insert (payload) on public.roam_shares to authenticated;
create policy shares_read on public.roam_shares for select to authenticated using ((select auth.uid()) = owner_id);
create policy shares_insert on public.roam_shares for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy shares_delete on public.roam_shares for delete to authenticated using ((select auth.uid()) = owner_id);

-- The only anonymous read is a single, unguessable, unexpired bearer link.
-- Kept in a private schema; fixed search_path and fully qualified relations.
create function roam_private.read_shared_trip(p_token uuid) returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('trip', payload, 'expiresAt', expires_at)
  from public.roam_shares where token = p_token and expires_at > now();
$$;
revoke all on function roam_private.read_shared_trip(uuid) from public, anon, authenticated;
grant usage on schema roam_private to anon, authenticated;
grant execute on function roam_private.read_shared_trip(uuid) to anon, authenticated;
create function public.roam_read_shared_trip(p_token uuid) returns jsonb language sql stable security invoker set search_path = '' as $$
  select roam_private.read_shared_trip(p_token);
$$;
revoke all on function public.roam_read_shared_trip(uuid) from public;
grant execute on function public.roam_read_shared_trip(uuid) to anon, authenticated;
