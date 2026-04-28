'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [cedula, setCedula] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cedula, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Credenciales inválidas'); return }
      router.push('/dashboard'); router.refresh()
    } catch { setError('Error de conexión') }
    finally { setLoading(false) }
  }

  return (
    <div className="login-page">
      {/* Background orbs */}
      <div className="login-bg-orb" style={{ width:500, height:500, background:'var(--teal-700)', top:'-150px', left:'-100px' }} />
      <div className="login-bg-orb" style={{ width:400, height:400, background:'#0d3b38', bottom:'-100px', right:'-80px' }} />

      <div style={{ position:'relative', zIndex:1, width:'100%', maxWidth:440, padding:'0 16px' }}>
        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{
            width:52, height:52, background:'var(--teal-600)', borderRadius:14,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:22, fontWeight:700, color:'#fff', margin:'0 auto 16px',
            boxShadow:'0 4px 20px rgba(13,148,136,0.40)'
          }}>LC</div>
          <h1 style={{ fontSize:24, fontWeight:700, color:'#fff', letterSpacing:'-0.02em' }}>LabControl</h1>
          <p style={{ fontSize:12, color:'rgba(255,255,255,0.45)', marginTop:4, fontFamily:'var(--font-mono)', letterSpacing:'0.06em', textTransform:'uppercase' }}>
            Control de equipos metrológicos
          </p>
        </div>

        {/* Card */}
        <div className="login-card">
          <h2 style={{ fontSize:17, fontWeight:600, color:'var(--gray-900)', marginBottom:24, letterSpacing:'-0.01em' }}>
            Acceder al sistema
          </h2>

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div className="form-group">
              <label className="form-label">Cédula</label>
              <input type="text" inputMode="numeric" className="form-input mono"
                placeholder="12345678" value={cedula}
                onChange={e => setCedula(e.target.value.replace(/\D/g,''))}
                required maxLength={12} />
            </div>

            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <input type="password" className="form-input" placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)} required />
            </div>

            {error && (
              <div className="alert alert-red" style={{ padding:'10px 14px' }}>
                <div className="alert-dot" />
                <span style={{ fontSize:13 }}>{error}</span>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn btn-primary btn-lg"
              style={{ marginTop:4, width:'100%', justifyContent:'center' }}>
              {loading ? 'Verificando...' : 'Ingresar'}
            </button>
          </form>

          {/* Demo credentials */}
          <div style={{
            marginTop:24, paddingTop:20,
            borderTop:'1px solid var(--gray-200)'
          }}>
            <p className="form-label" style={{ marginBottom:10 }}>Credenciales demo</p>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {[
                { rol:'Metrólogo', ced:'12345678', pwd:'metro123' },
                { rol:'Dirección', ced:'87654321', pwd:'director1' },
              ].map(c => (
                <button key={c.ced} onClick={() => { setCedula(c.ced); setPassword(c.pwd) }}
                  style={{
                    background:'var(--gray-50)', border:'1px solid var(--gray-200)',
                    borderRadius:'var(--radius-md)', padding:'8px 12px',
                    display:'flex', justifyContent:'space-between', alignItems:'center',
                    cursor:'pointer', transition:'background 0.15s'
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background='var(--gray-100)')}
                  onMouseLeave={e => (e.currentTarget.style.background='var(--gray-50)')}>
                  <span style={{ fontSize:12, fontWeight:500, color:'var(--gray-600)' }}>{c.rol}</span>
                  <span className="mono" style={{ fontSize:11, color:'var(--gray-500)' }}>{c.ced} / {c.pwd}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="mono" style={{ textAlign:'center', fontSize:10, color:'rgba(255,255,255,0.25)', marginTop:20, letterSpacing:'0.06em' }}>
          LC-FR-79 V6 · Demo v2.0
        </p>
      </div>
    </div>
  )
}
