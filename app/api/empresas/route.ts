import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const db = supabaseAdmin()
  const { data, error } = await db.from('salidas').select('empresa').order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Distinct con conteo de uso
  const counts = new Map<string, number>()
  data?.forEach(d => {
    if (d.empresa) counts.set(d.empresa, (counts.get(d.empresa) || 0) + 1)
  })
  const empresas = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])  // más usadas primero
    .map(([nombre, count]) => ({ nombre, count }))

  return NextResponse.json({ empresas })
}
