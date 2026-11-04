create function public.zenit_pending_signup(p_hash text, p_login text)
returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object('claim', claim, 'alias', login_alias)
  from zenit_private.invites
  where code_hash = p_hash and login = p_login and player_id is null and expires_at > now();
$$;

revoke all on function public.zenit_pending_signup(text,text) from public, anon, authenticated;
grant execute on function public.zenit_pending_signup(text,text) to service_role;
