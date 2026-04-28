import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createSession } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const { cedula, password } = await req.json()
  if (!cedula || !password)
    return NextResponse.json({ error: 'Cédula y contraseña requeridas' }, { status: 400 })

  const db = supabaseAdmin()
  const { data: user, error } = await db
    .from('usuarios')
    .select('id, cedula, nombre, rol, password_hash, activo')
    .eq('cedula', cedula)
    .single()

  if (error || !user)
    return NextResponse.json({ error: 'Cédula no registrada' }, { status: 401 })
  if (!user.activo)
    return NextResponse.json({ error: 'Usuario inactivo. Contactar a Dirección.' }, { status: 403 })

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid)
    return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 })

  await createSession({ id: user.id, cedula: user.cedula, nombre: user.nombre, rol: user.rol })
  return NextResponse.json({ ok: true, nombre: user.nombre, rol: user.rol })
}
