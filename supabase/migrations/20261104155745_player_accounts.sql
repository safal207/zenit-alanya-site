create schema if not exists zenit_private;
revoke all on schema zenit_private from public, anon, authenticated;
grant usage on schema zenit_private to service_role;

create table zenit_private.invites (
  code_hash text primary key check (code_hash ~ '^[0-9a-f]{64}$'),
  expires_at timestamptz not null,
  claim uuid unique,
  login text unique check (login ~ '^[a-z0-9][a-z0-9_-]{2,23}$'),
  login_alias text unique,
  player_id uuid unique references auth.users(id) on delete set null,
  check ((claim is null) = (login is null) and (claim is null) = (login_alias is null)),
  check (player_id is null or claim is not null)
);
alter table zenit_private.invites enable row level security;
revoke all on zenit_private.invites from public, anon, authenticated;
grant select, update on zenit_private.invites to service_role;

create table public.zenit_player_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null default '' check (char_length(nickname) <= 40),
  strength text not null default '' check (char_length(strength) <= 180),
  goal text not null default '' check (char_length(goal) <= 180),
  route text not null default '' check (route in ('', 'team', 'matches', 'academy')),
  photo_jpeg text check (
    photo_jpeg is null or (
      octet_length(photo_jpeg) <= 320000 and
      photo_jpeg ~ '^data:image/jpeg;base64,/9j/[A-Za-z0-9+/]+={0,2}$'
    )
  )
);
alter table public.zenit_player_profiles enable row level security;
revoke all on public.zenit_player_profiles from public, anon, authenticated;
grant select on public.zenit_player_profiles to authenticated;
grant update (nickname, strength, goal, route, photo_jpeg) on public.zenit_player_profiles to authenticated;
grant insert on public.zenit_player_profiles to service_role;

create policy player_reads_own_profile on public.zenit_player_profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy player_edits_own_profile on public.zenit_player_profiles
  for update to authenticated using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create function public.zenit_claim_invite(p_hash text, p_login text, p_alias text)
returns uuid language plpgsql set search_path = '' as $$
declare ticket uuid;
begin
  update zenit_private.invites
  set claim = gen_random_uuid(), login = p_login, login_alias = p_alias
  where code_hash = p_hash and expires_at > now() and claim is null
  returning claim into ticket;
  return ticket;
exception when unique_violation then
  return null;
end;
$$;

create function public.zenit_finish_signup(p_claim uuid, p_user uuid)
returns boolean language plpgsql set search_path = '' as $$
begin
  update zenit_private.invites
  set player_id = p_user
  where claim = p_claim and player_id is null;
  if not found then return false; end if;

  insert into public.zenit_player_profiles(id) values (p_user);
  return true;
end;
$$;

create function public.zenit_release_invite(p_claim uuid)
returns void language sql set search_path = '' as $$
  update zenit_private.invites
  set claim = null, login = null, login_alias = null
  where claim = p_claim and player_id is null;
$$;

create function public.zenit_login_alias(p_login text)
returns text language sql stable set search_path = '' as $$
  select login_alias from zenit_private.invites where login = p_login and player_id is not null;
$$;

revoke all on function public.zenit_claim_invite(text,text,text) from public, anon, authenticated;
revoke all on function public.zenit_finish_signup(uuid,uuid) from public, anon, authenticated;
revoke all on function public.zenit_release_invite(uuid) from public, anon, authenticated;
revoke all on function public.zenit_login_alias(text) from public, anon, authenticated;
grant execute on function public.zenit_claim_invite(text,text,text) to service_role;
grant execute on function public.zenit_finish_signup(uuid,uuid) to service_role;
grant execute on function public.zenit_release_invite(uuid) to service_role;
grant execute on function public.zenit_login_alias(text) to service_role;
