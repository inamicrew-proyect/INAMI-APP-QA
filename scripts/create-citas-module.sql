-- Tabla de citas para agendamiento por roles/profesionales
create table if not exists public.citas (
  id uuid primary key default gen_random_uuid(),
  joven_id uuid not null references public.jovenes(id) on delete cascade,
  solicitante_id uuid not null references public.profiles(id) on delete restrict,
  profesional_id uuid null references public.profiles(id) on delete set null,
  rol_solicitante text not null,
  fecha_cita timestamptz not null,
  motivo text not null,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'en_proceso', 'realizada', 'cancelada')),
  notificacion_enviada boolean not null default false,
  notificacion_cita_enviada boolean not null default false,
  notificacion_seguimiento_enviada boolean not null default false,
  notificacion_cancelada_enviada boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_citas_fecha_cita on public.citas (fecha_cita);
create index if not exists idx_citas_joven_id on public.citas (joven_id);
create index if not exists idx_citas_solicitante_id on public.citas (solicitante_id);
create index if not exists idx_citas_profesional_id on public.citas (profesional_id);

alter table public.citas enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'citas' and policyname = 'citas_select_authenticated'
  ) then
    create policy citas_select_authenticated on public.citas
      for select
      to authenticated
      using (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'citas' and policyname = 'citas_insert_authenticated'
  ) then
    create policy citas_insert_authenticated on public.citas
      for insert
      to authenticated
      with check (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'citas' and policyname = 'citas_update_authenticated'
  ) then
    create policy citas_update_authenticated on public.citas
      for update
      to authenticated
      using (true)
      with check (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'citas' and policyname = 'citas_delete_authenticated'
  ) then
    create policy citas_delete_authenticated on public.citas
      for delete
      to authenticated
      using (true);
  end if;
end $$;
