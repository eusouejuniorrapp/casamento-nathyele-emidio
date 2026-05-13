-- 1) Crie um bucket no Supabase Storage chamado: wedding-media
-- Marque o bucket como PUBLIC para facilitar a galeria e os downloads.

-- 2) Crie a tabela de registros dos uploads:
create table if not exists public.wedding_uploads (
  id uuid primary key default gen_random_uuid(),
  event_slug text not null default 'nathyele-emidio',
  guest_name text not null,
  file_name text not null,
  file_path text not null,
  file_url text not null,
  file_type text,
  file_size bigint,
  created_at timestamptz not null default now()
);

alter table public.wedding_uploads enable row level security;

-- MVP simples: permite inserir fotos sem login, porque convidado não terá cadastro.
drop policy if exists "guest_can_insert_wedding_uploads" on public.wedding_uploads;
create policy "guest_can_insert_wedding_uploads"
on public.wedding_uploads
for insert
to anon
with check (event_slug = 'nathyele-emidio');

-- MVP simples: permite a área admin listar via anon key + senha visual do app.
-- Para o casamento, isso simplifica bastante. Depois podemos endurecer com login real.
drop policy if exists "anon_can_read_wedding_uploads" on public.wedding_uploads;
create policy "anon_can_read_wedding_uploads"
on public.wedding_uploads
for select
to anon
using (event_slug = 'nathyele-emidio');

-- 3) Políticas do Storage para permitir upload sem login no bucket wedding-media.
drop policy if exists "guest_can_upload_wedding_media" on storage.objects;
create policy "guest_can_upload_wedding_media"
on storage.objects
for insert
to anon
with check (bucket_id = 'wedding-media' and position('nathyele-emidio/fotos/' in name) = 1);

drop policy if exists "public_can_read_wedding_media" on storage.objects;
create policy "public_can_read_wedding_media"
on storage.objects
for select
to anon
using (bucket_id = 'wedding-media');
