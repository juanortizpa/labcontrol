'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

const PREGUNTAS = [
  { key:'enciende',           label:'¿Enciende correctamente?' },
  { key:'indicacion_legible', label:'¿La indicación es legible?' },
  { key:'bateria_cable',      label:'¿Tiene batería suficiente o cable?' },
  { key:'variacion',          label:'¿Variación a pequeños estímulos?' },
  { key:'calibracion_vigente',label:'¿La calibración es vigente?' },
  { key:'limpieza',           label:'¿Adecuadas condiciones de limpieza?' },
  { key:'alteracion_sensor',  label:'¿Alteraciones en sensor o bulbo?' },
  { key:'rayas',              label:'¿Rayas en la superficie?' },
  { key:'contaminacion',      label:'¿Contaminación con partículas?' },
] as const

type EK = typeof PREGUNTAS[number]['key']
type EV = 'SI' | 'NO' | 'N/A'
type EM = Record<EK, EV>

const defaultEval: EM = {
  enciende:'SI', indicacion_legible:'SI', bateria_cable:'SI',
  variacion:'SI', calibracion_vigente:'SI', limpieza:'SI',
  alteracion_sensor:'NO', rayas:'NO', contaminacion:'NO'
}

export default function RetornoPage() {
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [salidas, setSalidas] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [eval_, setEval] = useState<EM>(defaultEval)
  const [form, setForm] = useState({
    fecha_retorno: new Date().toISOString().split('T')[0],
    valor_nominal:'', unidad_nominal:'g',
    valor_medido:'',  unidad_medida:'g',
    observaciones:''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(d => d && setSession(d))
    fetch('/api/salidas?abiertas=true').then(r => r.json()).then(d => setSalidas(d.salidas ?? []))
  }, [])

  function setEF(key: EK, val: EV) { setEval(p => ({ ...p, [key]: val })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError('')
    if (!selected) { setError('Selecciona una salida'); return }
    const esPesa = selected.equipos?.es_pesa_patron
    if (esPesa && (!form.valor_medido || !form.valor_nominal)) {
      setError('Pesa patrón: debes ingresar valor nominal y valor medido (Regla 2)'); return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/retornos', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          salida_id: selected.id,
          codigo_equipo: selected.codigo_equipo,
          fecha_retorno: form.fecha_retorno,
          cantidad_retornada: selected.cantidad_sale ?? '1',  // legacy field auto
          recibido_por: session?.nombre ?? 'Usuario',  // ← AUTO desde sesión
          valor_nominal: esPesa ? parseFloat(form.valor_nominal) : null,
          valor_medido:  esPesa ? parseFloat(form.valor_medido)  : null,
          unidad_nominal: esPesa ? form.unidad_nominal : null,
          unidad_medida:  esPesa ? form.unidad_medida  : null,
          observaciones: form.observaciones,
          evaluacion: eval_,
        })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Error'); return }
      setSuccess(true); setTimeout(() => router.push('/dashboard'), 1800)
    } catch { setError('Error de conexión') }
    finally { setLoading(false) }
  }

  const diasEnCampo = selected
    ? Math.floor((Date.now() - new Date(selected.fecha_salida).getTime()) / 86400000)
    : null

  // Filtrar salidas por búsqueda
  const salidasFiltradas = salidas.filter(s =>
    !busqueda ||
    s.codigo_equipo.toLowerCase().includes(busqueda.toLowerCase()) ||
    s.os.toLowerCase().includes(busqueda.toLowerCase()) ||
    s.empresa.toLowerCase().includes(busqueda.toLowerCase())
  )

  if (success) return (
    <div className="app-shell">
      {session && <Sidebar nombre={session.nombre} rol={session.rol} />}
      <div className="main-content">
        <div className="success-screen">
          <div className="success-icon">✓</div>
          <h2 style={{ fontSize:18, fontWeight:600, color:'var(--teal-700)' }}>Retorno registrado</h2>
          <p style={{ fontSize:13, color:'var(--gray-500)' }}>Redirigiendo al panel...</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="app-shell">
      {session && <Sidebar nombre={session.nombre} rol={session.rol} />}
      <div className="main-content">
        <header className="page-header">
          <div>
            <h1 className="page-title">Registrar retorno</h1>
            <p className="page-subtitle">Solo equipos con salida abierta · Recibe: <strong>{session?.nombre ?? '...'}</strong></p>
          </div>
          <button onClick={() => router.back()} className="btn btn-secondary btn-sm">← Volver</button>
        </header>

        <div className="page-body page-body-narrow">
          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:20 }}>
            <div className="card">
              <div className="card-header"><div className="section-tag">Paso 1</div></div>
              <div className="card-body">
                <div className="card-title" style={{ marginBottom:14 }}>Seleccionar equipo en campo</div>

                {salidas.length > 0 && (
                  <input className="form-input" placeholder="Buscar por código, OS o empresa..."
                    value={busqueda} onChange={e => setBusqueda(e.target.value)}
                    style={{ marginBottom:12 }} />
                )}

                {salidasFiltradas.length === 0 ? (
                  <p style={{ fontSize:13, color:'var(--gray-500)' }}>
                    {busqueda ? 'No hay coincidencias.' : 'No hay equipos en campo actualmente.'}
                  </p>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:8, maxHeight:280, overflowY:'auto' }}>
                    {salidasFiltradas.map(s => {
                      const dias = Math.floor((Date.now() - new Date(s.fecha_salida).getTime()) / 86400000)
                      const sel = selected?.id === s.id
                      return (
                        <button key={s.id} type="button" onClick={() => setSelected(s)}
                          style={{
                            textAlign:'left', padding:'12px 14px', borderRadius:'var(--radius-md)',
                            border:`1.5px solid ${sel ? 'var(--teal-600)' : 'var(--gray-200)'}`,
                            background: sel ? 'var(--teal-50)' : 'var(--white)',
                            cursor:'pointer', transition:'all 0.15s'
                          }}>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                            <div>
                              <span className="mono" style={{ fontSize:12, fontWeight:600, color:'var(--gray-900)' }}>
                                {s.codigo_equipo}
                              </span>
                              <span style={{ fontSize:12, color:'var(--gray-500)', marginLeft:8 }}>
                                {s.equipos?.descripcion}
                              </span>
                            </div>
                            <div style={{ textAlign:'right' }}>
                              <span className="mono" style={{ fontSize:11 }}>{s.os}</span>
                              <p style={{ fontSize:11, color:'var(--gray-400)' }}>{s.empresa}</p>
                            </div>
                          </div>
                          <p style={{ fontSize:11, color: dias >= 8 ? 'var(--red-text)' : 'var(--gray-400)', marginTop:4 }}>
                            Salida: {new Date(s.fecha_salida).toLocaleDateString('es-CO')} · <strong>{dias}d en campo</strong>
                          </p>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {selected && (
              <>
                <div className="alert alert-teal">
                  <div className="alert-dot" />
                  <div style={{ flex:1 }}>
                    <p style={{ fontSize:12, fontWeight:600, marginBottom:6 }}>Datos de la salida original</p>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px, 1fr))', gap:8 }}>
                      {[
                        ['Técnico', selected.usuarios?.nombre ?? '—'],
                        ['OS', selected.os],
                        ['Empresa', selected.empresa],
                        ['Salida', new Date(selected.fecha_salida).toLocaleDateString('es-CO')],
                        ['En campo', `${diasEnCampo}d`],
                        ['Equipo', selected.codigo_equipo],
                      ].map(([k,v]) => (
                        <div key={k}>
                          <span className="form-label" style={{ display:'block', marginBottom:2 }}>{k}</span>
                          <span style={{ fontSize:12, color: k==='En campo' && (diasEnCampo??0)>=8 ? 'var(--red-text)' : 'var(--teal-800)', fontWeight: k==='En campo' && (diasEnCampo??0)>=8 ? 600 : 400 }}>
                            {v}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header"><div className="section-tag">Paso 2</div></div>
                  <div className="card-body">
                    <div className="card-title" style={{ marginBottom:14 }}>Datos del retorno</div>
                    <div className="grid-2">
                      <div className="form-group">
                        <label className="form-label">Fecha de retorno</label>
                        <input type="date" className="form-input" value={form.fecha_retorno}
                          onChange={e => setForm(p => ({...p, fecha_retorno:e.target.value}))} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Recibido por (auto)</label>
                        <input className="form-input form-input-readonly"
                          value={session?.nombre ?? '...'} readOnly />
                      </div>
                    </div>
                  </div>
                </div>

                {selected.equipos?.es_pesa_patron && (
                  <div className="card" style={{ border:'1.5px solid var(--amber-border)' }}>
                    <div className="card-header">
                      <div>
                        <div className="section-tag" style={{ color:'var(--amber-text)' }}>Regla 2 — Obligatorio</div>
                        <div className="card-title">Verificación de masa</div>
                      </div>
                    </div>
                    <div className="card-body">
                      <div className="grid-2">
                        <div className="form-group">
                          <label className="form-label">Valor nominal</label>
                          <div style={{ display:'flex', gap:8 }}>
                            <input type="number" step="0.0001" className="form-input mono" style={{ flex:1 }}
                              placeholder="2000" value={form.valor_nominal}
                              onChange={e => setForm(p => ({...p, valor_nominal:e.target.value}))} required />
                            <select className="form-input" style={{ width:72 }} value={form.unidad_nominal}
                              onChange={e => setForm(p => ({...p, unidad_nominal:e.target.value}))}>
                              <option>g</option><option>kg</option><option>mg</option>
                            </select>
                          </div>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Valor medido</label>
                          <div style={{ display:'flex', gap:8 }}>
                            <input type="number" step="0.0001" className="form-input mono" style={{ flex:1 }}
                              placeholder="2000" value={form.valor_medido}
                              onChange={e => setForm(p => ({...p, valor_medido:e.target.value}))} required />
                            <select className="form-input" style={{ width:72 }} value={form.unidad_medida}
                              onChange={e => setForm(p => ({...p, unidad_medida:e.target.value}))}>
                              <option>g</option><option>kg</option><option>mg</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      {form.valor_nominal && form.valor_medido && (
                        <p className="mono" style={{ fontSize:12, marginTop:10, color:'var(--amber-text)' }}>
                          Diferencia: {(parseFloat(form.valor_medido) - parseFloat(form.valor_nominal)).toFixed(4)} {form.unidad_medida}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="card">
                  <div className="card-header"><div className="section-tag">Paso 3</div></div>
                  <div className="card-body">
                    <div style={{ marginBottom:14 }}>
                      <div className="card-title">Evaluación visual — Retorno</div>
                      <div className="card-subtitle">Estado del equipo al regresar de campo</div>
                    </div>
                    {PREGUNTAS.map(p => (
                      <div key={p.key} className="eval-row">
                        <span className="eval-question">{p.label}</span>
                        <div className="eval-toggle">
                          {(['SI','NO','N/A'] as EV[]).map(v => (
                            <button key={v} type="button" onClick={() => setEF(p.key, v)}
                              className={`eval-btn ${eval_[p.key] === v
                                ? v === 'SI' ? 'active-si' : v === 'NO' ? 'active-no' : 'active-na'
                                : ''}`}>
                              {v}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                    <div className="form-group" style={{ marginTop:16 }}>
                      <label className="form-label">Observaciones</label>
                      <textarea className="form-input" rows={2} style={{ resize:'none', minHeight:64 }}
                        value={form.observaciones}
                        onChange={e => setForm(p => ({...p, observaciones:e.target.value}))} />
                    </div>
                  </div>
                </div>
              </>
            )}

            {error && (
              <div className="alert alert-red">
                <div className="alert-dot" />
                <span style={{ fontSize:13 }}>{error}</span>
              </div>
            )}

            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button type="button" onClick={() => router.back()} className="btn btn-secondary">Cancelar</button>
              <button type="submit" disabled={loading || !selected} className="btn btn-primary"
                style={{ minWidth:160, justifyContent:'center' }}>
                {loading ? 'Registrando...' : '↓ Registrar retorno'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
