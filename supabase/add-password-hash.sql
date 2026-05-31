-- Run once if players table already exists without password_hash.
alter table players add column if not exists password_hash text;
