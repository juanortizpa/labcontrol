'use client'
import { useState, useEffect, useMemo } from 'react'
import Sidebar from '@/components/Sidebar'
import SemaforoStatus from '@/components/SemaforoStatus'

const ESTADO_BADGE: Record<string, string> = {
  disponible:     'badge-disponible',
  en_campo:       'badge-campo',
  en_calibracion: 'badge-proximo',
  fuera_servicio: 'badge-vencido',
}
const ESTADO_LABEL: Record<string, string> = {
  disponible:'Disponible', en_campo:'En campo',
  en_calibracion:'En calibración', fuera_servicio:'Fuera de servicio'
}

export default function MaestroPage() {
  const [session, setSession] = useState<any>(null)
  const [equipos, setEquipos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Filtros
  const [busqueda, setBusqueda] = useState('')
  const [filtroMagnitud, setFiltroMagnitud] = useState('todas')
  const [filtroEstado, setFiltroEstado] = useState('todos')

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(d => {
      if (!d || d.rol !== 'direccion') { window.location.href = '/dashboard'; return }
      setSession(d)
    })
    cargarEquipos()
  }, [])

  function cargarEquipos() {
    setLoading(true)
    fetch('/api/equipos').then(r => r.json()).then(d => {
      setEquipos(d.equipos ?? [])
      setLoading(false)
    })
  }

  const magnitudes = useMemo(() =>
    Array.from(new Set(equipos.map(e => e.magnitud))), [equipos])

  const filtered = useMemo(() => equipos.filter(e => {
    if (busqueda) {
      const q = busqueda.toLowerCase()
      if (!e.codigo.toLowerCase().includes(q) && !e.descripcion.toLowerCase().includes(q)) return false
    }
    if (filtroMagnitud !== 'todas' && e.magnitud !== filtroMagnitud) return false
    if (filtroEstado !== 'todos' && e.estado !== filtroEstado) return false
    return true
  }), [equipos, busqueda, filtroMagnitud, filtroEstado])

  const grouped = useMemo(() => {
    const map = new Map<string, any[]>()
    filtered.forEach(e => {
      if (!map.has(e.magnitud)) map.set(e.magnitud, [])
      map.get(e.magnitud)!.push(e)
    })
    return Array.from(map.entries())
  }, [filtered])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setError(''); setSaving(true)
    try {
      const res = await fetch('/api/equipos', {
        method: 'PUT', headers: {'Content-Type':'application/json'},
        body: JSON.stringify(editing)
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Error al guardar'); return }
      setEditing(null); cargarEquipos()
    } catch { setError('Error de conexión') }
    finally { setSaving(false) }
  }

  return (
    <div className="app-shell">
      {session && <Sidebar nombre={session.nombre} rol={session.rol} />}
      <div className="main-content">
        <header className="page-header">
          <div>
            <h1 className="page-title">Catálogo de equipos</h1>
            <p className="page-subtitle mono">{filtered.length} de {equipos.length} equipos</p>
          </div>
        </header>

        <div className="page-body">
          {/* Filtros */}
          <div className="filter-bar">
            <input className="filter-input" placeholder="🔍 Buscar código o descripción..."
              value={busqueda} onChange={e => setBusqueda(e.target.value)}
              style={{ flex:1, minWidth:260 }} />
            <select className="filter-input" value={filtroMagnitud} onChange={e => setFiltroMagnitud(e.target.value)}>
              <option value="todas">Todas las magnitudes</option>
              {magnitudes.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select className="filter-input" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
              <option value="todos">Todos los estados</option>
              <option value="disponible">Disponible</option>
              <option value="en_campo">En campo</option>
              <option value="en_calibracion">En calibración</option>
              <option value="fuera_servicio">Fuera de servicio</option>
            </select>
            {(busqueda || filtroMagnitud !== 'todas' || filtroEstado !== 'todos') && (
              <button onClick={() => { setBusqueda(''); setFiltroMagnitud('todas'); setFiltroEstado('todos') }}
                className="btn btn-ghost btn-sm">✕ Limpiar</button>
            )}
          </div>

          {loading ? (
            <p style={{ padding:40, textAlign:'center', color:'var(--gray-500)' }}>Cargando...</p>
          ) : grouped.length === 0 ? (
            <p style={{ padding:40, textAlign:'center', color:'var(--gray-500)' }}>Sin equipos</p>
          ) : grouped.map(([mag, lista]) => (
            <div key={mag} style={{ marginBottom:32 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                <div style={{ width:3, height:20, background:'var(--teal-500)', borderRadius:2 }} />
                <span className="mono" style={{ fontSize:11, fontWeight:600, color:'var(--teal-700)',
                  letterSpacing:'0.10em', textTransform:'uppercase' }}>{mag}</span>
                <span className="mono" style={{ fontSize:11, color:'var(--gray-400)' }}>
                  {lista.length} equipo{lista.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="card" style={{ overflow:'hidden' }}>
                <div style={{ overflowX:'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Código</th>
                        <th>Descripción</th>
                        <th>Tipo</th>
                        <th>Exactitud</th>
                        <th>Próx. calibración</th>
                        <th>Vigencia</th>
                        <th>Estado</th>
                        <th style={{ width:60 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {lista.map(e => (
                        <tr key={e.id}>
                          <td>
                            <span className="table-code">{e.codigo}</span>
                            {e.es_pesa_patron && (
                              <span className="badge badge-proximo" style={{ marginLeft:6, fontSize:10 }}>
                                <span className="badge-dot" />patrón
                              </span>
                            )}
                          </td>
                          <td style={{ fontSize:13 }}>{e.descripcion}</td>
                          <td style={{ fontSize:12, textTransform:'capitalize' }}>{e.tipo}</td>
                          <td className="mono" style={{ fontSize:12 }}>{e.exactitud ?? '—'}</td>
                          <td className="mono" style={{ fontSize:12 }}>
                            {e.fecha_proxima_calibracion
                              ? new Date(e.fecha_proxima_calibracion).toLocaleDateString('es-CO')
                              : '—'}
                          </td>
                          <td><SemaforoStatus fechaProxima={e.fecha_proxima_calibracion} showDias /></td>
                          <td>
                            <span className={`badge ${ESTADO_BADGE[e.estado] ?? 'badge-disponible'}`}>
                              <span className="badge-dot" />{ESTADO_LABEL[e.estado] ?? e.estado}
                            </span>
                          </td>
                          <td>
                            <button onClick={() => setEditing({ ...e })} className="btn btn-ghost btn-sm"
                              title="Editar equipo">✎</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal edición */}
      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <form onSubmit={handleSave}>
              <div className="modal-header">
                <div>
                  <div className="section-tag">Editar equipo</div>
                  <div className="card-title mono" style={{ marginTop:4 }}>{editing.codigo}</div>
                </div>
                <button type="button" onClick={() => setEditing(null)} className="btn btn-ghost btn-sm">✕</button>
              </div>
              <div className="modal-body" style={{ display:'flex', flexDirection:'column', gap:12 }}>
                <div className="form-group">
                  <label className="form-label">Descripción</label>
                  <input className="form-input" value={editing.descripcion ?? ''}
                    onChange={e => setEditing({...editing, descripcion: e.target.value})} required />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Magnitud</label>
                    <input className="form-input" value={editing.magnitud ?? ''}
                      onChange={e => setEditing({...editing, magnitud: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tipo</label>
                    <select className="form-input" value={editing.tipo}
                      onChange={e => setEditing({...editing, tipo: e.target.value})}>
                      <option value="patron">Patrón</option>
                      <option value="auxiliar">Auxiliar</option>
                    </select>
                  </div>
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Estado</label>
                    <select className="form-input" value={editing.estado}
                      onChange={e => setEditing({...editing, estado: e.target.value})}>
                      <option value="disponible">Disponible</option>
                      <option value="en_campo">En campo</option>
                      <option value="en_calibracion">En calibración</option>
                      <option value="fuera_servicio">Fuera de servicio</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Pesa patrón</label>
                    <select className="form-input" value={editing.es_pesa_patron ? 'si' : 'no'}
                      onChange={e => setEditing({...editing, es_pesa_patron: e.target.value === 'si'})}>
                      <option value="no">No</option>
                      <option value="si">Sí</option>
                    </select>
                  </div>
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Próx. calibración</label>
                    <input type="date" className="form-input"
                      value={editing.fecha_proxima_calibracion ?? ''}
                      onChange={e => setEditing({...editing, fecha_proxima_calibracion: e.target.value || null})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Frecuencia</label>
                    <input className="form-input" placeholder="Anual, semestral..."
                      value={editing.frecuencia_calibracion ?? ''}
                      onChange={e => setEditing({...editing, frecuencia_calibracion: e.target.value})} />
                  </div>
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Exactitud</label>
                    <input className="form-input mono" placeholder="± 0.05 °C"
                      value={editing.exactitud ?? ''}
                      onChange={e => setEditing({...editing, exactitud: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">División de escala</label>
                    <input className="form-input mono" placeholder="0.01 g"
                      value={editing.division_escala ?? ''}
                      onChange={e => setEditing({...editing, division_escala: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Intervalo de medición</label>
                  <input className="form-input mono" placeholder="0–700 bar"
                    value={editing.intervalo_medicion ?? ''}
                    onChange={e => setEditing({...editing, intervalo_medicion: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Observaciones</label>
                  <textarea className="form-input" rows={2} style={{ resize:'none', minHeight:60 }}
                    value={editing.observaciones ?? ''}
                    onChange={e => setEditing({...editing, observaciones: e.target.value})} />
                </div>

                {error && (
                  <div className="alert alert-red">
                    <div className="alert-dot" />
                    <span style={{ fontSize:13 }}>{error}</span>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setEditing(null)} className="btn btn-secondary">Cancelar</button>
                <button type="submit" disabled={saving} className="btn btn-primary"
                  style={{ minWidth:120, justifyContent:'center' }}>
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
