'use client'
import { useState, useEffect, useMemo } from 'react'
import Sidebar from '@/components/Sidebar'

export default function HistorialPage() {
  const [session, setSession] = useState<any>(null)
  const [registros, setRegistros] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // filtros
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'campo' | 'retornado'>('todos')
  const [filtroMagnitud, setFiltroMagnitud] = useState<string>('todas')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(d => d && setSession(d))
    fetch('/api/salidas').then(r => r.json()).then(d => {
      setRegistros(d.salidas ?? [])
      setLoading(false)
    })
  }, [])

  const magnitudes = useMemo(() =>
    Array.from(new Set(registros.map(r => r.equipos?.magnitud).filter(Boolean))),
    [registros])

  const filtered = useMemo(() => registros.filter(r => {
    // texto
    if (busqueda) {
      const q = busqueda.toLowerCase()
      const matches = [
        r.codigo_equipo, r.os, r.empresa,
        r.equipos?.descripcion, r.usuarios?.nombre
      ].some(v => v?.toLowerCase().includes(q))
      if (!matches) return false
    }
    // estado
    const tieneRetorno = r.retornos?.length > 0
    if (filtroEstado === 'campo' && tieneRetorno) return false
    if (filtroEstado === 'retornado' && !tieneRetorno) return false
    // magnitud
    if (filtroMagnitud !== 'todas' && r.equipos?.magnitud !== filtroMagnitud) return false
    // fechas
    const fs = new Date(r.fecha_salida)
    if (fechaDesde && fs < new Date(fechaDesde)) return false
    if (fechaHasta && fs > new Date(fechaHasta + 'T23:59:59')) return false
    return true
  }), [registros, busqueda, filtroEstado, filtroMagnitud, fechaDesde, fechaHasta])

  function exportarCSV() {
    const headers = ['Fecha salida','Código','Descripción','Magnitud','OS','Empresa','Técnico','Fecha retorno','Recibido por','Días en campo','Estado']
    const rows = filtered.map(r => {
      const ret = r.retornos?.length > 0 ? r.retornos[0] : null
      const dias = ret
        ? Math.floor((new Date(ret.fecha_retorno).getTime() - new Date(r.fecha_salida).getTime()) / 86400000)
        : Math.floor((Date.now() - new Date(r.fecha_salida).getTime()) / 86400000)
      return [
        new Date(r.fecha_salida).toLocaleDateString('es-CO'),
        r.codigo_equipo,
        r.equipos?.descripcion ?? '',
        r.equipos?.magnitud ?? '',
        r.os, r.empresa,
        r.usuarios?.nombre ?? '',
        ret ? new Date(ret.fecha_retorno).toLocaleDateString('es-CO') : '',
        ret?.recibido_por ?? '',
        dias,
        ret ? 'Retornado' : 'En campo'
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
    })
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `historial-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function limpiarFiltros() {
    setBusqueda(''); setFiltroEstado('todos'); setFiltroMagnitud('todas')
    setFechaDesde(''); setFechaHasta('')
  }

  const filtrosActivos = busqueda || filtroEstado !== 'todos' || filtroMagnitud !== 'todas' || fechaDesde || fechaHasta

  return (
    <div className="app-shell">
      {session && <Sidebar nombre={session.nombre} rol={session.rol} />}
      <div className="main-content">
        <header className="page-header">
          <div>
            <h1 className="page-title">Historial de movimientos</h1>
            <p className="page-subtitle mono">{filtered.length} de {registros.length} registros</p>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={exportarCSV} className="btn btn-secondary btn-sm" disabled={filtered.length === 0}>
              ⬇ Exportar CSV
            </button>
          </div>
        </header>

        <div className="page-body">
          {/* Filtros */}
          <div className="filter-bar">
            <input className="filter-input" placeholder="🔍 Buscar código, OS, empresa, técnico..."
              value={busqueda} onChange={e => setBusqueda(e.target.value)}
              style={{ flex:1, minWidth:240 }} />

            <select className="filter-input" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value as any)}>
              <option value="todos">Todos</option>
              <option value="campo">En campo</option>
              <option value="retornado">Retornados</option>
            </select>

            <select className="filter-input" value={filtroMagnitud} onChange={e => setFiltroMagnitud(e.target.value)}>
              <option value="todas">Todas las magnitudes</option>
              {magnitudes.map(m => <option key={m} value={m}>{m}</option>)}
            </select>

            <input type="date" className="filter-input" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} title="Desde" />
            <input type="date" className="filter-input" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} title="Hasta" />

            {filtrosActivos && (
              <button onClick={limpiarFiltros} className="btn btn-ghost btn-sm">✕ Limpiar</button>
            )}
          </div>

          <div className="card" style={{ overflow:'hidden' }}>
            {loading ? (
              <p style={{ padding:40, textAlign:'center', color:'var(--gray-500)' }}>Cargando...</p>
            ) : filtered.length === 0 ? (
              <p style={{ padding:40, textAlign:'center', color:'var(--gray-500)' }}>
                {filtrosActivos ? 'No hay registros que coincidan con los filtros' : 'Sin registros'}
              </p>
            ) : (
              <div style={{ overflowX:'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Fecha salida</th>
                      <th>Equipo</th>
                      <th>OS</th>
                      <th>Empresa</th>
                      <th>Técnico</th>
                      <th>Retorno</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(r => {
                      const retorno = r.retornos?.length > 0 ? r.retornos[0] : null
                      const dias = retorno
                        ? Math.floor((new Date(retorno.fecha_retorno).getTime() - new Date(r.fecha_salida).getTime()) / 86400000)
                        : Math.floor((Date.now() - new Date(r.fecha_salida).getTime()) / 86400000)
                      return (
                        <tr key={r.id}>
                          <td className="mono" style={{ fontSize:12 }}>
                            {new Date(r.fecha_salida).toLocaleDateString('es-CO')}
                          </td>
                          <td>
                            <span className="table-code">{r.codigo_equipo}</span>
                            <p style={{ fontSize:11, color:'var(--gray-400)', marginTop:2 }}>
                              {r.equipos?.descripcion}
                            </p>
                          </td>
                          <td className="mono" style={{ fontSize:12 }}>{r.os}</td>
                          <td style={{ maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {r.empresa}
                          </td>
                          <td>{r.usuarios?.nombre ?? '—'}</td>
                          <td>
                            {retorno ? (
                              <div>
                                <span className="mono" style={{ fontSize:12 }}>
                                  {new Date(retorno.fecha_retorno).toLocaleDateString('es-CO')}
                                </span>
                                <p style={{ fontSize:11, color:'var(--gray-400)', marginTop:2 }}>
                                  Recibió: {retorno.recibido_por}
                                </p>
                                {retorno.valor_medido && (
                                  <p className="mono" style={{ fontSize:11, color:'var(--amber-text)', marginTop:2 }}>
                                    Masa: {retorno.valor_medido} {retorno.unidad_medida}
                                  </p>
                                )}
                              </div>
                            ) : <span style={{ color:'var(--gray-300)' }}>—</span>}
                          </td>
                          <td>
                            {retorno ? (
                              <span className="badge badge-vigente">
                                <span className="badge-dot" />Retornado · {dias}d
                              </span>
                            ) : (
                              <span className={`badge ${dias >= 8 ? 'badge-vencido' : 'badge-campo'}`}>
                                <span className="badge-dot" />En campo · {dias}d
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
