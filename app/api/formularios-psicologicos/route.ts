import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// GET - Obtener formularios psicológicos
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const jovenId = searchParams.get('joven_id')
    const tipoFormulario = searchParams.get('tipo_formulario')
    const formularioId = searchParams.get('id')

    // Verificar autenticación
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    let query = supabase
      .from('formularios_psicologicos')
      .select('*')
      .order('fecha_creacion', { ascending: false })

    // Filtrar por ID específico
    if (formularioId) {
      query = query.eq('id', formularioId).single()
    } else {
      // Filtrar por joven_id
      if (jovenId) {
        query = query.eq('joven_id', jovenId)
      }

      // Filtrar por tipo de formulario
      if (tipoFormulario) {
        query = query.eq('tipo_formulario', tipoFormulario)
      }
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching formularios:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error in GET /api/formularios-psicologicos:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo formulario psicológico
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()

    // Verificar autenticación
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { joven_id, tipo_formulario, datos_json } = body

    // Validaciones con mensajes más específicos
    if (!joven_id || (typeof joven_id === 'string' && joven_id.trim() === '')) {
      console.error('Error: joven_id faltante o vacío', { joven_id, body_keys: Object.keys(body) })
      return NextResponse.json(
        { error: 'Faltan campos requeridos: joven_id es requerido' },
        { status: 400 }
      )
    }

    if (!tipo_formulario || (typeof tipo_formulario === 'string' && tipo_formulario.trim() === '')) {
      console.error('Error: tipo_formulario faltante o vacío', { tipo_formulario, body_keys: Object.keys(body) })
      return NextResponse.json(
        { error: 'Faltan campos requeridos: tipo_formulario es requerido' },
        { status: 400 }
      )
    }

    if (!datos_json || typeof datos_json !== 'object' || Object.keys(datos_json).length === 0) {
      console.error('Error: datos_json faltante o vacío', { datos_json, body_keys: Object.keys(body) })
      return NextResponse.json(
        { error: 'Faltan campos requeridos: datos_json es requerido y no puede estar vacío' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('formularios_psicologicos')
      .insert({
        joven_id,
        tipo_formulario,
        datos_json,
        fecha_creacion: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating formulario:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/formularios-psicologicos:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar formulario psicológico existente
export async function PUT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()

    // Verificar autenticación
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id, datos_json } = body

    // Validaciones
    if (!id || !datos_json) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: id, datos_json' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('formularios_psicologicos')
      .update({
        datos_json,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating formulario:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error in PUT /api/formularios-psicologicos:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar formulario psicológico
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    // Verificar autenticación
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!id) {
      return NextResponse.json(
        { error: 'Se requiere el parámetro id' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('formularios_psicologicos')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting formulario:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Formulario eliminado exitosamente' })
  } catch (error) {
    console.error('Error in DELETE /api/formularios-psicologicos:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
