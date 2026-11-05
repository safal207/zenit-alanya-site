-- Private, player-authored goals; no coach approval or academy admission is inferred.
alter table public.zenit_player_profiles
  add column journey_plan jsonb not null default '{}'::jsonb,
  add constraint player_journey_plan_bounded check (
    jsonb_typeof(journey_plan) = 'object' and octet_length(journey_plan::text) <= 4096
  );
grant update (journey_plan) on public.zenit_player_profiles to authenticated;
-- Existing owner-only SELECT and UPDATE policies apply to this column as well.
notify pgrst, 'reload schema';
