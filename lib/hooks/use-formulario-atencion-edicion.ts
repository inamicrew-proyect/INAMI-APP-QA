'use client'

import { useEffect, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@/lib/supabase-browser'

type SetFormDataFn<T> = Dispatch<SetStateAction<T>>

/**
 * Carga `datos_json` desde `formularios_atencion` cuando la URL trae `?atencion_id=`.
 * Usar en formularios que guardan con el mismo `tipo_formulario`.
 */
export function useFormularioAtencionEdicion<T extends object>({
  tipoFormulario,
  setFormData,
}: {
  tipoFormulario: string
  setFormData: SetFormDataFn<T>
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClientComponentClient()
  const atencionIdEdicion = searchParams.get('atencion_id')
  const isEditMode = Boolean(atencionIdEdicion)
  const [loadingExisting, setLoadingExisting] = useState(false)
  /**
   * null = pendiente de resolver solo si hay `atencion_id` en URL.
   * Sin `atencion_id`, false desde el primer render (evita estado “colgado” y errores de hidratación).
   */
  const [fichaEncontrada, setFichaEncontrada] = useState<boolean | null>(() =>
    searchParams.get('atencion_id') ? null : false
  )

  useEffect(() => {
    const load = async () => {
      if (!atencionIdEdicion) {
        setFichaEncontrada(false)
        setLoadingExisting(false)
        return
      }

      try {
        setLoadingExisting(true)
        setFichaEncontrada(null)
        const { data, error } = await supabase
          .from('formularios_atencion')
          .select('datos_json, joven_id')
          .eq('atencion_id', atencionIdEdicion)
          .eq('tipo_formulario', tipoFormulario)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (error) throw new Error(error.message)

        if (!data?.datos_json) {
          setFichaEncontrada(false)
          return
        }

        const datos = data.datos_json as Partial<T> & { joven_id?: string }
        setFormData((prev) => {
          const prevJoven = (prev as { joven_id?: string }).joven_id
          return {
            ...prev,
            ...datos,
            joven_id: datos.joven_id || data.joven_id || prevJoven,
          } as T
        })
        setFichaEncontrada(true)
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Error desconocido'
        alert(`Error al cargar la ficha para edición: ${msg}`)
        router.push(`/dashboard/atenciones/${atencionIdEdicion}`)
      } finally {
        setLoadingExisting(false)
      }
    }

    void load()
  }, [atencionIdEdicion, tipoFormulario, supabase, router, setFormData])

  return { isEditMode, atencionIdEdicion, loadingExisting, fichaEncontrada }
}
