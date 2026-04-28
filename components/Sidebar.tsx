'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import ThemeToggle from './ThemeToggle'
import MobileNav from './MobileNav'

type Props = { nombre: string; rol: 'metrologo' | 'direccion' }

const navMetrologo = [
  { href: '/dashboard', label: 'Panel',          icon: '▦' },
  { href: '/salida',    label: 'Nueva salida',   icon: '↑' },
  { href: '/retorno',   label: 'Nuevo retorno',  icon: '↓' },
  { href: '/historial', label: 'Historial',      icon: '☰' },
  { href: '/reportes',  label: 'Reportes',       icon: '⬇' },
]
const navDireccion = [
  { href: '/maestro', label: 'Catálogo equipos', icon: '⊞' },
]

export default function Sidebar({ nombre, rol }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [out, setOut] = useState(false)

  async function logout() {
    setOut(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const initials = nombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <>
      <MobileNav />
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-mark">LC</div>
          <div className="sidebar-logo-name">LabControl</div>
          <div className="sidebar-logo-sub">LC-FR-79 V6</div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Operación</div>
          {navMetrologo.map(item => (
            <Link key={item.href} href={item.href}
              className={`sidebar-link ${pathname === item.href ? 'active' : ''}`}>
              <span style={{ fontSize: 14, width: 16, textAlign: 'center' }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}

          {rol === 'direccion' && (
            <>
              <div className="sidebar-section-label" style={{ marginTop: 12 }}>Administración</div>
              {navDireccion.map(item => (
                <Link key={item.href} href={item.href}
                  className={`sidebar-link ${pathname === item.href ? 'active' : ''}`}>
                  <span style={{ fontSize: 14, width: 16, textAlign: 'center' }}>{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <ThemeToggle />
            <button onClick={logout} disabled={out}
              style={{
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: 8, padding: '5px 10px', color: 'rgba(255,255,255,0.55)',
                fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-mono)'
              }}>
              {out ? '...' : 'Salir'}
            </button>
          </div>
          <div className="sidebar-user">
            <div className="sidebar-avatar">{initials}</div>
            <div style={{ overflow: 'hidden' }}>
              <div className="sidebar-user-name">{nombre}</div>
              <div className="sidebar-user-role">
                {rol === 'direccion' ? 'Dirección' : 'Metrólogo'}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
