'use client'
import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'

type ReporteKey = 'inventario' | 'historial'

export default function ReportesPage() {
  const [session, setSession]   = useState<any>(null)
  const [loadingKey, setLoading] = useState<string | null>(null)
  const [error, setError]        = useState('')

  // Filtros historial
  const [desde,  setDesde]  = useState('')
  const [hasta,  setHasta]  = useState('')
  const [estado, setEstado] = useState('todos')

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(d => d && setSession(d))
  }, [])

  async function descargar(url: string, filename: string, key: string) {
    setError('')
    setLoading(key)
    try {
      const res = await fetch(url)
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        setError(j.error ?? 'Error al generar el reporte')
        return
      }
      const blob   = await res.blob()
      const objUrl = URL.createObjectURL(blob)
      const a      = document.createElement('a')
      a.href       = objUrl
      a.download   = filename
      a.click()
      URL.revokeObjectURL(objUrl)
    } catch {
      setError('Error de conexión al generar el reporte')
    } finally {
      setLoading(null)
    }
  }

  function descargarInventario() {
    descargar('/api/reportes/inventario', `LC-FR-10-inventario-${isoDate()}.xlsx`, 'inventario')
  }

  function descargarHistorial() {
    const params = new URLSearchParams()
    if (desde)  params.set('desde',  desde)
    if (hasta)  params.set('hasta',  hasta)
    if (estado !== 'todos') params.set('estado', estado)
    descargar(`/api/reportes/historial?${params}`, `historial-movimientos-${isoDate()}.xlsx`, 'historial')
  }

  function descargarPlantilla(tipo: string, nombre: string) {
    descargar(`/api/reportes/plantilla?tipo=${tipo}`, nombre, tipo)
  }

  return (
    <div className="app-shell">
      {session && <Sidebar nombre={session.nombre} rol={session.rol} />}
      <div className="main-content">
        <header className="page-header">
          <div>
            <h1 className="page-title">Reportes</h1>
            <p className="page-subtitle">Genera y descarga reportes en formato Excel</p>
          </div>
        </header>

        <div className="page-body" style={{ maxWidth: 800 }}>

          {error && (
            <div className="alert alert-red" style={{ marginBottom: 20 }}>
              <div className="alert-dot" />
              <span style={{ fontSize: 13 }}>{error}</span>
              <button onClick={() => setError('')}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red-text)', fontSize: 16 }}>
                ✕
              </button>
            </div>
          )}

          {/* ── Inventario LC-FR-10 ────────────────────────────────────────── */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <div>
                <div className="section-tag">LC-FR-10</div>
                <div className="card-title">Inventario de instrumentos de medición</div>
              </div>
              <button
                onClick={descargarInventario}
                disabled={loadingKey === 'inventario'}
                className="btn btn-primary btn-sm"
                style={{ minWidth: 140, justifyContent: 'center' }}
              >
                {loadingKey === 'inventario' ? 'Generando...' : '⬇ Descargar Excel'}
              </button>
            </div>
            <div className="card-body">
              <p style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 8 }}>
                Exporta el inventario completo de todos los equipos activos con estado de calibración,
                fechas, frecuencias y días de vigencia. Formato compatible con el formulario <strong>LC-FR-10 V5</strong>.
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {[
                  'Código y descripción',
                  'Magnitud y tipo',
                  'Intervalo / División de escala',
                  'Frecuencias de calibración y mantenimiento',
                  'Estado actual y días de vigencia',
                ].map(item => (
                  <span key={item} style={{
                    fontSize: 11, background: 'var(--teal-50)',
                    color: 'var(--teal-700)', borderRadius: 4, padding: '2px 8px',
                    border: '1px solid var(--teal-200)'
                  }}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* ── Historial de movimientos ───────────────────────────────────── */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <div>
                <div className="section-tag">Movimientos</div>
                <div className="card-title">Historial de salidas y retornos</div>
              </div>
              <button
                onClick={descargarHistorial}
                disabled={loadingKey === 'historial'}
                className="btn btn-primary btn-sm"
                style={{ minWidth: 140, justifyContent: 'center' }}
              >
                {loadingKey === 'historial' ? 'Generando...' : '⬇ Descargar Excel'}
              </button>
            </div>
            <div className="card-body">
              <p style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 14 }}>
                Exporta el historial de movimientos con filtros opcionales de fecha y estado.
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Desde</label>
                  <input type="date" className="filter-input"
                    value={desde} onChange={e => setDesde(e.target.value)} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Hasta</label>
                  <input type="date" className="filter-input"
                    value={hasta} onChange={e => setHasta(e.target.value)} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Estado</label>
                  <select className="filter-input" value={estado} onChange={e => setEstado(e.target.value)}>
                    <option value="todos">Todos</option>
                    <option value="campo">En campo</option>
                    <option value="retornado">Retornados</option>
                  </select>
                </div>
                {(desde || hasta || estado !== 'todos') && (
                  <button onClick={() => { setDesde(''); setHasta(''); setEstado('todos') }}
                    className="btn btn-ghost btn-sm" style={{ marginBottom: 2 }}>
                    ✕ Limpiar
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── Plantillas de certificados ─────────────────────────────────── */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="section-tag">Plantillas</div>
                <div className="card-title">Certificados de calibración</div>
              </div>
            </div>
            <div className="card-body">
              <p style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 16 }}>
                Descarga las plantillas oficiales de certificados de calibración de TECSERVICE S.A.S.
                para diligenciarlas manualmente según el equipo a calibrar.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {CERTS.map(c => (
                  <div key={c.tipo} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '12px 14px', borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--gray-200)', background: 'var(--white)'
                  }}>
                    <div>
                      <span className="mono" style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-900)' }}>
                        {c.codigo}
                      </span>
                      <p style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 2 }}>
                        {c.descripcion}
                      </p>
                    </div>
                    <button
                      onClick={() => descargarPlantilla(c.tipo, c.filename)}
                      disabled={loadingKey === c.tipo}
                      className="btn btn-secondary btn-sm"
                      style={{ minWidth: 130, justifyContent: 'center' }}
                    >
                      {loadingKey === c.tipo ? 'Descargando...' : '⬇ Plantilla Excel'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

const CERTS = [
  {
    tipo: 'balanza',
    codigo: 'TM028',
    descripcion: 'Balanza de pesaje — Instrumentos OIML / NFNA (LC-FR-20 V12)',
    filename: 'TM028-Certificado-Balanza.xlsx',
  },
  {
    tipo: 'manometro',
    codigo: 'TP046',
    descripcion: 'Manómetro — Instrumentos de presión',
    filename: 'TP046-Certificado-Manometro.xlsx',
  },
  {
    tipo: 'micropipeta',
    codigo: 'TVO005',
    descripcion: 'Micropipeta / Volumen — Instrumentos volumétricos (100–1000 µL)',
    filename: 'TVO005-Certificado-Micropipeta.xlsx',
  },
]

function isoDate() { return new Date().toISOString().split('T')[0] }
