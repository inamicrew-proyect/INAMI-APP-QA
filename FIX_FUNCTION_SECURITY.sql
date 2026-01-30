-- Correccion de seguridad en funciones
-- Agregar search_path fijo a funciones SECURITY DEFINER

-- 1. Corregir funcion crear_notificacion
CREATE OR REPLACE FUNCTION public.crear_notificacion(
  p_usuario_id UUID,
  p_tipo_notificacion TEXT,
  p_titulo TEXT,
  p_mensaje TEXT,
  p_datos_adicionales JSONB DEFAULT NULL,
  p_prioridad TEXT DEFAULT 'media',
  p_fecha_vencimiento TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  notificacion_id UUID;
BEGIN
  INSERT INTO public.notificaciones (
    usuario_id,
    tipo_notificacion,
    titulo,
    mensaje,
    datos_adicionales,
    prioridad,
    fecha_vencimiento
  ) VALUES (
    p_usuario_id,
    p_tipo_notificacion,
    p_titulo,
    p_mensaje,
    p_datos_adicionales,
    p_prioridad,
    p_fecha_vencimiento
  ) RETURNING id INTO notificacion_id;
  
  RETURN notificacion_id;
END;
$$;

-- 2. Corregir funcion marcar_notificacion_leida
CREATE OR REPLACE FUNCTION public.marcar_notificacion_leida(p_notificacion_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.notificaciones 
  SET leida = TRUE, fecha_lectura = NOW()
  WHERE id = p_notificacion_id AND usuario_id = (SELECT auth.uid());
  
  RETURN FOUND;
END;
$$;

-- 3. Corregir funcion crear_recordatorios_automaticos
CREATE OR REPLACE FUNCTION public.crear_recordatorios_automaticos()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  atencion_record RECORD;
  usuario_record RECORD;
  dias_anticipacion INTEGER;
BEGIN
  FOR atencion_record IN 
    SELECT 
      a.id,
      a.joven_id,
      a.profesional_id,
      a.fecha_atencion,
      a.proxima_cita,
      p.full_name as profesional_nombre,
      j.nombres,
      j.apellidos
    FROM public.atenciones a
    JOIN public.profiles p ON a.profesional_id = p.id
    JOIN public.jovenes j ON a.joven_id = j.id
    WHERE a.proxima_cita IS NOT NULL
    AND a.estado IN ('pendiente', 'en_proceso')
    AND a.proxima_cita BETWEEN NOW() AND NOW() + INTERVAL '7 days'
  LOOP
    SELECT 
      COALESCE(cn.dias_anticipacion_citas, 1) as dias_anticipacion
    INTO usuario_record
    FROM public.configuraciones_notificaciones cn
    WHERE cn.usuario_id = atencion_record.profesional_id;
    
    dias_anticipacion := COALESCE(usuario_record.dias_anticipacion, 1);
    
    IF atencion_record.proxima_cita <= NOW() + (dias_anticipacion || ' days')::INTERVAL THEN
      PERFORM public.crear_notificacion(
        atencion_record.profesional_id,
        'cita_proxima',
        'Cita Proxima - ' || atencion_record.nombres || ' ' || atencion_record.apellidos,
        'Tienes una cita programada para el ' || 
        TO_CHAR(atencion_record.proxima_cita, 'DD/MM/YYYY HH24:MI') || 
        ' con ' || atencion_record.nombres || ' ' || atencion_record.apellidos,
        jsonb_build_object(
          'atencion_id', atencion_record.id,
          'joven_id', atencion_record.joven_id,
          'fecha_cita', atencion_record.proxima_cita
        ),
        'alta',
        atencion_record.proxima_cita
      );
    END IF;
  END LOOP;
  
  FOR atencion_record IN 
    SELECT 
      a.id,
      a.joven_id,
      a.profesional_id,
      a.fecha_atencion,
      p.full_name as profesional_nombre,
      j.nombres,
      j.apellidos
    FROM public.atenciones a
    JOIN public.profiles p ON a.profesional_id = p.id
    JOIN public.jovenes j ON a.joven_id = j.id
    WHERE a.estado = 'pendiente'
    AND a.fecha_atencion < NOW() - INTERVAL '3 days'
  LOOP
    SELECT 
      COALESCE(cn.dias_anticipacion_seguimientos, 3) as dias_anticipacion
    INTO usuario_record
    FROM public.configuraciones_notificaciones cn
    WHERE cn.usuario_id = atencion_record.profesional_id;
    
    dias_anticipacion := COALESCE(usuario_record.dias_anticipacion, 3);
    
    IF atencion_record.fecha_atencion <= NOW() - (dias_anticipacion || ' days')::INTERVAL THEN
      PERFORM public.crear_notificacion(
        atencion_record.profesional_id,
        'seguimiento_pendiente',
        'Seguimiento Pendiente - ' || atencion_record.nombres || ' ' || atencion_record.apellidos,
        'Tienes un seguimiento pendiente desde el ' || 
        TO_CHAR(atencion_record.fecha_atencion, 'DD/MM/YYYY') || 
        ' para ' || atencion_record.nombres || ' ' || atencion_record.apellidos,
        jsonb_build_object(
          'atencion_id', atencion_record.id,
          'joven_id', atencion_record.joven_id,
          'fecha_atencion', atencion_record.fecha_atencion
        ),
        'urgente',
        NOW() + INTERVAL '1 day'
      );
    END IF;
  END LOOP;
END;
$$;

-- 4. Corregir funcion handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 'seguridad');
  RETURN NEW;
END;
$$;

-- 5. Corregir funcion update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$;

