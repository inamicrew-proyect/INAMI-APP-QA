-- Catálogo de estados del joven (mantenimiento desde Admin > Seguridad).
-- Ejecutar en Supabase SQL editor o psql (localhost) antes de usar la UI de mantenimiento.

create table if not exists public.estados_joven (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nombre text not null,
  orden integer not null default 0,
  activo boolean not null default true,
  cuenta_como_activo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists estados_joven_orden_idx on public.estados_joven (orden asc);

alter table public.estados_joven enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'estados_joven' and policyname = 'estados_joven_select_authenticated'
  ) then
    create policy estados_joven_select_authenticated on public.estados_joven
      for select to authenticated using (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'estados_joven' and policyname = 'estados_joven_write_admin'
  ) then
    create policy estados_joven_write_admin on public.estados_joven
      for all to authenticated
      using (
        exists (
          select 1 from public.profiles p
          where p.id = auth.uid() and p.role = 'admin'
        )
      )
      with check (
        exists (
          select 1 from public.profiles p
          where p.id = auth.uid() and p.role = 'admin'
        )
      );
  end if;
end $$;

insert into public.estados_joven (codigo, nombre, orden, activo, cuenta_como_activo)
values
  ('activo', 'Activo', 1, true, true),
  ('inactivo', 'Inactivo', 2, true, false),
  ('egresado', 'Egresado', 3, true, false),
  ('transferido', 'Transferido', 4, true, false)
on conflict (codigo) do nothing;
