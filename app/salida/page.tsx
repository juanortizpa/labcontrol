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

const defaultEval = (): EM => ({
  enciende:'N/A', indicacion_legible:'N/A', bateria_cable:'N/A',
  variacion:'N/A', calibracion_vigente:'SI', limpieza:'SI',
  alteracion_sensor:'NO', rayas:'NO', contaminacion:'NO'
})

type EquipoEntry = { id: string; equipo: any | null; busqueda: string; showList: boolean; eval: EM }

export default function SalidaPage() {
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [equiposDB, setEquiposDB] = useState<any[]>([])
  const [empresas, setEmpresas] = useState<{ nombre: string; count: number }[]>([])
  const [empresaShowList, setEmpresaShowList] = useState(false)

  const [filas, setFilas] = useState<EquipoEntry[]>([
    { id: crypto.randomUUID(), equipo: null, busqueda: '', showList: false, eval: defaultEval() }
  ])
  const [form, setForm] = useState({
    fecha_salida: new Date().toISOString().split('T')[0],
    empresa: '', os: '', observaciones: ''
  })
  const [generandoOS, setGenerandoOS] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(d => d && setSession(d))
    fetch('/api/equipos?disponibles=true').then(r => r.json()).then(d => setEquiposDB(d.equipos ?? []))
    fetch('/api/empresas').then(r => r.json()).then(d => setEmpresas(d.empresas ?? []))
  }, [])

  // Equipos ya seleccionados (para no permitir duplicados en la misma OS)
  const codigosSeleccionados = new Set(filas.map(f => f.equipo?.codigo).filter(Boolean))

  function agregarFila() {
    setFilas(prev => [...prev, { id: crypto.randomUUID(), equipo: null, busqueda: '', showList: false, eval: defaultEval() }])
  }

  function quitarFila(id: string) {
    if (filas.length === 1) return
    setFilas(prev => prev.filter(f => f.id !== id))
  }

  function updateFila(id: string, patch: Partial<EquipoEntry>) {
    setFilas(prev => prev.map(f => f.id === id ? { ...f, ...patch } : f))
  }

  function setEvalField(filaId: string, key: EK, val: EV) {
    setFilas(prev => prev.map(f => f.id === filaId ? { ...f, eval: { ...f.eval, [key]: val } } : f))
  }

  async function generarOS() {
    const codigos = filas.map(f => f.equipo?.codigo).filter(Boolean) as string[]
    if (codigos.length === 0) { setError('Selecciona al menos un equipo antes de generar la OS'); return }
    setGenerandoOS(true)
    try {
      const res = await fetch('/api/os/generate', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ codigos })
      })
      const data = await res.json()
      if (res.ok) setForm(p => ({ ...p, os: data.os }))
      else setError(data.error ?? 'Error generando OS')
    } catch { setError('Error de conexión') }
    finally { setGenerandoOS(false) }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError('')
    if (filas.some(f => !f.equipo)) { setError('Falta seleccionar equipo en alguna fila'); return }
    if (!form.os) { setError('Falta el N° de orden de servicio'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/salidas', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          equipos: filas.map(f => ({ codigo_equipo: f.equipo!.codigo, evaluacion: f.eval })),
          fecha_salida: form.fecha_salida,
          empresa: form.empresa,
          os: form.os,
          observaciones: form.observaciones,
        })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Error al registrar'); return }
      setSuccess(true)
      setTimeout(() => router.push('/dashboard'), 1800)
    } catch { setError('Error de conexión') }
    finally { setLoading(false) }
  }

  if (success) return (
    <div className="app-shell">
      {session && <Sidebar nombre={session.nombre} rol={session.rol} />}
      <div className="main-content">
        <div className="success-screen">
          <div className="success-icon">✓</div>
          <h2 style={{ fontSize:18, fontWeight:600, color:'var(--teal-700)' }}>
            {filas.length > 1 ? `${filas.length} salidas registradas` : 'Salida registrada'}
          </h2>
          <p style={{ fontSize:13, color:'var(--gray-500)' }}>OS: <span className="mono">{form.os}</span></p>
        </div>
      </div>
    </div>
  )

  const empresasSugeridas = form.empresa.length > 0
    ? empresas.filter(e => e.nombre.toLowerCase().includes(form.empresa.toLowerCase())).slice(0, 5)
    : empresas.slice(0, 6)

  return (
    <div className="app-shell">
      {session && <Sidebar nombre={session.nombre} rol={session.rol} />}
      <div className="main-content">
        <header className="page-header">
          <div>
            <h1 className="page-title">Registrar salida</h1>
            <p className="page-subtitle">Formulario LC-FR-79 — Una OS puede contener varios equipos</p>
          </div>
          <button onClick={() => router.back()} className="btn btn-secondary btn-sm">← Volver</button>
        </header>

        <div className="page-body page-body-narrow">
          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:20 }}>

            {/* Datos OS y empresa */}
            <div className="card">
              <div className="card-header"><div className="section-tag">Paso 1</div></div>
              <div className="card-body">
                <div className="card-title" style={{ marginBottom:14 }}>Datos generales</div>

                <div className="grid-2" style={{ marginBottom:12 }}>
                  <div className="form-group">
                    <label className="form-label">Fecha de salida</label>
                    <input type="date" className="form-input" value={form.fecha_salida}
                      onChange={e => setForm(p => ({...p, fecha_salida:e.target.value}))} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">N° Orden de servicio</label>
                    <div className="input-with-button">
                      <input className="form-input mono" placeholder="Click en generar →" value={form.os}
                        onChange={e => setForm(p => ({...p, os:e.target.value.toUpperCase()}))} required />
                      <button type="button" onClick={generarOS} disabled={generandoOS}
                        className="btn btn-secondary btn-sm" title="Generar automáticamente">
                        {generandoOS ? '...' : '⚡'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="form-group autocomplete-wrap">
                  <label className="form-label">Empresa destino</label>
                  <input className="form-input" placeholder="Nombre de la empresa cliente"
                    value={form.empresa}
                    onChange={e => { setForm(p => ({...p, empresa:e.target.value})); setEmpresaShowList(true) }}
                    onFocus={() => setEmpresaShowList(true)}
                    onBlur={() => setTimeout(() => setEmpresaShowList(false), 200)}
                    required />
                  {empresaShowList && empresasSugeridas.length > 0 && (
                    <div className="autocomplete-list">
                      {empresasSugeridas.map(emp => (
                        <button key={emp.nombre} type="button" className="autocomplete-item"
                          onClick={() => { setForm(p => ({...p, empresa:emp.nombre})); setEmpresaShowList(false) }}>
                          <span style={{ fontSize:13, color:'var(--gray-800)' }}>{emp.nombre}</span>
                          <span className="mono" style={{ fontSize:11, color:'var(--gray-400)', marginLeft:8 }}>
                            {emp.count} salida{emp.count !== 1 ? 's' : ''}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                  <p style={{ fontSize:11, color:'var(--gray-500)', marginTop:4 }}>
                    Empresas anteriores se sugieren al escribir. Si es nueva, escríbela directamente.
                  </p>
                </div>
              </div>
            </div>

            {/* Equipos múltiples */}
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="section-tag">Paso 2</div>
                  <div className="card-title" style={{ marginTop:6 }}>Equipos en esta OS ({filas.length})</div>
                </div>
                <button type="button" onClick={agregarFila} className="btn btn-primary btn-sm">
                  + Agregar equipo
                </button>
              </div>
              <div className="card-body" style={{ display:'flex', flexDirection:'column', gap:14 }}>
                {filas.map((fila, idx) => {
                  const filtrados = equiposDB.filter(e =>
                    !codigosSeleccionados.has(e.codigo) &&
                    (e.codigo.toLowerCase().includes(fila.busqueda.toLowerCase()) ||
                      e.descripcion.toLowerCase().includes(fila.busqueda.toLowerCase()))
                  )
                  return (
                    <div key={fila.id} className="equipo-row">
                      <div className="equipo-row-header">
                        <span className="equipo-row-num">Equipo #{idx + 1}</span>
                        {filas.length > 1 && (
                          <button type="button" onClick={() => quitarFila(fila.id)} className="btn btn-ghost btn-sm"
                            style={{ color:'var(--red-text)', padding:'4px 10px' }}>
                            Quitar
                          </button>
                        )}
                      </div>

                      <div className="form-group autocomplete-wrap">
                        <label className="form-label">Código de equipo</label>
                        <input className="form-input mono" placeholder="Buscar por código o descripción..."
                          value={fila.busqueda}
                          onChange={e => updateFila(fila.id, { busqueda: e.target.value, showList: true, equipo: null })}
                          onFocus={() => updateFila(fila.id, { showList: true })}
                          onBlur={() => setTimeout(() => updateFila(fila.id, { showList: false }), 200)} />
                        {fila.showList && filtrados.length > 0 && (
                          <div className="autocomplete-list">
                            {filtrados.slice(0, 12).map(eq => {
                              const dias = eq.fecha_proxima_calibracion
                                ? Math.floor((new Date(eq.fecha_proxima_calibracion).getTime()-Date.now())/86400000)
                                : null
                              const blocked = eq.estado !== 'disponible' || (dias !== null && dias < 0)
                              return (
                                <button key={eq.codigo} type="button" disabled={blocked}
                                  className="autocomplete-item"
                                  onClick={() => updateFila(fila.id, { equipo: eq, busqueda: eq.codigo, showList: false })}>
                                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:8 }}>
                                    <span>
                                      <span className="mono" style={{ fontSize:12, fontWeight:600 }}>{eq.codigo}</span>
                                      <span style={{ fontSize:12, color:'var(--gray-500)', marginLeft:8 }}>{eq.descripcion}</span>
                                    </span>
                                    {blocked && <span style={{ fontSize:10, color:'var(--red-text)' }}>No disponible</span>}
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>

                      {fila.equipo && (
                        <>
                          <div style={{ marginTop:10, padding:'10px 12px', background:'var(--white)',
                            borderRadius:'var(--radius-sm)', border:'1px solid var(--gray-200)',
                            display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                            <div>
                              <span className="form-label" style={{ display:'block' }}>Magnitud</span>
                              <span style={{ fontSize:12, color:'var(--gray-700)' }}>{fila.equipo.magnitud}</span>
                            </div>
                            <div>
                              <span className="form-label" style={{ display:'block' }}>Próx. calibración</span>
                              <span className="mono" style={{ fontSize:12, color:'var(--gray-700)' }}>
                                {fila.equipo.fecha_proxima_calibracion ? new Date(fila.equipo.fecha_proxima_calibracion).toLocaleDateString('es-CO') : '—'}
                              </span>
                            </div>
                            {fila.equipo.es_pesa_patron && (
                              <div style={{ gridColumn:'1 / 3' }}>
                                <span className="badge badge-proximo">
                                  <span className="badge-dot" />Pesa patrón — requiere verificación de masa al retorno
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Mini eval por equipo */}
                          <div style={{ marginTop:12 }}>
                            <span className="form-label" style={{ display:'block', marginBottom:8 }}>
                              Evaluación visual del equipo #{idx + 1}
                            </span>
                            {PREGUNTAS.map(p => (
                              <div key={p.key} className="eval-row" style={{ padding:'7px 0' }}>
                                <span className="eval-question" style={{ fontSize:12 }}>{p.label}</span>
                                <div className="eval-toggle">
                                  {(['SI','NO','N/A'] as EV[]).map(v => (
                                    <button key={v} type="button" onClick={() => setEvalField(fila.id, p.key, v)}
                                      className={`eval-btn ${fila.eval[p.key] === v
                                        ? v === 'SI' ? 'active-si' : v === 'NO' ? 'active-no' : 'active-na'
                                        : ''}`}>
                                      {v}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Observaciones */}
            <div className="card">
              <div className="card-body">
                <div className="form-group">
                  <label className="form-label">Observaciones generales (opcional)</label>
                  <textarea className="form-input" rows={2} style={{ resize:'none', minHeight:64 }}
                    placeholder="Aplica a toda la OS..."
                    value={form.observaciones}
                    onChange={e => setForm(p => ({...p, observaciones:e.target.value}))} />
                </div>
              </div>
            </div>

            {error && (
              <div className="alert alert-red">
                <div className="alert-dot" />
                <span style={{ fontSize:13 }}>{error}</span>
              </div>
            )}

            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button type="button" onClick={() => router.back()} className="btn btn-secondary">Cancelar</button>
              <button type="submit" disabled={loading} className="btn btn-primary"
                style={{ minWidth:200, justifyContent:'center' }}>
                {loading ? 'Registrando...' : `↑ Registrar ${filas.length} salida${filas.length>1?'s':''}`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
