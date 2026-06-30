-- Knockout: winner when score is level after 90 min (ET/penalties).
alter table matches add column if not exists winner_team text;
