import { z } from 'zod'

const NAME_MAX_LENGTH = 120
const ADDRESS_MAX_LENGTH = 200
const OBSERVACIONES_MAX_LENGTH = 2000
const MEDIDA_MAX_LENGTH = 200
const EXPEDIENTE_MAX_LENGTH = 60
const PHONE_REGEX = /^\+?[0-9\s-]{8,20}$/
const IDENTIDAD_REGEX = /^(\d{4}-\d{4}-\d{5}|\d{13})$/

const normalizeWhitespace = (value: string) => value.replace(/\s+/g, ' ').trim()

const preprocessTrim = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((val) => {
    if (typeof val !== 'string') return val
    const trimmed = normalizeWhitespace(val)
    return trimmed === '' ? undefined : trimmed
  }, schema)

const requiredNameSchema = (field: string) =>
  z
    .string()
    .min(1, { message: `El campo ${field} es obligatorio.` })
    .min(2, { message: `El campo ${field} debe tener al menos 2 caracteres.` })
    .max(NAME_MAX_LENGTH, {
      message: `El campo ${field} no puede exceder ${NAME_MAX_LENGTH} caracteres.`,
    })
    .transform(normalizeWhitespace)

const optionalStringSchema = (max = ADDRESS_MAX_LENGTH) =>
  preprocessTrim(
    z
      .string()
      .max(max, { message: `No puede superar ${max} caracteres.` })
      .optional()
  )

const optionalPhoneSchema = preprocessTrim(
  z
    .string()
    .regex(PHONE_REGEX, {
      message: 'Número telefónico inválido. Use solo dígitos, espacios, guiones y puede iniciar con +.',
    })
    .optional()
)

const optionalIdentidadSchema = preprocessTrim(
  z
    .string()
    .regex(IDENTIDAD_REGEX, {
      message: 'La identidad debe tener 13 dígitos o el formato ####-####-#####.',
    })
    .optional()
)

const dateSchema = z
  .string()
  .min(1, { message: 'La fecha es obligatoria.' })
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    message: 'La fecha no es válida.',
  })

const jovenBaseFields = {
  nombres: requiredNameSchema('nombres'),
  apellidos: requiredNameSchema('apellidos'),
  fecha_nacimiento: dateSchema,
  identidad: optionalIdentidadSchema,
  sexo: z.enum(['Masculino', 'Femenino'], {
    message: 'Debe seleccionar el sexo.',
  }),
  direccion: optionalStringSchema(),
  telefono: optionalPhoneSchema,
  nombre_contacto_emergencia: optionalStringSchema(NAME_MAX_LENGTH),
  telefono_emergencia: optionalPhoneSchema,
  centro_id: z
    .string()
    .min(1, { message: 'Debe seleccionar un centro.' })
    .uuid({ message: 'Centro inválido.' }),
  fecha_ingreso: dateSchema,
  medida_aplicada: optionalStringSchema(MEDIDA_MAX_LENGTH),
  delito_infraccion: optionalStringSchema(MEDIDA_MAX_LENGTH),
  observaciones: optionalStringSchema(OBSERVACIONES_MAX_LENGTH),
  foto_url: optionalStringSchema(2048),
} as const

const temporalConsistency = (data: { fecha_nacimiento: string; fecha_ingreso: string }, ctx: z.RefinementCtx) => {
    const birth = new Date(`${data.fecha_nacimiento}T00:00:00`)
    const ingreso = new Date(`${data.fecha_ingreso}T00:00:00`)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (birth >= today) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['fecha_nacimiento'],
        message: 'La fecha de nacimiento debe ser anterior a hoy.',
      })
    }

    if (ingreso > today) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['fecha_ingreso'],
        message: 'La fecha de ingreso no puede estar en el futuro.',
      })
    }

  if (ingreso <= birth) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['fecha_ingreso'],
      message: 'La fecha de ingreso debe ser posterior a la fecha de nacimiento.',
    })
  }
}

export const jovenCreateSchema = z.object(jovenBaseFields).superRefine(temporalConsistency)

export const jovenUpdateSchema = z
  .object({
    ...jovenBaseFields,
    estado: z.enum(['activo', 'egresado', 'transferido'], {
      message: 'Debe seleccionar el estado.',
    }),
    expediente_administrativo: optionalStringSchema(EXPEDIENTE_MAX_LENGTH),
    expediente_judicial: optionalStringSchema(EXPEDIENTE_MAX_LENGTH),
  })
  .superRefine(temporalConsistency)

export type JovenCreateInput = z.infer<typeof jovenCreateSchema>
export type JovenUpdateInput = z.infer<typeof jovenUpdateSchema>

export function calculateAgeFromBirth(fechaNacimiento: string) {
  const birthDate = new Date(`${fechaNacimiento}T00:00:00`)
  const today = new Date()

  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }

  return age
}

