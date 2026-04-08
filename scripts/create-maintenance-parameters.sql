create table if not exists public.parametros_mantenimiento (
  id uuid primary key default gen_random_uuid(),
  clave text not null unique,
  valor_texto text null,
  valor_entero integer null,
  valor_booleano boolean null,
  descripcion text null,
  updated_by uuid null references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.parametros_mantenimiento enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='parametros_mantenimiento' and policyname='parametros_mantenimiento_select_authenticated'
  ) then
    create policy parametros_mantenimiento_select_authenticated on public.parametros_mantenimiento
      for select to authenticated using (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='parametros_mantenimiento' and policyname='parametros_mantenimiento_write_admin'
  ) then
    create policy parametros_mantenimiento_write_admin on public.parametros_mantenimiento
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

insert into public.parametros_mantenimiento (clave, valor_entero, descripcion)
values ('notificaciones_dias_visibles', 7, 'Días que una notificación permanece visible (máximo 7).')
on conflict (clave) do nothing;
