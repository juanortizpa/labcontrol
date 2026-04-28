import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const { codigos } = body as { codigos: string[] }

  if (!codigos || codigos.length === 0)
    return NextResponse.json({ error: 'Sin códigos' }, { status: 400 })

  // Prefijo: primeras letras de cada código (antes del primer guion)
  // Ej: TEC-LAB-MP-20 → TLM
  // Múltiples equipos: usa el primero
  const primer = codigos[0]
  const partes = primer.split('-')
  const prefijo = partes.length >= 3
    ? (partes[0][0] + partes[1][0] + partes[2][0]).toUpperCase()
    : primer.slice(0, 3).toUpperCase()

  // Fecha: YYMMDD
  const now = new Date()
  const yy = String(now.getFullYear()).slice(-2)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const fecha = `${yy}${mm}${dd}`

  const db = supabaseAdmin()

  // Intentar hasta 10 veces hasta dar con un OS único
  for (let i = 0; i < 10; i++) {
    const random = Math.floor(1000 + Math.random() * 9000)
    const os = `${prefijo}-${fecha}-${random}`
    const { data: existe } = await db.from('salidas').select('id').eq('os', os).limit(1)
    if (!existe || existe.length === 0) {
      return NextResponse.json({ os })
    }
  }

  return NextResponse.json({ error: 'No se pudo generar OS único' }, { status: 500 })
}
