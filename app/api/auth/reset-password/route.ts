import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseRouteHandlerClient } from '@/lib/supabase-route-handler'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

// POST - Cambiar contraseña usando la sesión actual (después del callback de Supabase)
// IMPORTANTE: Cuando MFA está habilitado, Supabase requiere AAL2 para cambiar la contraseña,
// pero en recuperación de contraseña solo tenemos AAL1. Por eso usamos el admin client.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { newPassword } = body

    if (!newPassword) {
      return NextResponse.json({ error: 'Nueva contraseña es requerida' }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 })
    }

    if (/\s/.test(newPassword)) {
      return NextResponse.json({ error: 'La contraseña no puede contener espacios' }, { status: 400 })
    }

    const supabase = await createSupabaseRouteHandlerClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'No hay sesión activa. Por favor, use el enlace de recuperación nuevamente.' }, { status: 401 })
    }

    const userId = session.user.id
    const userEmail = session.user.email

    console.log('Intentando cambiar contraseña para usuario:', { userId, userEmail })

    const ipAddress =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Intentar cambiar la contraseña usando updateUser primero
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    })

    // Log detallado del error para debugging
    if (updateError) {
      console.log('Error al cambiar contraseña con updateUser:', {
        code: updateError.code,
        message: updateError.message,
        status: updateError.status,
        name: updateError.name
      })
    }

    // Detectar error de AAL2 insuficiente de múltiples formas
    const isInsufficientAAL = updateError && (
      updateError.code === 'insufficient_aal' ||
      updateError.message?.includes('AAL2 session is required') ||
      updateError.message?.includes('insufficient_aal') ||
      (updateError as any)?.__isAuthError && updateError.status === 401 && updateError.code === 'insufficient_aal'
    )

    // Si el error es por AAL2 insuficiente (recuperación de contraseña con MFA habilitado),
    // usar el admin client para cambiar la contraseña directamente
    if (isInsufficientAAL) {
      console.log('✅ AAL2 insuficiente detectado, usando admin client para cambiar contraseña')
      
      const adminClient = getSupabaseAdmin()
      if (!adminClient) {
        console.error('❌ Admin client no disponible')
        return NextResponse.json({ 
          error: 'Error de configuración del servidor. No se pudo cambiar la contraseña.' 
        }, { status: 500 })
      }

      console.log('✅ Admin client disponible, cambiando contraseña con admin.updateUserById')

      // Usar admin client para cambiar la contraseña (no requiere AAL2)
      const { error: adminError } = await adminClient.auth.admin.updateUserById(userId, {
        password: newPassword
      })

      if (adminError) {
        console.error('❌ Error updating password with admin client:', {
          code: adminError.code,
          message: adminError.message,
          status: adminError.status
        })
        
        // Traducir mensajes de error comunes al español
        let errorMessage = 'Error al cambiar la contraseña'
        if (adminError.message?.includes('New password should be different from the old password') ||
            adminError.message?.includes('Password should be different from the old password') ||
            adminError.message?.includes('same as the old password')) {
          errorMessage = 'La nueva contraseña debe ser diferente a la contraseña actual'
        } else if (adminError.message?.includes('Password is too weak')) {
          errorMessage = 'La contraseña es demasiado débil. Usa una contraseña más segura'
        } else if (adminError.message?.includes('Password should be at least')) {
          errorMessage = 'La contraseña debe tener al menos 10 caracteres'
        }
        
        return NextResponse.json({ 
          error: errorMessage
        }, { status: 500 })
      }

      console.log('✅ Contraseña cambiada exitosamente usando admin client')

      // Registrar bitácora: cambio de contraseña (best-effort)
      try {
        await adminClient.from('system_logs').insert({
          usuario_id: userId,
          accion: 'password_changed',
          entidad: 'usuarios',
          entidad_id: userId,
          detalles: { email: userEmail, source: 'reset_password' },
          ip_address: ipAddress,
          user_agent: userAgent,
        })
      } catch (logError) {
        console.warn('No se pudo registrar log de cambio de contraseña:', logError)
      }

      return NextResponse.json({ 
        success: true,
        message: 'Contraseña cambiada correctamente'
      })
    }

    // Si hay otro error, retornarlo
    if (updateError) {
      console.error('❌ Error updating password (no es insufficient_aal):', {
        code: updateError.code,
        message: updateError.message,
        status: updateError.status
      })
      
      // Traducir mensajes de error comunes al español
      let errorMessage = 'Error al cambiar la contraseña'
      if (updateError.message?.includes('New password should be different from the old password') ||
          updateError.message?.includes('Password should be different from the old password') ||
          updateError.message?.includes('same as the old password')) {
        errorMessage = 'La nueva contraseña debe ser diferente a la contraseña actual'
      } else if (updateError.message?.includes('Password is too weak')) {
        errorMessage = 'La contraseña es demasiado débil. Usa una contraseña más segura'
      } else if (updateError.message?.includes('Password should be at least')) {
        errorMessage = 'La contraseña debe tener al menos 8 caracteres'
      }
      
      return NextResponse.json({ 
        error: errorMessage
      }, { status: 500 })
    }

    // Si no hay error, la contraseña se cambió exitosamente
    console.log('✅ Contraseña cambiada exitosamente usando updateUser')

    // Registrar bitácora: cambio de contraseña (best-effort)
    try {
      const adminClient = getSupabaseAdmin()
      if (adminClient) {
        await adminClient.from('system_logs').insert({
          usuario_id: userId,
          accion: 'password_changed',
          entidad: 'usuarios',
          entidad_id: userId,
          detalles: { email: userEmail, source: 'reset_password' },
          ip_address: ipAddress,
          user_agent: userAgent,
        })
      }
    } catch (logError) {
      console.warn('No se pudo registrar log de cambio de contraseña:', logError)
    }

    return NextResponse.json({ 
      success: true,
      message: 'Contraseña cambiada correctamente'
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Error inesperado' }, { status: 500 })
  }
}

