import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const soloDisponibles = req.nextUrl.searchParams.get('disponibles') === 'true'
  const db = supabaseAdmin()
  let query = db.from('equipos')
    .select('*')
    .eq('activo', true)
    .order('magnitud').order('codigo')

  if (soloDisponibles) query = query.eq('estado', 'disponible')

  const { data: equipos, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ equipos })
}

export async function PUT(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.rol !== 'direccion') return NextResponse.json({ error: 'Solo Dirección puede editar' }, { status: 403 })

  const body = await req.json()
  const { codigo, ...updates } = body
  if (!codigo) return NextResponse.json({ error: 'Falta código' }, { status: 400 })

  // Solo permitir actualizar campos editables
  const allowed = ['descripcion', 'magnitud', 'tipo', 'es_pesa_patron', 'estado',
    'fecha_proxima_calibracion', 'frecuencia_calibracion', 'verificacion_intermedia',
    'intervalo_mantenimiento', 'intervalo_medicion', 'division_escala', 'exactitud',
    'observaciones']
  const cleanUpdates: Record<string, unknown> = {}
  for (const k of allowed) if (k in updates) cleanUpdates[k] = updates[k]
  cleanUpdates.updated_at = new Date().toISOString()

  const db = supabaseAdmin()
  const { error } = await db.from('equipos').update(cleanUpdates).eq('codigo', codigo)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
