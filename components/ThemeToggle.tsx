'use client'
import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [dark, setDark] = useState(false)
  useEffect(() => { setDark(document.documentElement.classList.contains('dark')) }, [])

  function toggle() {
    const isDark = document.documentElement.classList.toggle('dark')
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
    setDark(isDark)
  }

  return (
    <button onClick={toggle} title={dark ? 'Modo claro' : 'Modo oscuro'}
      style={{
        width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 8, border: '1px solid rgba(255,255,255,0.10)',
        background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.55)',
        cursor: 'pointer', fontSize: 13
      }}>
      {dark ? '☀' : '☾'}
    </button>
  )
}
