-- Run once in Supabase SQL Editor if pool_settings does not exist yet.

create table if not exists pool_settings (
  id int primary key default 1,
  picks_unlock_override boolean not null default false,
  constraint pool_settings_singleton check (id = 1)
);

insert into pool_settings (id, picks_unlock_override) values (1, false)
on conflict (id) do nothing;

alter table pool_settings enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'pool_settings'
      and policyname = 'pool_settings_all'
  ) then
    create policy "pool_settings_all" on pool_settings for all using (true) with check (true);
  end if;
end $$;
