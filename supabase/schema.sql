-- Shared "user-added books" store for the Goodreads/SteamDB app.
--
-- Run this once in your Supabase project's SQL editor
-- (Dashboard → SQL Editor → New query → paste → Run).
--
-- Security model: append-only. Anyone (anonymous) can read and insert; nobody can
-- update or delete via the public API. Moderate/remove rows from the dashboard.
-- The column CHECK constraints are the main guard against junk/spam inserts.

create table if not exists public.user_books (
  id            uuid        primary key default gen_random_uuid(),
  title         text        not null,
  authors       text        not null default '',
  year          int,
  avg           real        not null,
  ratings_count bigint      not null,
  created_at    timestamptz not null default now(),

  constraint title_len   check (char_length(title) between 1 and 300),
  constraint authors_len check (char_length(authors) <= 300),
  constraint avg_range   check (avg >= 1 and avg <= 5),
  constraint year_range  check (year is null or (year between -3000 and 2100)),
  constraint count_range check (ratings_count >= 1 and ratings_count <= 100000000)
);

-- Newest-first reads are the common case.
create index if not exists user_books_created_at_idx
  on public.user_books (created_at desc);

-- Row-Level Security: deny by default, then allow exactly read + insert for anon.
alter table public.user_books enable row level security;

grant select, insert on public.user_books to anon, authenticated;

drop policy if exists "user_books read" on public.user_books;
create policy "user_books read"
  on public.user_books for select
  to anon, authenticated
  using (true);

drop policy if exists "user_books insert" on public.user_books;
create policy "user_books insert"
  on public.user_books for insert
  to anon, authenticated
  with check (true);

-- No update/delete policy or grant => those operations are rejected (append-only).


-- ---------------------------------------------------------------------------
-- Shared "hidden books" store. A row here means a book is hidden from everyone's
-- view. Hiding inserts a row; un-hiding deletes it. Anyone may hide or un-hide
-- (anonymous, vandal-able by design) — moderate by clearing this table.
-- `book_id` is the dataset's numeric id (as text) OR a user_books uuid.

create table if not exists public.hidden_books (
  book_id    text        primary key,
  created_at timestamptz not null default now()
);

alter table public.hidden_books enable row level security;

grant select, insert, delete on public.hidden_books to anon, authenticated;

drop policy if exists "hidden_books read" on public.hidden_books;
create policy "hidden_books read"
  on public.hidden_books for select
  to anon, authenticated
  using (true);

drop policy if exists "hidden_books insert" on public.hidden_books;
create policy "hidden_books insert"
  on public.hidden_books for insert
  to anon, authenticated
  with check (true);

drop policy if exists "hidden_books delete" on public.hidden_books;
create policy "hidden_books delete"
  on public.hidden_books for delete
  to anon, authenticated
  using (true);
