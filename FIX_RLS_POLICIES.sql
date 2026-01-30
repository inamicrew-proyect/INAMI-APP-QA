-- ============================================
-- CORRECCIÓN DE POLÍTICAS RLS PARA MEJOR RENDIMIENTO
-- Ejecutar este SQL en Supabase SQL Editor
-- ============================================
-- 
-- PROBLEMA: Las políticas usan auth.uid() directamente, 
-- lo que causa que se evalúe para cada fila.
-- SOLUCIÓN: Usar (SELECT auth.uid()) para evaluar una sola vez.
-- ============================================

-- 1. CORREGIR POLÍTICAS DE PROFILES
-- ============================================

-- Eliminar política antigua de SELECT
DROP POLICY IF EXISTS "Los usuarios pueden ver su propio perfil" ON public.profiles;

-- Crear política corregida de SELECT
CREATE POLICY "Los usuarios pueden ver su propio perfil" 
  ON public.profiles
  FOR SELECT 
  TO authenticated
  USING ((SELECT auth.uid()) = id);

-- Eliminar política antigua de UPDATE
DROP POLICY IF EXISTS "Los usuarios pueden actualizar su propio perfil" ON public.profiles;

-- Crear política corregida de UPDATE
CREATE POLICY "Los usuarios pueden actualizar su propio perfil" 
  ON public.profiles
  FOR UPDATE 
  TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

-- ============================================
-- 2. CORREGIR POLÍTICAS DE ATENCIONES
-- ============================================

-- Eliminar política antigua de DELETE
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus atenciones" ON public.atenciones;

-- Crear política corregida de DELETE
CREATE POLICY "Usuarios pueden eliminar sus atenciones" 
  ON public.atenciones
  FOR DELETE 
  TO authenticated
  USING (profesional_id = (SELECT auth.uid()));

-- ============================================
-- 3. CORREGIR POLÍTICAS DE NOTIFICACIONES
-- ============================================

-- Eliminar políticas antiguas de notificaciones
DROP POLICY IF EXISTS "Usuarios pueden ver sus notificaciones" ON public.notificaciones;
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus notificaciones" ON public.notificaciones;

-- Crear políticas corregidas de notificaciones
CREATE POLICY "Usuarios pueden ver sus notificaciones" 
  ON public.notificaciones
  FOR SELECT 
  TO authenticated
  USING ((SELECT auth.uid()) = usuario_id);

CREATE POLICY "Usuarios pueden actualizar sus notificaciones" 
  ON public.notificaciones
  FOR UPDATE 
  TO authenticated
  USING ((SELECT auth.uid()) = usuario_id)
  WITH CHECK ((SELECT auth.uid()) = usuario_id);

-- ============================================
-- 4. CORREGIR POLÍTICAS DE CONFIGURACIONES DE NOTIFICACIONES
-- ============================================
-- PROBLEMA: Hay dos políticas permisivas para SELECT, lo que causa
-- que ambas se evalúen para cada consulta (ineficiente).
-- SOLUCIÓN: Consolidar en una sola política por acción.

-- Eliminar políticas antiguas de configuraciones
DROP POLICY IF EXISTS "Usuarios pueden ver su configuración" ON public.configuraciones_notificaciones;
DROP POLICY IF EXISTS "Usuarios pueden actualizar su configuración" ON public.configuraciones_notificaciones;

-- Crear política consolidada para SELECT (una sola política)
CREATE POLICY "Usuarios pueden ver su configuración" 
  ON public.configuraciones_notificaciones
  FOR SELECT 
  TO authenticated
  USING ((SELECT auth.uid()) = usuario_id);

-- Crear política separada para UPDATE (no FOR ALL para evitar duplicación)
CREATE POLICY "Usuarios pueden actualizar su configuración" 
  ON public.configuraciones_notificaciones
  FOR UPDATE 
  TO authenticated
  USING ((SELECT auth.uid()) = usuario_id)
  WITH CHECK ((SELECT auth.uid()) = usuario_id);

-- Crear política para INSERT (si los usuarios pueden crear su propia configuración)
CREATE POLICY "Usuarios pueden crear su configuración" 
  ON public.configuraciones_notificaciones
  FOR INSERT 
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = usuario_id);

-- ============================================
-- VERIFICACIÓN
-- ============================================
-- Después de ejecutar, verifica que las políticas se crearon correctamente:
-- SELECT schemaname, tablename, policyname, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename IN ('profiles', 'atenciones', 'notificaciones', 'configuraciones_notificaciones')
-- ORDER BY tablename, policyname;

-- Verificar que no hay políticas duplicadas para SELECT en configuraciones_notificaciones:
-- SELECT tablename, cmd, COUNT(*) as cantidad
-- FROM pg_policies 
-- WHERE tablename = 'configuraciones_notificaciones' AND cmd = 'SELECT'
-- GROUP BY tablename, cmd;
-- Debe mostrar cantidad = 1 (una sola política para SELECT)

