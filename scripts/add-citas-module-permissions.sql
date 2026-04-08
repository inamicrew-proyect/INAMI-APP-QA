do $$
declare
  v_modulo_id uuid;
  v_admin_role_id uuid;
begin
  insert into public.modulos (nombre, descripcion, ruta, icono, orden, activo)
  values ('Citas', 'Agenda de citas para jóvenes', '/dashboard/citas', 'CalendarDays', 4, true)
  on conflict (ruta) do update
    set nombre = excluded.nombre,
        descripcion = excluded.descripcion,
        icono = excluded.icono,
        activo = true,
        orden = excluded.orden
  returning id into v_modulo_id;

  if v_modulo_id is null then
    select id into v_modulo_id from public.modulos where ruta = '/dashboard/citas' limit 1;
  end if;

  select id into v_admin_role_id from public.roles where nombre = 'admin' limit 1;

  if v_modulo_id is not null and v_admin_role_id is not null then
    insert into public.role_module_permissions (role_id, modulo_id, puede_ver, puede_crear, puede_editar, puede_eliminar)
    values (v_admin_role_id, v_modulo_id, true, true, true, true)
    on conflict (role_id, modulo_id)
    do update set
      puede_ver = excluded.puede_ver,
      puede_crear = excluded.puede_crear,
      puede_editar = excluded.puede_editar,
      puede_eliminar = excluded.puede_eliminar;
  end if;
end $$;
