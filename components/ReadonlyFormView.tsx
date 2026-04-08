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
      const currentKey = String(path[path.length - 1] ?? '').toLowerCase()
      const textValue = String(cleaned)
      const isLongText =
        textValue.length > 120 ||
        textValue.includes('\n') ||
        currentKey.includes('observ') ||
        currentKey.includes('descripcion') ||
        currentKey.includes('motivo') ||
        currentKey.includes('recomend')

      if (isLongText) {
        return (
          <textarea
            value={textValue}
            readOnly
            className="input-field min-h-[120px] resize-y bg-gray-50 dark:bg-gray-800"
            rows={4}
          />
        )
      }

      return (
        <input
          type={typeof cleaned === 'number' ? 'number' : 'text'}
          value={textValue}
          readOnly
          className="input-field bg-gray-50 dark:bg-gray-800"
        />
      )
    }

    if (typeof cleaned === 'boolean') {
      return (
        <div className="flex items-center gap-3 h-10">
          <input type="checkbox" checked={cleaned} readOnly className="h-4 w-4 accent-primary-600" />
          <span className="text-sm text-gray-700 dark:text-gray-300">{cleaned ? 'Sí' : 'No'}</span>
        </div>
      )
    }

    if (Array.isArray(cleaned)) {
      if (cleaned.length === 0) return null
      const allPrimitives = cleaned.every(
        (i) => i === null || ['string', 'number', 'boolean'].includes(typeof i)
      )
      if (allPrimitives) {
        return (
          <textarea
            readOnly
            value={cleaned.map((v) => (v === null ? '' : String(v))).join('\n')}
            className="input-field min-h-[120px] resize-y bg-gray-50 dark:bg-gray-800"
            rows={Math.min(8, Math.max(3, cleaned.length))}
          />
        )
      }
      // Objetos
      return (
        <div className="space-y-3">
          {cleaned.map((item, idx) => (
            <div key={`${path.join('.')}-${idx}`} className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-gray-900">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Elemento {idx + 1}</p>
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
            const isGroup = typeof v === 'object' && v !== null && !Array.isArray(v)
            return (
              isGroup ? (
                <div
                  key={[...path, k].join('.')}
                  className="md:col-span-2 rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-gray-50/60 dark:bg-gray-800/30 space-y-4"
                >
                  <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{labelFromKey(k)}</h4>
                  {rendered}
                </div>
              ) : (
                <div key={[...path, k].join('.')}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {labelFromKey(k)}
                  </label>
                  {rendered}
                </div>
              )
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

