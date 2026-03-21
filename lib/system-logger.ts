import { createClientComponentClient } from '@/lib/supabase-browser'
import { getSupabaseAdmin } from './supabase-admin'

export interface LogAction {
  accion: string
  entidad?: string
  entidad_id?: string
  detalles?: Record<string, any>
  ip_address?: string
  user_agent?: string
}

/**
 * Registra una acción en el log del sistema
 * @param action - Información de la acción a registrar
 * @param userId - ID del usuario que realiza la acción (opcional, se obtiene automáticamente si no se proporciona)
 */
export async function logSystemAction(
  action: LogAction,
  userId?: string
): Promise<void> {
  try {
    // Obtener cliente admin para poder insertar logs
    const adminClient = getSupabaseAdmin()
    if (!adminClient) {
      console.error('No se pudo obtener cliente admin para registrar log')
      return
    }

    // Si no se proporciona userId, intentar obtenerlo del cliente
    let finalUserId = userId
    if (!finalUserId) {
      try {
        const supabase = createClientComponentClient()
        const { data: { user } } = await supabase.auth.getUser()
        finalUserId = user?.id ?? undefined
        // Si sigue sin haber usuario, intentar con getSession (a veces más rápido)
        if (!finalUserId) {
          const { data: { session } } = await supabase.auth.getSession()
          finalUserId = session?.user?.id ?? undefined
        }
      } catch (error) {
        console.error('Error obteniendo usuario para log:', error)
      }
    }

    // No insertar log si no hay usuario identificado (evitar registros como "Sistema")
    if (!finalUserId) {
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
        console.warn('[logSystemAction] No se pudo obtener userId; no se registra la acción para evitar usuario "Sistema". Pasa userId explícitamente si es posible.')
      }
      return
    }

    // Obtener IP y User Agent si están disponibles
    let ipAddress: string | undefined
    let userAgent: string | undefined

    if (typeof window !== 'undefined') {
      // En el cliente, intentar obtener IP (puede requerir un servicio externo)
      // Por ahora, solo guardamos user agent
      userAgent = navigator.userAgent
    }

    // Insertar log en la base de datos
    const { error } = await adminClient
      .from('system_logs')
      .insert({
        usuario_id: finalUserId,
        accion: action.accion,
        entidad: action.entidad || null,
        entidad_id: action.entidad_id || null,
        detalles: action.detalles ? JSON.stringify(action.detalles) : null,
        ip_address: ipAddress || null,
        user_agent: userAgent || null,
      })

    if (error) {
      console.error('Error registrando log del sistema:', error)
    }
  } catch (error) {
    console.error('Error en logSystemAction:', error)
  }
}

/**
 * Helper para registrar acciones comunes
 */
export const SystemLogger = {
  login: async (userId: string, email: string) => {
    await logSystemAction({
      accion: 'login',
      entidad: 'usuarios',
      entidad_id: userId,
      detalles: { email },
    }, userId)
  },

  logout: async (userId: string, email: string) => {
    await logSystemAction({
      accion: 'logout',
      entidad: 'usuarios',
      entidad_id: userId,
      detalles: { email },
    }, userId)
  },

  createUser: async (userId: string, newUserId: string, email: string) => {
    await logSystemAction({
      accion: 'create_user',
      entidad: 'usuarios',
      entidad_id: newUserId,
      detalles: { email, created_by: userId },
    }, userId)
  },

  updateUser: async (userId: string, targetUserId: string, changes: Record<string, any>) => {
    await logSystemAction({
      accion: 'update_user',
      entidad: 'usuarios',
      entidad_id: targetUserId,
      detalles: { changes, updated_by: userId },
    }, userId)
  },

  deleteUser: async (userId: string, deletedUserId: string, email: string) => {
    await logSystemAction({
      accion: 'delete_user',
      entidad: 'usuarios',
      entidad_id: deletedUserId,
      detalles: { email, deleted_by: userId },
    }, userId)
  },

  changeRole: async (userId: string, targetUserId: string, oldRole: string, newRole: string) => {
    await logSystemAction({
      accion: 'change_role',
      entidad: 'usuarios',
      entidad_id: targetUserId,
      detalles: { old_role: oldRole, new_role: newRole, changed_by: userId },
    }, userId)
  },

  createJoven: async (userId: string, jovenId: string, nombre: string) => {
    await logSystemAction({
      accion: 'create_joven',
      entidad: 'jovenes',
      entidad_id: jovenId,
      detalles: { nombre, created_by: userId },
    }, userId)
  },

  updateJoven: async (userId: string, jovenId: string, changes: Record<string, any>) => {
    await logSystemAction({
      accion: 'update_joven',
      entidad: 'jovenes',
      entidad_id: jovenId,
      detalles: { changes, updated_by: userId },
    }, userId)
  },

  deleteJoven: async (userId: string, jovenId: string, nombre: string) => {
    await logSystemAction({
      accion: 'delete_joven',
      entidad: 'jovenes',
      entidad_id: jovenId,
      detalles: { nombre, deleted_by: userId },
    }, userId)
  },

  createAtencion: async (userId: string, atencionId: string, tipo: string) => {
    await logSystemAction({
      accion: 'create_atencion',
      entidad: 'atenciones',
      entidad_id: atencionId,
      detalles: { tipo, created_by: userId },
    }, userId)
  },

  updateAtencion: async (userId: string, atencionId: string, changes: Record<string, any>) => {
    await logSystemAction({
      accion: 'update_atencion',
      entidad: 'atenciones',
      entidad_id: atencionId,
      detalles: { changes, updated_by: userId },
    }, userId)
  },

  deleteAtencion: async (userId: string, atencionId: string) => {
    await logSystemAction({
      accion: 'delete_atencion',
      entidad: 'atenciones',
      entidad_id: atencionId,
      detalles: { deleted_by: userId },
    }, userId)
  },

  updatePermissions: async (userId: string, targetUserId: string, moduleId: string, permissions: Record<string, boolean>) => {
    await logSystemAction({
      accion: 'update_permissions',
      entidad: 'user_module_permissions',
      entidad_id: targetUserId,
      detalles: { module_id: moduleId, permissions, updated_by: userId },
    }, userId)
  },
}
