/**
 * Añade useFormularioAtencionEdicion + guardado en modo edición a page.tsx que
 * insertan en formularios_atencion (patrón atención + ficha).
 * Excluye flujos con rpc('crear_formulario...') y páginas que ya cargan por atencion_id.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const formRoot = path.join(__dirname, '..', 'app', 'dashboard', '(principal)', 'atenciones', 'formularios')

const HOOK_IMPORT = `import { useFormularioAtencionEdicion } from '@/lib/hooks/use-formulario-atencion-edicion'
import { actualizarAtencionYFormularioJson } from '@/lib/formulario-atencion-update'
`

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p, acc)
    else if (e.name === 'page.tsx') acc.push(p)
  }
  return acc
}

function relToFormularios(fullPath) {
  const norm = fullPath.replace(/\\/g, '/')
  const i = norm.indexOf('/formularios/')
  return i === -1 ? '' : norm.slice(i + '/formularios/'.length)
}

function extractTipoFormulario(content) {
  const re = /tipo_formulario:\s*'([^']+)'/g
  let m
  let last = null
  while ((m = re.exec(content)) !== null) last = m[1]
  return last
}

function findUseStateFormDataClose(content) {
  const re = /const \[formData, setFormData\] = useState(?:<([^>]+)>)?\(/g
  const m = re.exec(content)
  if (!m) return null
  const openParen = m.index + m[0].length - 1
  let depth = 0
  for (let j = openParen; j < content.length; j++) {
    const c = content[j]
    if (c === '(') depth++
    else if (c === ')') {
      depth--
      if (depth === 0) return { insertPos: j + 1, generic: m[1] || 'FormData' }
    }
  }
  return null
}

function injectHookAfterFormState(content, tipo, genericName) {
  const found = findUseStateFormDataClose(content)
  if (!found) return null
  const { insertPos, generic } = found
  const block = `

  const { atencionIdEdicion, loadingExisting, fichaEncontrada } = useFormularioAtencionEdicion<${genericName}>({
    tipoFormulario: '${tipo}',
    setFormData,
  })
`
  return content.slice(0, insertPos) + block + content.slice(insertPos)
}

function injectLoadingGuard(content) {
  if (content.includes('if (loadingExisting)')) return content
  const needle = /\n  return \(\n    <div/m
  const m = needle.exec(content)
  if (!m) {
    console.warn('  no return anchor')
    return content
  }
  const idx = m.index
  const guard = `
  if (loadingExisting) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }
`
  return content.slice(0, idx) + guard + content.slice(idx)
}

function injectSaveBeforeFormulariosInsert(content, tipo) {
  const marker = '\n      // Guardar en formularios_atencion'
  const idx = content.indexOf(marker)
  if (idx === -1) {
    const alt = content.indexOf("\n      const { error: insertError } = await supabase\n        .from('formularios_atencion')")
    if (alt === -1) return null
    const block = `
      if (atencionIdEdicion && fichaEncontrada === true && tipoAtencionId) {
        await actualizarAtencionYFormularioJson(supabase, {
          atencionId: atencionIdEdicion,
          tipoFormulario: '${tipo}',
          jovenId: formData.joven_id,
          tipoAtencionId: tipoAtencionId,
          datosJson: datosJson as Record<string, unknown>,
        })
        alert('Ficha actualizada exitosamente')
        router.push(\`/dashboard/atenciones/\${atencionIdEdicion}\`)
        return
      }
`
    return content.slice(0, alt) + block + content.slice(alt)
  }
  const block = `
      if (atencionIdEdicion && fichaEncontrada === true && tipoAtencionId) {
        await actualizarAtencionYFormularioJson(supabase, {
          atencionId: atencionIdEdicion,
          tipoFormulario: '${tipo}',
          jovenId: formData.joven_id,
          tipoAtencionId: tipoAtencionId,
          datosJson: datosJson as Record<string, unknown>,
        })
        alert('Ficha actualizada exitosamente')
        router.push(\`/dashboard/atenciones/\${atencionIdEdicion}\`)
        return
      }

`
  return content.slice(0, idx) + block + content.slice(idx)
}

function ensureHookImports(content) {
  if (content.includes('useFormularioAtencionEdicion')) return content
  return content.replace(/^('use client'\s*\n)/, `$1${HOOK_IMPORT}`)
}

function processFile(filePath) {
  let s = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n')
  if (!s.includes("from('formularios_atencion')")) return false
  if (!s.includes('.insert(')) return false
  if (s.includes("rpc('crear_formulario")) return false
  if (s.includes('searchParams.get(\'atencion_id\')')) return false
  if (s.includes('useFormularioAtencionEdicion')) return false

  const tipo = extractTipoFormulario(s)
  if (!tipo) {
    console.warn('no tipo', relToFormularios(filePath))
    return false
  }

  const st = findUseStateFormDataClose(s)
  if (!st) {
    console.warn('no formData useState', relToFormularios(filePath))
    return false
  }
  if (!s.includes('const datosJson')) {
    console.warn('no datosJson before insert', relToFormularios(filePath))
    return false
  }

  let next = ensureHookImports(s)
  const hooked = injectHookAfterFormState(next, tipo, st.generic)
  if (!hooked) return false
  next = hooked
  next = injectLoadingGuard(next)
  const saved = injectSaveBeforeFormulariosInsert(next, tipo)
  if (!saved) {
    console.warn('save inject failed', relToFormularios(filePath))
    return false
  }
  next = saved

  if (next !== s) {
    fs.writeFileSync(filePath, next)
    return true
  }
  return false
}

let n = 0
for (const p of walk(formRoot)) {
  try {
    if (processFile(p)) {
      console.log('patched', relToFormularios(p))
      n++
    }
  } catch (e) {
    console.error('FAIL', p, e)
  }
}
console.log('total', n)
