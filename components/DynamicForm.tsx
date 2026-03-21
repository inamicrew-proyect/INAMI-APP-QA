'use client'

import React from 'react'
import { pruneFormularioData, labelFromKey } from '@/lib/formulario-utils'

type Path = Array<string | number>

export interface DynamicFormProps {
  value: any
  onChange: (next: any) => void
  hideEmpty?: boolean
}

export default function DynamicForm({ value, onChange, hideEmpty = true }: DynamicFormProps) {
  const updateField = (path: Path, nextValue: any) => {
    const current = value || {}
    const cloned = structuredClone(current)

    let ref: any = cloned
    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i]
      if (typeof ref[key] !== 'object' || ref[key] === null) {
        ref[key] = typeof path[i + 1] === 'number' ? [] : {}
      }
      ref = ref[key]
    }
    ref[path[path.length - 1]] = nextValue

    onChange(cloned)
  }

  const renderFields = (data: any, path: Path = []): React.ReactNode => {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return null

    return Object.entries(data).map(([key, rawValue]) => {
      const fieldPath = [...path, key]
      const fieldId = fieldPath.join('.')
      const label = labelFromKey(key)
      const value = rawValue as any

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        return (
          <div key={fieldId} className="rounded-lg border border-gray-200 p-4 space-y-4">
            <h4 className="text-sm font-semibold text-gray-800">{label}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{renderFields(value, fieldPath)}</div>
          </div>
        )
      }

      if (typeof value === 'boolean') {
        return (
          <div key={fieldId} className="flex items-center gap-3">
            <input
              id={fieldId}
              type="checkbox"
              checked={value}
              onChange={(e) => updateField(fieldPath, e.target.checked)}
              className="h-4 w-4"
            />
            <label htmlFor={fieldId} className="text-sm font-medium text-gray-700">
              {label}
            </label>
          </div>
        )
      }

      if (Array.isArray(value)) {
        const hasObjectItems = value.some((item) => item && typeof item === 'object' && !Array.isArray(item))
        const hasPrimitiveItems = value.every(
          (item) => item === null || ['string', 'number', 'boolean'].includes(typeof item)
        )

        return (
          <div key={fieldId} className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>

            {value.length === 0 && <p className="text-sm text-gray-500">Sin elementos.</p>}

            {hasObjectItems && (
              <div className="space-y-3">
                {value.map((item, index) => (
                  <div key={`${fieldId}-${index}`} className="rounded-lg border border-gray-200 p-3">
                    <p className="text-xs font-semibold text-gray-500 mb-2">Elemento {index + 1}</p>
                    {item && typeof item === 'object' && !Array.isArray(item) ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {renderFields(item, [...fieldPath, index])}
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={item ?? ''}
                        onChange={(e) => updateField([...fieldPath, index], e.target.value)}
                        className="input-field"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {!hasObjectItems && hasPrimitiveItems && (
              <textarea
                id={fieldId}
                value={value.map((item) => (item ?? '').toString()).join('\n')}
                onChange={(e) => {
                  const lines = e.target.value
                    .split('\n')
                    .map((line) => line.trim())
                    .filter((line) => line.length > 0)
                  updateField(fieldPath, lines)
                }}
                className="input-field"
                rows={4}
                placeholder="Un valor por línea"
              />
            )}
          </div>
        )
      }

      const isLongText =
        typeof value === 'string' &&
        (value.length > 120 || value.includes('\n') || key.includes('observ') || key.includes('descripcion'))

      if (isLongText) {
        return (
          <div key={fieldId} className="md:col-span-2">
            <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700 mb-2">
              {label}
            </label>
            <textarea
              id={fieldId}
              value={value ?? ''}
              onChange={(e) => updateField(fieldPath, e.target.value)}
              className="input-field"
              rows={4}
            />
          </div>
        )
      }

      return (
        <div key={fieldId}>
          <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700 mb-2">
            {label}
          </label>
          <input
            id={fieldId}
            type={typeof value === 'number' ? 'number' : 'text'}
            value={value ?? ''}
            onChange={(e) => updateField(fieldPath, typeof value === 'number' ? Number(e.target.value || 0) : e.target.value)}
            className="input-field"
          />
        </div>
      )
    })
  }

  const visible = hideEmpty ? pruneFormularioData(value) : value

  if (!visible || (typeof visible === 'object' && !Array.isArray(visible) && Object.keys(visible).length === 0)) {
    return <p className="text-sm text-gray-500">No hay datos específicos para este formulario.</p>
  }

  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{renderFields(visible)}</div>
}

