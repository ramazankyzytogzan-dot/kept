 · SQL
-- Схема backend (Supabase / PostgreSQL) для приложения Kept.
-- Как применить: создать проект в Supabase -> SQL Editor -> вставить файл -> Run.
-- Ключи и данные в файл не входят.
 
-- 1. Профили пользователей
-- TODO: сверить с реальной таблицей в проекте (колонки и политики).
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text,
  passcode text
);
 
alter table public.profiles enable row level security;
-- TODO: добавить политики для profiles (чтение и изменение своей строки).
 
-- 2. Таблица фотографий
create table if not exists public.photos (
  id uuid default gen_random_uuid() primary key,
  storage_path text not null,
  caption text,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
 
-- 3. Row Level Security (без политик доступ закрыт полностью)
alter table public.photos enable row level security;
 
-- Просмотр: каждый пользователь видит только свои фотографии.
create policy "Users can view their own photos."
  on public.photos for select
  using (auth.uid() = user_id);
 
-- Загрузка: только авторизованный пользователь и только от своего имени.
create policy "Users can insert their own photos."
  on public.photos for insert
  with check (auth.uid() = user_id);
 
-- Удаление (нужно, если в приложении есть кнопка «удалить»):
-- create policy "Users can delete their own photos."
--   on public.photos for delete
--   using (auth.uid() = user_id);
 
-- 4. Хранилище файлов (Storage)
-- TODO: указать имя bucket и политики Storage (Storage -> Policies).
-- Они хранятся отдельно от таблиц.
 
-- 5. Обновить кэш схемы API (если запросы возвращают 400 после изменений)
notify pgrst, 'reload schema';
