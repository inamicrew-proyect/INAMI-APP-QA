import { z } from 'zod'

const normalizeWhitespace = (value: string) => value.replace(/\s+/g, ' ').trim()

const optionalLongString = (max = 3000) =>
  z.preprocess((val) => {
    if (typeof val !== 'string') return val
    const trimmed = normalizeWhitespace(val)
    return trimmed === '' ? undefined : trimmed
  }, z.string().max(max).optional())

const datetimeLocalSchema = z
  .string()
  .min(1, { message: 'La fecha de atención es obligatoria.' })
  .refine((value) => !Number.isNaN(new Date(value).getTime()), {
    message: 'La fecha de atención no es válida.',
  })

const dateSchema = z
  .string()
  .optional()
  .transform((value) => {
    if (!value) return undefined
    if (Number.isNaN(Date.parse(value))) {
      throw new z.ZodError([
        {
          code: z.ZodIssueCode.custom,
          message: 'La próxima cita no es válida.',
          path: ['proxima_cita'],
        },
      ])
    }
    return value
  })

export const atencionCreateSchema = z
  .object({
    joven_id: z
      .string()
      .min(1, { message: 'Debe seleccionar un joven.' })
      .uuid({ message: 'Selección de joven inválida.' }),
    tipo_atencion_id: z
      .string()
      .min(1, { message: 'Debe seleccionar un tipo de atención.' })
      .uuid({ message: 'Selección de tipo de atención inválida.' }),
    fecha_atencion: datetimeLocalSchema,
    motivo: z
      .string()
      .min(1, { message: 'El motivo es obligatorio.' })
      .min(10, { message: 'El motivo debe tener al menos 10 caracteres.' })
      .max(2000, { message: 'El motivo no puede exceder 2000 caracteres.' })
      .transform(normalizeWhitespace),
    observaciones: optionalLongString(),
    recomendaciones: optionalLongString(),
    proxima_cita: dateSchema,
    estado: z.enum(['pendiente', 'en_proceso', 'completada', 'cancelada'], {
      message: 'Debe seleccionar el estado de la atención.',
    }),
  })
  .superRefine((data, ctx) => {
    if (data.proxima_cita) {
      const fechaAtencion = new Date(data.fecha_atencion)
      const proxima = new Date(`${data.proxima_cita}T00:00:00`)
      if (proxima < fechaAtencion) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['proxima_cita'],
          message: 'La próxima cita debe ser posterior o igual a la fecha de atención.',
        })
      }
    }
  })

export type AtencionCreateInput = z.infer<typeof atencionCreateSchema>

