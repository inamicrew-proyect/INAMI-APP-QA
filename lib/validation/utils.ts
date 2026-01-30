import type { ZodError } from 'zod'

export function formatZodErrors(error: ZodError | undefined | null): string[] {
  if (!error || !error.issues || !Array.isArray(error.issues)) {
    return ['Datos inválidos.']
  }
  
  return error.issues.map((issue) => {
    if (issue.message) return issue.message
    if (issue.path && issue.path.length > 0) {
      return `Campo ${issue.path.join('.')} inválido.`
    }
    return 'Datos inválidos.'
  })
}

export function zodErrorToFieldErrors(error: ZodError) {
  const { fieldErrors } = error.flatten()
  const result: Record<string, string> = {}

  for (const [field, messages] of Object.entries(fieldErrors)) {
    if (Array.isArray(messages) && messages.length > 0) {
      result[field] = messages[0] as string
    }
  }

  return result
}

