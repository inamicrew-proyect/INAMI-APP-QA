import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
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

    if (newPassword.length < 10) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 10 caracteres' }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies: () => cookies() })
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'No hay sesión activa. Por favor, use el enlace de recuperación nuevamente.' }, { status: 401 })
    }

    const userId = session.user.id
    const userEmail = session.user.email

    console.log('Intentando cambiar contraseña para usuario:', { userId, userEmail })

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
        return NextResponse.json({ 
          error: 'Error al cambiar la contraseña',
          details: adminError.message 
        }, { status: 500 })
      }

      console.log('✅ Contraseña cambiada exitosamente usando admin client')
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
      return NextResponse.json({ 
        error: 'Error al cambiar la contraseña',
        details: updateError.message 
      }, { status: 500 })
    }

    // Si no hay error, la contraseña se cambió exitosamente
    console.log('✅ Contraseña cambiada exitosamente usando updateUser')
    return NextResponse.json({ 
      success: true,
      message: 'Contraseña cambiada correctamente'
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Error inesperado' }, { status: 500 })
  }
}

