 -- Схема backend (Supabase / PostgreSQL) для приложения Kept.
-- Как применить: создать проект в Supabase -> SQL Editor -> вставить файл -> Run.
-- Файл можно запускать повторно. Ключи и данные в файл не входят.

-- 1. Профили пользователей
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text,
  passcode text
);

-- RLS выключен: вход проверяется запросом по username и passcode.
alter table public.profiles disable row level security;

drop policy if exists "Users can view their own profile."   on public.profiles;
drop policy if exists "Users can insert their own profile." on public.profiles;

-- 2. Таблица фотографий
create table if not exists public.photos (
  id uuid default gen_random_uuid() primary key,
  storage_path text not null,
  caption text,
  user_id uuid not null default auth.uid()
    references public.profiles (id) on update cascade on delete cascade,
  created_at timestamptz not null default now()
);

-- 3. Row Level Security для фотографий
alter table public.photos enable row level security;

drop policy if exists "Users can view their own photos."   on public.photos;
drop policy if exists "Users can insert their own photos." on public.photos;

-- Просмотр: только свои фотографии.
create policy "Users can view their own photos."
  on public.photos for select
  using (auth.uid() = user_id);

-- Загрузка: только от своего имени.
create policy "Users can insert their own photos."
  on public.photos for insert
  with check (auth.uid() = user_id);

-- 4. Хранилище файлов (Storage)
-- Публичный bucket: файлы открываются по прямой ссылке.
insert into storage.buckets (id, name, public)
values ('event-photos', 'event-photos', true)
on conflict (id) do update set public = true;

drop policy if exists "event-photos upload" on storage.objects;
drop policy if exists "event-photos read"   on storage.objects;

-- Загрузка файлов: только для вошедших пользователей.
create policy "event-photos upload"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'event-photos');

-- Чтение файлов: только для вошедших пользователей.
create policy "event-photos read"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'event-photos');

-- 5. Обновить кэш схемы API 
notify pgrst, 'reload schema';
