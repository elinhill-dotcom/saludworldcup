-- Run in Supabase SQL Editor. No auth — open RLS for office pool (anon key).

create extension if not exists "pgcrypto";

create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now(),
  password_hash text,
  picks_unlock_override boolean not null default false
);

create table if not exists matches (
  id int primary key,
  match_number int,
  day_label text not null,
  kickoff_at timestamptz not null,
  home_team text not null,
  away_team text not null,
  group_code text,
  stage text not null,
  broadcaster text,
  featured boolean not null default false,
  home_score int,
  away_score int,
  finished boolean not null default false,
  winner_team text
);

create table if not exists predictions (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  match_id int not null references matches(id) on delete cascade,
  home_score int not null,
  away_score int not null,
  unique (player_id, match_id)
);

create table if not exists knockout_picks (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null unique references players(id) on delete cascade,
  sf1_home text,
  sf1_away text,
  sf2_home text,
  sf2_away text,
  final_home text,
  final_away text,
  bronze_home text,
  bronze_away text,
  champion text
);

create table if not exists knockout_answer (
  id int primary key default 1,
  sf1_home text,
  sf1_away text,
  sf2_home text,
  sf2_away text,
  final_home text,
  final_away text,
  bronze_home text,
  bronze_away text,
  champion text,
  set boolean not null default false,
  constraint knockout_answer_singleton check (id = 1)
);

create table if not exists wall_comments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists match_chat_messages (
  id uuid primary key default gen_random_uuid(),
  match_id int not null references matches(id) on delete cascade,
  name text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_predictions_player on predictions(player_id);
create index if not exists idx_predictions_match on predictions(match_id);
create index if not exists idx_chat_match_created on match_chat_messages(match_id, created_at);

insert into knockout_answer (id, set) values (1, false)
on conflict (id) do nothing;

create table if not exists pool_settings (
  id int primary key default 1,
  picks_unlock_override boolean not null default false,
  constraint pool_settings_singleton check (id = 1)
);

insert into pool_settings (id, picks_unlock_override) values (1, false)
on conflict (id) do nothing;

-- RLS (permissive — no user auth)
alter table players enable row level security;
alter table matches enable row level security;
alter table predictions enable row level security;
alter table knockout_picks enable row level security;
alter table knockout_answer enable row level security;
alter table wall_comments enable row level security;
alter table match_chat_messages enable row level security;

alter table pool_settings enable row level security;

create policy "players_all" on players for all using (true) with check (true);
create policy "matches_all" on matches for all using (true) with check (true);
create policy "predictions_all" on predictions for all using (true) with check (true);
create policy "knockout_picks_all" on knockout_picks for all using (true) with check (true);
create policy "knockout_answer_all" on knockout_answer for all using (true) with check (true);
create policy "pool_settings_all" on pool_settings for all using (true) with check (true);
create policy "wall_comments_all" on wall_comments for all using (true) with check (true);
create policy "chat_all" on match_chat_messages for all using (true) with check (true);

-- Realtime for live chat (also enable in Dashboard → Database → Replication)
alter publication supabase_realtime add table match_chat_messages;
