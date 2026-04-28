import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { supabaseAdmin, estadoVigencia } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import SemaforoStatus from '@/components/SemaforoStatus'
import { BarChart, DonutChart, AreaChart } from '@/components/Charts'
import Link from 'next/link'

export const revalidate = 0

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const db = supabaseAdmin()
  const ahora = new Date()

  // Datos
  const { data: salidas } = await db.from('salidas')
    .select('id, codigo_equipo, fecha_salida, empresa, os, retornos(id, fecha_retorno), equipos(magnitud)')
    .order('fecha_salida', { ascending: false })

  const { data: equipos } = await db.from('equipos')
    .select('codigo, descripcion, magnitud, fecha_proxima_calibracion, estado')
    .eq('activo', true).order('fecha_proxima_calibracion', { ascending: true })

  const enCampo = salidas?.filter(s => !s.retornos || (s.retornos as unknown[]).length === 0) ?? []

  const proximos = equipos?.filter(e => {
    const v = estadoVigencia(e.fecha_proxima_calibracion)
    return v === 'proximo' || v === 'critico' || v === 'vencido'
  }) ?? []

  const stats = {
    total:       equipos?.length ?? 0,
    disponibles: equipos?.filter(e => e.estado === 'disponible').length ?? 0,
    campo:       enCampo.length,
    alertas:     proximos.length,
  }

  const alertas8 = enCampo.filter(s =>
    Math.floor((ahora.getTime() - new Date(s.fecha_salida).getTime()) / 86400000) >= 8
  )

  // 1. Salidas por mes (últimos 6 meses)
  const salidasPorMes: { label: string; value: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1)
    const next = new Date(ahora.getFullYear(), ahora.getMonth() - i + 1, 1)
    const count = salidas?.filter(s => {
      const fs = new Date(s.fecha_salida)
      return fs >= d && fs < next
    }).length ?? 0
    const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
    salidasPorMes.push({ label: meses[d.getMonth()], value: count })
  }

  // 2. Distribución por magnitud (de equipos)
  const porMagnitud = new Map<string, number>()
  equipos?.forEach(e => porMagnitud.set(e.magnitud, (porMagnitud.get(e.magnitud) || 0) + 1))
  const colors = ['#0d9488', '#3b82f6', '#f59e0b', '#a855f7', '#ec4899', '#22c55e']
  const donutData = Array.from(porMagnitud.entries()).map(([label, value], i) => ({
    label, value, color: colors[i % colors.length]
  }))

  // 3. Top 5 empresas por número de salidas
  const empresasMap = new Map<string, number>()
  salidas?.forEach(s => empresasMap.set(s.empresa, (empresasMap.get(s.empresa) || 0) + 1))
  const topEmpresas = Array.from(empresasMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  // 4. Promedio días en campo (últimas salidas cerradas)
  const cerradas = salidas?.filter(s => s.retornos && (s.retornos as any[])[0]?.fecha_retorno) ?? []
  const promedioDias = cerradas.length > 0
    ? Math.round(cerradas.reduce((sum, s) => {
        const inicio = new Date(s.fecha_salida).getTime()
        const fin = new Date((s.retornos as any[])[0].fecha_retorno).getTime()
        return sum + (fin - inicio) / 86400000
      }, 0) / cerradas.length)
    : 0

  // 5. Equipos más usados (top 5)
  const usoMap = new Map<string, number>()
  salidas?.forEach(s => usoMap.set(s.codigo_equipo, (usoMap.get(s.codigo_equipo) || 0) + 1))
  const topEquipos = Array.from(usoMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  return (
    <div className="app-shell">
      <Sidebar nombre={session.nombre} rol={session.rol} />
      <div className="main-content">
        <header className="page-header">
          <div>
            <h1 className="page-title">Panel de control</h1>
            <p className="page-subtitle">
              {ahora.toLocaleDateString('es-CO', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
            </p>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <Link href="/salida" className="btn btn-primary btn-sm">↑ Nueva salida</Link>
            <Link href="/retorno" className="btn btn-secondary btn-sm">↓ Registrar retorno</Link>
          </div>
        </header>

        <div className="page-body">
          {/* Alertas 8 días */}
          {alertas8.length > 0 && (
            <div className="alert alert-red" style={{ marginBottom:24 }}>
              <div className="alert-dot" />
              <div style={{ flex:1 }}>
                <p style={{ fontWeight:600, fontSize:13, marginBottom:10 }}>
                  {alertas8.length} equipo{alertas8.length > 1 ? 's lleva' : ' lleva'} más de 8 días en campo sin retorno
                </p>
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {alertas8.map(s => {
                    const d = Math.floor((ahora.getTime() - new Date(s.fecha_salida).getTime()) / 86400000)
                    return (
                      <div key={s.id} className="alert-item">
                        <span className="mono" style={{ fontWeight:600 }}>{s.codigo_equipo}</span>
                        <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.empresa}</span>
                        <span className="mono" style={{ fontWeight:600 }}>{d}d</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Bento stats */}
          <div className="bento-grid" style={{ marginBottom:20 }}>
            <div className="bento-stat teal">
              <div className="bento-stat-label">Total equipos</div>
              <div className="bento-stat-value">{stats.total}</div>
              <div className="bento-stat-sub">En catálogo activo</div>
            </div>
            <div className="bento-stat green">
              <div className="bento-stat-label">Disponibles</div>
              <div className="bento-stat-value" style={{ color:'var(--green-dot)' }}>{stats.disponibles}</div>
              <div className="bento-stat-sub">Listos para salida</div>
            </div>
            <div className="bento-stat blue">
              <div className="bento-stat-label">En campo</div>
              <div className="bento-stat-value" style={{ color:'var(--blue-dot)' }}>{stats.campo}</div>
              <div className="bento-stat-sub">Salidas abiertas</div>
            </div>
            <div className={`bento-stat ${stats.alertas > 0 ? 'red' : 'teal'}`}>
              <div className="bento-stat-label">Alertas calibración</div>
              <div className="bento-stat-value" style={{ color: stats.alertas > 0 ? 'var(--red-dot)' : undefined }}>
                {stats.alertas}
              </div>
              <div className="bento-stat-sub">Próximas a vencer</div>
            </div>
          </div>

          {/* KPIs secundarios */}
          <div className="bento-grid" style={{ marginBottom:24, gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <div className="bento-stat amber">
              <div className="bento-stat-label">Promedio en campo</div>
              <div className="bento-stat-value" style={{ fontSize:28 }}>{promedioDias} <span style={{ fontSize:18, color:'var(--gray-500)' }}>días</span></div>
              <div className="bento-stat-sub">Tiempo medio de retorno</div>
            </div>
            <div className="bento-stat teal">
              <div className="bento-stat-label">Salidas totales</div>
              <div className="bento-stat-value" style={{ fontSize:28 }}>{salidas?.length ?? 0}</div>
              <div className="bento-stat-sub">Movimientos históricos</div>
            </div>
            <div className="bento-stat blue">
              <div className="bento-stat-label">Empresas atendidas</div>
              <div className="bento-stat-value" style={{ fontSize:28 }}>{empresasMap.size}</div>
              <div className="bento-stat-sub">Clientes únicos</div>
            </div>
          </div>

          {/* Charts grid */}
          <div className="grid-2" style={{ marginBottom:20, gap:20 }}>
            {/* Salidas por mes */}
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="section-tag">Tendencia</div>
                  <div className="card-title">Salidas por mes</div>
                </div>
                <span className="text-xs mono" style={{ color:'var(--gray-500)' }}>Últimos 6 meses</span>
              </div>
              <div className="card-body">
                <BarChart data={salidasPorMes} />
              </div>
            </div>

            {/* Distribución por magnitud */}
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="section-tag">Catálogo</div>
                  <div className="card-title">Distribución por magnitud</div>
                </div>
              </div>
              <div className="card-body">
                {donutData.length > 0 ? (
                  <DonutChart data={donutData} />
                ) : (
                  <p style={{ fontSize:13, color:'var(--gray-500)', textAlign:'center', padding:24 }}>Sin datos</p>
                )}
              </div>
            </div>
          </div>

          <div className="grid-2" style={{ marginBottom:20, gap:20 }}>
            {/* Top empresas */}
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="section-tag">Ranking</div>
                  <div className="card-title">Top empresas</div>
                </div>
              </div>
              <div className="card-body">
                {topEmpresas.length === 0 ? (
                  <p style={{ fontSize:13, color:'var(--gray-500)', textAlign:'center', padding:16 }}>Sin datos</p>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    {topEmpresas.map(([empresa, count], i) => {
                      const max = topEmpresas[0][1]
                      const pct = (count / max) * 100
                      return (
                        <div key={empresa}>
                          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                            <span style={{ fontSize:12, color:'var(--gray-700)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'70%' }}>
                              <span className="mono" style={{ color:'var(--teal-700)', marginRight:6 }}>0{i+1}</span>
                              {empresa}
                            </span>
                            <span className="mono" style={{ fontSize:12, fontWeight:600, color:'var(--gray-900)' }}>{count}</span>
                          </div>
                          <div style={{ height:5, background:'var(--gray-150)', borderRadius:3, overflow:'hidden' }}>
                            <div style={{ width:`${pct}%`, height:'100%', background:'var(--teal-500)', borderRadius:3 }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Top equipos más usados */}
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="section-tag">Frecuencia</div>
                  <div className="card-title">Equipos más solicitados</div>
                </div>
              </div>
              <div className="card-body">
                {topEquipos.length === 0 ? (
                  <p style={{ fontSize:13, color:'var(--gray-500)', textAlign:'center', padding:16 }}>Sin datos</p>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    {topEquipos.map(([codigo, count], i) => {
                      const max = topEquipos[0][1]
                      const pct = (count / max) * 100
                      return (
                        <div key={codigo}>
                          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                            <span className="mono" style={{ fontSize:12, color:'var(--gray-700)' }}>{codigo}</span>
                            <span className="mono" style={{ fontSize:12, fontWeight:600, color:'var(--gray-900)' }}>{count} usos</span>
                          </div>
                          <div style={{ height:5, background:'var(--gray-150)', borderRadius:3, overflow:'hidden' }}>
                            <div style={{ width:`${pct}%`, height:'100%', background:'var(--teal-700)', borderRadius:3 }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* En campo + Alertas calibración */}
          <div className="grid-2" style={{ gap:20 }}>
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="section-tag">En campo</div>
                  <div className="card-title">Equipos despachados</div>
                </div>
                <span className="badge badge-campo">
                  <span className="badge-dot" />{enCampo.length}
                </span>
              </div>
              <div className="card-body">
                {enCampo.length === 0 ? (
                  <p style={{ fontSize:13, color:'var(--gray-500)', textAlign:'center', padding:'16px 0' }}>
                    Todos los equipos han retornado
                  </p>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
                    {enCampo.slice(0, 6).map(s => {
                      const dias = Math.floor((ahora.getTime() - new Date(s.fecha_salida).getTime()) / 86400000)
                      return (
                        <div key={s.id} style={{
                          display:'flex', justifyContent:'space-between', alignItems:'center',
                          padding:'10px 0', borderBottom:'1px solid var(--gray-150)'
                        }}>
                          <div style={{ overflow:'hidden' }}>
                            <span className="mono" style={{ fontSize:12, fontWeight:600, color:'var(--gray-900)' }}>
                              {s.codigo_equipo}
                            </span>
                            <p style={{ fontSize:11, color:'var(--gray-500)', marginTop:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                              {s.empresa}
                            </p>
                          </div>
                          <span className="mono" style={{
                            fontSize:12, fontWeight:600,
                            color: dias >= 8 ? 'var(--red-text)' : 'var(--gray-500)'
                          }}>
                            {dias}d
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div>
                  <div className="section-tag">Calibración</div>
                  <div className="card-title">Alertas de vigencia</div>
                </div>
                {proximos.length > 0 && (
                  <span className="badge badge-proximo">
                    <span className="badge-dot" />{proximos.length}
                  </span>
                )}
              </div>
              <div className="card-body">
                {proximos.length === 0 ? (
                  <p style={{ fontSize:13, color:'var(--gray-500)', textAlign:'center', padding:'16px 0' }}>
                    Todos los equipos están en regla
                  </p>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
                    {proximos.slice(0, 6).map(e => (
                      <div key={e.codigo} style={{
                        display:'flex', justifyContent:'space-between', alignItems:'center',
                        padding:'10px 0', borderBottom:'1px solid var(--gray-150)'
                      }}>
                        <div>
                          <span className="mono" style={{ fontSize:12, fontWeight:600, color:'var(--gray-900)' }}>
                            {e.codigo}
                          </span>
                          <p style={{ fontSize:11, color:'var(--gray-500)', marginTop:2 }}>{e.descripcion}</p>
                        </div>
                        <SemaforoStatus fechaProxima={e.fecha_proxima_calibracion} showDias />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
