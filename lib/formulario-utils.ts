export type JsonValue = string | number | boolean | null | JsonObject | JsonArray
export interface JsonObject { [key: string]: JsonValue }
export type JsonArray = JsonValue[]

// Elimina valores vacíos/por defecto para mostrar solo respuestas reales
export function pruneFormularioData<T = any>(value: T): T | undefined {
	if (value === null || value === undefined) return undefined as any

	if (typeof value === 'string') {
		return (value.trim() === '' ? undefined : (value as any))
	}

	if (typeof value === 'number') {
		return (value === 0 ? undefined : (value as any))
	}

	if (typeof value === 'boolean') {
		return (value ? (true as any) : undefined)
	}

	if (Array.isArray(value)) {
		const cleaned = value
			.map((item) => pruneFormularioData(item))
			.filter((item) => item !== undefined) as any[]
		return (cleaned.length > 0 ? (cleaned as any) : undefined) as any
	}

	if (typeof value === 'object') {
		const entries = Object.entries(value as any)
			.map(([k, v]) => [k, pruneFormularioData(v)] as const)
			.filter(([, v]) => v !== undefined)
		return (entries.length > 0 ? Object.fromEntries(entries) : undefined) as any
	}

	return value as any
}

// Filtra llaves permitidas (según esquema del tipo de atención)
export function filterFormularioByKeys<T extends Record<string, any>>(
	formulario: T,
	allowedKeys?: string[]
): Partial<T> {
	if (!formulario || typeof formulario !== 'object' || Array.isArray(formulario)) return {}
	if (!allowedKeys || allowedKeys.length === 0) return formulario

	const result: Partial<T> = {}
	for (const key of allowedKeys) {
		if (key in formulario) {
			;(result as any)[key] = (formulario as any)[key]
		}
	}
	return result
}

// Etiqueta legible desde una key en snake_case
export function labelFromKey(key: string): string {
	return key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
}

export type RoleKey =
	| 'medico'
	| 'psicologo'
	| 'trabajador_social'
	| 'abogado'
	| 'pedagogo'
	| 'seguridad'

export const formularioFieldsByRole: Record<RoleKey, string[]> = {
	medico: ['historia_clinica', 'examen_fisico', 'diagnostico', 'tratamiento'],
	psicologo: ['evaluacion_psicologica', 'diagnostico_psicologico', 'recomendaciones_terapeuticas'],
	trabajador_social: ['evaluacion_social', 'situacion_familiar', 'recursos_disponibles'],
	abogado: ['situacion_legal', 'proceso_judicial', 'derechos_menor'],
	pedagogo: ['evaluacion_educativa', 'plan_estudios', 'necesidades_educativas'],
	seguridad: ['registro_ingreso', 'medidas_seguridad'],
}

