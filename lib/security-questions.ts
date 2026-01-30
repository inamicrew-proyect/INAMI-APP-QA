import { createHash } from 'crypto'

/**
 * Hashea una respuesta de pregunta secreta usando SHA-256
 * Las respuestas se normalizan (trim, lowercase) antes de hashear
 */
export function hashSecurityAnswer(answer: string): string {
  const normalized = answer.trim().toLowerCase()
  return createHash('sha256').update(normalized).digest('hex')
}

/**
 * Verifica si una respuesta coincide con el hash almacenado
 */
export function verifySecurityAnswer(answer: string, storedHash: string): boolean {
  const answerHash = hashSecurityAnswer(answer)
  return answerHash === storedHash
}

/**
 * Preguntas predefinidas que los usuarios pueden elegir
 */
export const PREDEFINED_QUESTIONS = [
  '¿Cuál es el nombre de tu mascota favorita?',
  '¿En qué ciudad naciste?',
  '¿Cuál es el nombre de tu mejor amigo de la infancia?',
  '¿Cuál es el nombre de tu escuela primaria?',
  '¿Cuál es el nombre de tu película favorita?',
  '¿Cuál es el nombre de tu primer profesor?',
  '¿Cuál es el nombre de tu comida favorita?',
  '¿Cuál es el nombre de tu lugar de vacaciones favorito?',
] as const

export type SecurityQuestion = {
  id: string
  user_id: string
  question: string
  answer_hash: string
  question_order: number
  created_at: string
  updated_at: string
}

