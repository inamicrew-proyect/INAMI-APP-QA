'use client'

import React from 'react'
import { pruneFormularioData, labelFromKey } from '@/lib/formulario-utils'

type Path = Array<string | number>

interface ReadonlyFormViewProps {
  value: any
  hideEmpty?: boolean
}

export default function ReadonlyFormView({ value, hideEmpty = true }: ReadonlyFormViewProps) {
  const tryParseJsonString = (val: any) => {
    if (typeof val !== 'string') return val
    const trimmed = val.trim()
    if (
      (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))
    ) {
      try {
        return JSON.parse(trimmed)
      } catch {
        return val
      }
    }
    return val
  }

  const renderValue = (val: any, path: Path = []): React.ReactNode => {
    const normalized = tryParseJsonString(val)
    const cleaned = hideEmpty ? pruneFormularioData(normalized) : normalized

    if (cleaned === null || cleaned === undefined) return null

    if (typeof cleaned === 'string' || typeof cleaned === 'number') {
      return <p className="text-gray-900 dark:text-gray-100">{String(cleaned)}</p>
    }
    if (typeof cleaned === 'boolean') {
      return <p className="text-gray-900 dark:text-gray-100">{cleaned ? 'Sí' : 'No'}</p>
    }

    if (Array.isArray(cleaned)) {
      if (cleaned.length === 0) return null
      const allPrimitives = cleaned.every(
        (i) => i === null || ['string', 'number', 'boolean'].includes(typeof i)
      )
      if (allPrimitives) {
        return (
          <ul className="list-disc list-inside text-gray-900 dark:text-gray-100 space-y-1">
            {cleaned.map((v, idx) => (
              <li key={`${path.join('.')}-${idx}`}>{String(v)}</li>
            ))}
          </ul>
        )
      }
      // Objetos
      return (
        <div className="space-y-3">
          {cleaned.map((item, idx) => (
            <div key={`${path.join('.')}-${idx}`} className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
              {renderValue(item, [...path, idx])}
            </div>
          ))}
        </div>
      )
    }

    if (typeof cleaned === 'object') {
      const entries = Object.entries(cleaned)
      if (entries.length === 0) return null
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {entries.map(([k, v]) => {
            const rendered = renderValue(v, [...path, k])
            if (!rendered) return null
            return (
              <div key={[...path, k].join('.')}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {labelFromKey(k)}
                </label>
                {rendered}
              </div>
            )
          })}
        </div>
      )
    }

    return null
  }

  const visible = hideEmpty ? pruneFormularioData(tryParseJsonString(value)) : tryParseJsonString(value)
  if (!visible || (typeof visible === 'object' && !Array.isArray(visible) && Object.keys(visible).length === 0)) {
    return <p className="text-sm text-gray-500">Sin datos.</p>
  }
  return <>{renderValue(visible)}</>
}

