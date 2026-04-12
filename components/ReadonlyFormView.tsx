'use client'

import React from 'react'
import { pruneFormularioData, labelFromKey } from '@/lib/formulario-utils'

type Path = Array<string | number>

interface ReadonlyFormViewProps {
  value: any
  hideEmpty?: boolean
  /** `document`: filas estilo ficha impresa; `grid`: rejilla editable-like (legacy). */
  layout?: 'document' | 'grid'
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
}

export default function ReadonlyFormView({
  value,
  hideEmpty = true,
  layout = 'document',
}: ReadonlyFormViewProps) {
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

  const renderLeaf = (val: any, path: Path): React.ReactNode => {
    const normalized = tryParseJsonString(val)
    const cleaned = hideEmpty ? pruneFormularioData(normalized) : normalized
    if (cleaned === null || cleaned === undefined) return null

    if (typeof cleaned === 'string' || typeof cleaned === 'number') {
      const textValue = String(cleaned)
      const currentKey = String(path[path.length - 1] ?? '').toLowerCase()
      const isLongText =
        textValue.length > 120 ||
        textValue.includes('\n') ||
        currentKey.includes('observ') ||
        currentKey.includes('descripcion') ||
        currentKey.includes('motivo') ||
        currentKey.includes('recomend')

      if (layout === 'document') {
        return (
          <div
            className={`text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words ${
              isLongText ? 'min-h-[4rem]' : ''
            }`}
          >
            {textValue || '—'}
          </div>
        )
      }

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
      if (layout === 'document') {
        return <span className="text-sm text-gray-900 dark:text-gray-100">{cleaned ? 'Sí' : 'No'}</span>
      }
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
        const text = cleaned.map((v) => (v === null ? '' : String(v))).join('\n')
        if (layout === 'document') {
          return (
            <div className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words min-h-[3rem]">
              {text || '—'}
            </div>
          )
        }
        return (
          <textarea
            readOnly
            value={text}
            className="input-field min-h-[120px] resize-y bg-gray-50 dark:bg-gray-800"
            rows={Math.min(8, Math.max(3, cleaned.length))}
          />
        )
      }
      return (
        <div className="space-y-4">
          {cleaned.map((item, idx) => (
            <div
              key={`${path.join('.')}-${idx}`}
              className="rounded-lg border border-stone-200 dark:border-gray-600 overflow-hidden bg-stone-50/40 dark:bg-gray-800/20"
            >
              <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 border-b border-stone-200 dark:border-gray-600 bg-white/80 dark:bg-gray-900/40">
                Bloque {idx + 1}
              </div>
              <div className="p-3">{renderValue(item, [...path, idx])}</div>
            </div>
          ))}
        </div>
      )
    }

    if (isPlainObject(cleaned)) {
      return renderValue(cleaned, path)
    }

    return null
  }

  const FieldRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="grid grid-cols-1 sm:grid-cols-12 gap-0 border-b border-stone-200 dark:border-gray-700 last:border-b-0">
      <div className="sm:col-span-4 bg-stone-100/90 dark:bg-gray-800/90 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 border-b sm:border-b-0 sm:border-r border-stone-200 dark:border-gray-700">
        {label}
      </div>
      <div className="sm:col-span-8 px-4 py-2.5 bg-white dark:bg-gray-900/30">{children}</div>
    </div>
  )

  const renderValue = (val: any, path: Path = []): React.ReactNode => {
    const normalized = tryParseJsonString(val)
    const cleaned = hideEmpty ? pruneFormularioData(normalized) : normalized

    if (cleaned === null || cleaned === undefined) return null

    if (!isPlainObject(cleaned) || Array.isArray(cleaned)) {
      return renderLeaf(cleaned, path)
    }

    if (layout === 'grid') {
      const entries = Object.entries(cleaned)
      if (entries.length === 0) return null
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {entries.map(([k, v]) => {
            const rendered = renderValue(v, [...path, k])
            if (!rendered) return null
            const isGroup = isPlainObject(v) && !Array.isArray(v)
            return isGroup ? (
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
          })}
        </div>
      )
    }

    // Document layout
    const entries = Object.entries(cleaned)
    if (entries.length === 0) return null

    const scalars: typeof entries = []
    const groups: typeof entries = []

    for (const pair of entries) {
      const v = pair[1]
      if (isPlainObject(v) && !Array.isArray(v)) {
        groups.push(pair)
      } else {
        scalars.push(pair)
      }
    }

    return (
      <div className="space-y-6">
        {scalars.length > 0 && (
          <div className="rounded-lg border border-stone-200 dark:border-gray-700 overflow-hidden shadow-sm">
            {scalars.map(([k, v]) => {
              const rendered = renderLeaf(v, [...path, k])
              if (!rendered) return null
              return <FieldRow key={[...path, k].join('.')} label={labelFromKey(k)} children={rendered} />
            })}
          </div>
        )}
        {groups.map(([k, v]) => {
          const rendered = renderValue(v, [...path, k])
          if (!rendered) return null
          return (
            <div key={[...path, k].join('.')} className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100 px-1">{labelFromKey(k)}</h4>
              {rendered}
            </div>
          )
        })}
      </div>
    )
  }

  const visible = hideEmpty ? pruneFormularioData(tryParseJsonString(value)) : tryParseJsonString(value)
  if (!visible || (typeof visible === 'object' && !Array.isArray(visible) && Object.keys(visible).length === 0)) {
    return <p className="text-sm text-gray-500">Sin datos.</p>
  }

  if (layout === 'document') {
    return (
      <div className="max-w-4xl mx-auto rounded-xl border border-stone-200 dark:border-gray-700 bg-stone-50/50 dark:bg-gray-900/40 p-4 sm:p-6 shadow-inner">
        {renderValue(visible)}
      </div>
    )
  }

  return <>{renderValue(visible)}</>
}
