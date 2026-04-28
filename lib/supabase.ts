import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(url, anonKey)

export function supabaseAdmin() {
  return createClient(
    url,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export function estadoVigencia(fechaProxima: string | null) {
  if (!fechaProxima) return 'sin_fecha'
  const hoy = new Date()
  const fecha = new Date(fechaProxima)
  const dias = Math.floor((fecha.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
  if (dias < 0) return 'vencido'
  if (dias <= 5) return 'critico'
  if (dias <= 15) return 'proximo'
  return 'vigente'
}

export function diasParaVencer(fechaProxima: string | null): number | null {
  if (!fechaProxima) return null
  const hoy = new Date()
  const fecha = new Date(fechaProxima)
  return Math.floor((fecha.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
}

export type Equipo = {
  id: string; codigo: string; descripcion: string; magnitud: string
  tipo: string; es_pesa_patron: boolean; estado: string
  fecha_proxima_calibracion: string | null; exactitud: string | null; observaciones: string | null
}
export type Usuario = { id: string; cedula: string; nombre: string; rol: 'metrologo' | 'direccion' }
