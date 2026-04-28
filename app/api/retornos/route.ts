import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const { salida_id, fecha_retorno, cantidad_retornada, recibido_por,
          valor_nominal, unidad_nominal, valor_medido, unidad_medida, observaciones, evaluacion } = body

  if (!salida_id || !fecha_retorno || !cantidad_retornada || !recibido_por)
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })

  const db = supabaseAdmin()
  const { data: salida } = await db.from('salidas').select('id, codigo_equipo, retornos(id)').eq('id', salida_id).single()
  if (!salida) return NextResponse.json({ error: 'Salida no encontrada' }, { status: 404 })
  if (salida.retornos && (salida.retornos as unknown[]).length > 0)
    return NextResponse.json({ error: 'Esta salida ya tiene un retorno registrado' }, { status: 409 })

  const { error: errRet } = await db.from('retornos').insert({
    salida_id, fecha_retorno, cantidad_retornada, recibido_por,
    valor_nominal: valor_nominal ?? null, unidad_nominal: unidad_nominal ?? null,
    valor_medido: valor_medido ?? null, unidad_medida: unidad_medida ?? null,
    observaciones,
    ret_enciende: evaluacion?.enciende ?? 'N/A',
    ret_indicacion_legible: evaluacion?.indicacion_legible ?? 'N/A',
    ret_bateria_cable: evaluacion?.bateria_cable ?? 'N/A',
    ret_variacion: evaluacion?.variacion ?? 'N/A',
    ret_calibracion_vigente: evaluacion?.calibracion_vigente ?? 'N/A',
    ret_limpieza: evaluacion?.limpieza ?? 'N/A',
    ret_alteracion_sensor: evaluacion?.alteracion_sensor ?? 'N/A',
    ret_rayas: evaluacion?.rayas ?? 'N/A',
    ret_contaminacion: evaluacion?.contaminacion ?? 'N/A',
  })

  if (errRet) return NextResponse.json({ error: errRet.message }, { status: 500 })
  await db.from('equipos').update({ estado: 'disponible' }).eq('codigo', salida.codigo_equipo)
  return NextResponse.json({ ok: true }, { status: 201 })
}
