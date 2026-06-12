-- Per-player pick reopen after deadline. Run once in Supabase SQL Editor.

alter table players
  add column if not exists picks_unlock_override boolean not null default false;
