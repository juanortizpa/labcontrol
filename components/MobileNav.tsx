'use client'
import { useState, useEffect } from 'react'

export default function MobileNav() {
  const [open, setOpen] = useState(false)

  // Cerrar al navegar
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      const sidebar = document.querySelector('.sidebar') as HTMLElement
      if (sidebar) sidebar.classList.add('sidebar-open')
    } else {
      document.body.style.overflow = ''
      const sidebar = document.querySelector('.sidebar') as HTMLElement
      if (sidebar) sidebar.classList.remove('sidebar-open')
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Cerrar sidebar al hacer click en un link
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement
      if (target.closest('.sidebar-link') || target.closest('.sidebar a')) {
        setOpen(false)
      }
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  return (
    <>
      {/* Hamburger button — solo visible en mobile */}
      <button
        onClick={() => setOpen(!open)}
        className="mobile-hamburger"
        aria-label="Menú"
      >
        <span className={`hamburger-line ${open ? 'open' : ''}`} />
        <span className={`hamburger-line ${open ? 'open' : ''}`} />
        <span className={`hamburger-line ${open ? 'open' : ''}`} />
      </button>

      {/* Overlay */}
      {open && (
        <div className="mobile-overlay" onClick={() => setOpen(false)} />
      )}
    </>
  )
}
