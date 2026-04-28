import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, estadoVigencia } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

type EquipoEntry = {
  codigo_equipo: string
  evaluacion: Record<string, string>
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const { equipos, fecha_salida, empresa, os, observaciones } = body as {
    equipos: EquipoEntry[]
    fecha_salida: string
    empresa: string
    os: string
    observaciones?: string
  }

  if (!equipos || equipos.length === 0 || !fecha_salida || !empresa || !os)
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })

  const db = supabaseAdmin()

  // Validar cada equipo antes de insertar
  for (const item of equipos) {
    const { data: equipo } = await db.from('equipos')
      .select('estado, fecha_proxima_calibracion, codigo')
      .eq('codigo', item.codigo_equipo).single()

    if (!equipo)
      return NextResponse.json({ error: `Equipo ${item.codigo_equipo} no encontrado` }, { status: 404 })

    if (equipo.estado !== 'disponible') {
      const msgs: Record<string, string> = {
        en_campo: `${item.codigo_equipo}: ya tiene salida abierta (Regla 3)`,
        en_calibracion: `${item.codigo_equipo}: en calibración (Regla 1)`,
        fuera_servicio: `${item.codigo_equipo}: fuera de servicio (Regla 1)`,
      }
      return NextResponse.json({ error: msgs[equipo.estado] ?? `${item.codigo_equipo}: no disponible` }, { status: 409 })
    }

    if (estadoVigencia(equipo.fecha_proxima_calibracion) === 'vencido')
      return NextResponse.json({ error: `${item.codigo_equipo}: calibración vencida (Regla 1)` }, { status: 409 })
  }

  // Insertar todas las salidas con la misma OS
  const inserts = equipos.map(item => ({
    codigo_equipo: item.codigo_equipo,
    fecha_salida,
    cantidad_sale: '1',  // legacy field, hardcoded
    empresa,
    os,
    tecnico_id: session.id,
    observaciones,
    sal_enciende:           item.evaluacion?.enciende           ?? 'N/A',
    sal_indicacion_legible: item.evaluacion?.indicacion_legible ?? 'N/A',
    sal_bateria_cable:      item.evaluacion?.bateria_cable      ?? 'N/A',
    sal_variacion:          item.evaluacion?.variacion          ?? 'N/A',
    sal_calibracion_vigente:item.evaluacion?.calibracion_vigente?? 'N/A',
    sal_limpieza:           item.evaluacion?.limpieza           ?? 'N/A',
    sal_alteracion_sensor:  item.evaluacion?.alteracion_sensor  ?? 'N/A',
    sal_rayas:              item.evaluacion?.rayas              ?? 'N/A',
    sal_contaminacion:      item.evaluacion?.contaminacion      ?? 'N/A',
  }))

  const { data, error } = await db.from('salidas').insert(inserts).select()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Actualizar estado de cada equipo a en_campo
  for (const item of equipos) {
    await db.from('equipos').update({ estado: 'en_campo' }).eq('codigo', item.codigo_equipo)
  }

  return NextResponse.json({ ok: true, count: data?.length, salidas: data }, { status: 201 })
}

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const soloAbiertas = req.nextUrl.searchParams.get('abiertas') === 'true'
  const db = supabaseAdmin()
  const { data, error } = await db.from('salidas')
    .select('*, equipos(descripcion, es_pesa_patron, magnitud), usuarios(nombre), retornos(id)')
    .order('fecha_salida', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const result = soloAbiertas ? data.filter(s => !s.retornos || s.retornos.length === 0) : data
  return NextResponse.json({ salidas: result })
}
