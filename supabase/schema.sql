-- LetterLinx Classroom Edition — database setup for email-account teachers.
-- Run once in Supabase: SQL Editor → New query → paste → Run. Safe to re-run.
--
-- Every row belongs to the signed-in teacher (owner_id = auth.uid()); row-level
-- security means a teacher can only ever read or change their own rows.
-- Student data is limited to first names and last initials.

-- Typed-in classes (students stored as [{id, first, lastInitial}]).
create table if not exists public.classes (
  owner_id   uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id         text not null check (char_length(id) between 1 and 80),
  name       text not null check (char_length(name) between 1 and 60),
  subject    text not null default '' check (char_length(subject) <= 60),
  grade      text not null default '' check (char_length(grade) <= 10),
  period     text not null default '' check (char_length(period) <= 10),
  students   jsonb not null default '[]'::jsonb
             check (jsonb_typeof(students) = 'array' and jsonb_array_length(students) <= 60),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (owner_id, id)
);

-- Word sets (the full set as JSON: title, language, words, clues, display settings).
create table if not exists public.word_sets (
  owner_id   uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id         text not null check (char_length(id) between 1 and 80),
  data       jsonb not null check (pg_column_size(data) < 20000),
  updated_at timestamptz not null default now(),
  primary key (owner_id, id)
);

-- Finished rounds for reports (players, finds, times, hints as JSON).
create table if not exists public.round_results (
  owner_id   uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id         text not null check (char_length(id) between 1 and 120),
  section_id text,
  started_at timestamptz not null,
  data       jsonb not null check (pg_column_size(data) < 300000),
  updated_at timestamptz not null default now(),
  primary key (owner_id, id)
);
create index if not exists round_results_owner_started on public.round_results (owner_id, started_at desc);

alter table public.classes       enable row level security;
alter table public.word_sets     enable row level security;
alter table public.round_results enable row level security;

-- One policy per table: owners can select/insert/update/delete their own rows only.
do $$
declare t text;
begin
  foreach t in array array['classes', 'word_sets', 'round_results'] loop
    execute format('drop policy if exists "owner access" on public.%I', t);
    execute format(
      'create policy "owner access" on public.%I for all to authenticated
         using (owner_id = (select auth.uid()))
         with check (owner_id = (select auth.uid()))', t);
  end loop;
end $$;

-- Signed-out visitors get nothing; signed-in teachers only reach rows the policy allows.
revoke all on public.classes, public.word_sets, public.round_results from anon;
grant select, insert, update, delete on public.classes, public.word_sets, public.round_results to authenticated;
