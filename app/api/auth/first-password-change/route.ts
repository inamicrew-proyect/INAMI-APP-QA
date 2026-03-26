import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseRouteHandlerClient } from '@/lib/supabase-route-handler'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { passwordSchema } from '@/lib/validation/users'
import { formatZodErrors } from '@/lib/validation/utils'
import { userMustChangePassword } from '@/lib/auth-must-change-password'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

const bodySchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, { message: 'Ingresa tu contraseña actual (temporal).' }),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, { message: 'Confirma la nueva contraseña.' }),
  })
  .superRefine((data, ctx) => {
    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'La confirmación no coincide con la nueva contraseña.',
        path: ['confirmPassword'],
      })
    }
    if (data.newPassword === data.currentPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'La nueva contraseña debe ser distinta a la que usas ahora (temporal).',
        path: ['newPassword'],
      })
    }
  })

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos.', details: formatZodErrors(parsed.error) },
        { status: 422 }
      )
    }

    const { currentPassword, newPassword } = parsed.data

    const supabase = await createSupabaseRouteHandlerClient()
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'No hay sesión activa. Inicia sesión de nuevo.' }, { status: 401 })
    }

    if (!userMustChangePassword(session.user)) {
      return NextResponse.json(
        { error: 'No es necesario cambiar la contraseña en este momento.' },
        { status: 400 }
      )
    }

    const email = session.user.email
    if (!email) {
      return NextResponse.json({ error: 'Tu cuenta no tiene correo asociado.' }, { status: 400 })
    }

    const ipAddress =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    const { error: verifyCurrentError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    })
    if (verifyCurrentError) {
      return NextResponse.json(
        { error: 'La contraseña actual no es correcta. Verifica la contraseña temporal.' },
        { status: 400 }
      )
    }

    const {
      data: { session: sessionAfterVerify },
    } = await supabase.auth.getSession()
    const userId = session.user.id
    const meta = (sessionAfterVerify?.user.user_metadata ?? session.user.user_metadata ?? {}) as Record<
      string,
      unknown
    >

    const adminClient = getSupabaseAdmin()
    if (!adminClient) {
      return NextResponse.json({ error: 'Configuración inválida del servidor.' }, { status: 500 })
    }
    const { error: adminError } = await adminClient.auth.admin.updateUserById(userId, {
      password: newPassword,
      user_metadata: { ...meta, must_change_password: false },
    })

    if (adminError) {
      let msg = 'No se pudo actualizar la contraseña.'
      if (
        adminError.message?.includes('New password should be different') ||
        adminError.message?.includes('same as the old password')
      ) {
        msg = 'La nueva contraseña debe ser distinta a la contraseña temporal.'
      } else if (adminError.message?.includes('Password is too weak')) {
        msg = 'La contraseña es demasiado débil. Usa una contraseña más segura.'
      }
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    // Registrar bitácora: cambio de contraseña (best-effort)
    try {
      const adminClient = getSupabaseAdmin()
      if (adminClient) {
        await adminClient.from('system_logs').insert({
          usuario_id: userId,
          accion: 'password_changed',
          entidad: 'usuarios',
          entidad_id: userId,
          detalles: { email, source: 'first_password_change' },
          ip_address: ipAddress,
          user_agent: userAgent,
        })
      }
    } catch (logError) {
      console.warn('No se pudo registrar log de cambio de contraseña:', logError)
    }

    return NextResponse.json({ success: true, message: 'Contraseña actualizada. Vuelve a iniciar sesión.' })
  } catch (e) {
    console.error('first-password-change:', e)
    return NextResponse.json({ error: 'Error inesperado' }, { status: 500 })
  }
}
