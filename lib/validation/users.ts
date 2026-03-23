import { z } from 'zod'

export const USER_ROLES = [
  'admin',
  'pedagogo',
  'abogado',
  'medico',
  'psicologo',
  'trabajador_social',
  'seguridad',
] as const

const NAME_MAX_LENGTH = 120
const EMAIL_MAX_LENGTH = 160
const PASSWORD_MAX_LENGTH = 128
const PHOTO_URL_MAX_LENGTH = 2048

const allowedEmailDomains =
  process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS?.split(',')
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean) ?? []

const normalizeWhitespace = (value: string) => value.replace(/\s+/g, ' ').trim()

const fullNameSchema = z
  .string()
  .min(1, { message: 'El nombre completo es obligatorio.' })
  .trim()
  .min(3, { message: 'El nombre completo debe tener al menos 3 caracteres.' })
  .max(NAME_MAX_LENGTH, {
    message: `El nombre completo no puede exceder ${NAME_MAX_LENGTH} caracteres.`,
  })
  .transform(normalizeWhitespace)

const emailSchema = z
  .string()
  .min(1, { message: 'El correo electrónico es obligatorio.' })
  .trim()
  .min(1, { message: 'El correo electrónico es obligatorio.' })
  .max(EMAIL_MAX_LENGTH, {
    message: `El correo electrónico no puede exceder ${EMAIL_MAX_LENGTH} caracteres.`,
  })
  .toLowerCase()
  .email({ message: 'El correo electrónico no es válido.' })
  .refine(
    (value) => {
      if (allowedEmailDomains.length === 0) return true
      return allowedEmailDomains.some((domain) => value.endsWith(`@${domain}`))
    },
    {
      message:
        allowedEmailDomains.length === 1
          ? `El correo debe pertenecer al dominio @${allowedEmailDomains[0]}.`
          : `El correo debe pertenecer a alguno de los siguientes dominios: ${allowedEmailDomains
              .map((domain) => `@${domain}`)
              .join(', ')}`,
    }
  )

// La contraseña no se recorta (.trim()); se permiten espacios.
export const passwordSchema = z
  .string()
  .min(1, { message: 'La contraseña temporal es obligatoria.' })
  .min(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
  .max(PASSWORD_MAX_LENGTH, {
    message: `La contraseña no puede exceder ${PASSWORD_MAX_LENGTH} caracteres.`,
  })
  .refine((value) => !/\s/.test(value), {
    message: 'La contraseña no puede contener espacios.',
  })
  .regex(/[A-Z]/, { message: 'La contraseña debe incluir al menos una letra mayúscula.' })
  .regex(/[a-z]/, { message: 'La contraseña debe incluir al menos una letra minúscula.' })
  .regex(/\d/, { message: 'La contraseña debe incluir al menos un número.' })
  .regex(/[^A-Za-z0-9\s]|\s/, {
    message: 'La contraseña debe incluir al menos un caracter especial (símbolos y/o espacios permitidos).',
  })

const photoUrlSchema = z
  .string()
  .trim()
  .url({ message: 'La URL de la foto no es válida.' })
  .max(PHOTO_URL_MAX_LENGTH, {
    message: `La URL de la foto no puede exceder ${PHOTO_URL_MAX_LENGTH} caracteres.`,
  })
  .optional()
  .nullable()

// Validación de rol: acepta cualquier string no vacío
// La validación real se hace en el backend verificando que existe en la tabla roles
const roleSchema = z.string()
  .min(1, { message: 'Debe seleccionar un rol válido.' })
  .trim()

const userBaseSchema = z.object({
  fullName: fullNameSchema,
  email: emailSchema,
  role: roleSchema,
})

export const userCreateSchema = userBaseSchema.extend({
  password: passwordSchema,
  photoUrl: photoUrlSchema,
})

export const userUpdateSchema = userBaseSchema
  .omit({ email: true })
  .extend({
  photoUrl: photoUrlSchema,
})

/** Estados de cuenta gestionados por administradores */
export const ACCOUNT_STATUSES = ['activo', 'inactivo', 'bloqueado'] as const
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number]

export const accountStatusSchema = z.enum(ACCOUNT_STATUSES, {
  message: 'El estado de cuenta no es válido.',
})

/** Campos opcionales solo para administradores al editar otro usuario */
export const adminUserExtraSchema = z.object({
  accountStatus: accountStatusSchema.optional(),
  password: passwordSchema.optional(),
})

export type UserCreateInput = z.infer<typeof userCreateSchema>
export type UserUpdateInput = z.infer<typeof userUpdateSchema>

