'use client'

export function BarChart({ data, height = 180, color = 'var(--teal-500)' }: {
  data: { label: string; value: number }[]
  height?: number
  color?: string
}) {
  const max = Math.max(...data.map(d => d.value), 1)
  const w = 100 / data.length
  return (
    <svg className="chart-svg" viewBox={`0 0 100 ${height / 2}`} preserveAspectRatio="none" style={{ height }}>
      {data.map((d, i) => {
        const h = (d.value / max) * (height / 2 - 16)
        return (
          <g key={i}>
            <rect x={i * w + w * 0.15} y={height / 2 - h - 14}
              width={w * 0.70} height={h || 0.5}
              fill={color} rx={1} opacity={0.85} />
            <text x={i * w + w / 2} y={height / 2 - h - 16}
              fontSize="3" textAnchor="middle" fill="var(--gray-700)"
              fontFamily="var(--font-mono)" fontWeight="600">
              {d.value > 0 ? d.value : ''}
            </text>
            <text x={i * w + w / 2} y={height / 2 - 4}
              fontSize="2.8" textAnchor="middle" fill="var(--gray-500)"
              fontFamily="var(--font-mono)">
              {d.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export function DonutChart({ data, size = 140 }: {
  data: { label: string; value: number; color: string }[]
  size?: number
}) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1
  const radius = 70
  const cx = 100, cy = 100
  let acc = 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
      <svg viewBox="0 0 200 200" style={{ width: size, height: size, flexShrink: 0 }}>
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="var(--gray-150)" strokeWidth="22" />
        {data.map((d, i) => {
          const pct = d.value / total
          const start = acc * 2 * Math.PI - Math.PI / 2
          const end = (acc + pct) * 2 * Math.PI - Math.PI / 2
          acc += pct
          const x1 = cx + radius * Math.cos(start)
          const y1 = cy + radius * Math.sin(start)
          const x2 = cx + radius * Math.cos(end)
          const y2 = cy + radius * Math.sin(end)
          const largeArc = pct > 0.5 ? 1 : 0
          if (d.value === 0) return null
          return (
            <path key={i}
              d={`M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`}
              fill="none" stroke={d.color} strokeWidth="22" strokeLinecap="butt" />
          )
        })}
        <text x="100" y="92" textAnchor="middle" fontSize="32" fontWeight="700" fill="var(--gray-900)" fontFamily="var(--font-sans)">
          {total}
        </text>
        <text x="100" y="115" textAnchor="middle" fontSize="11" fill="var(--gray-500)" fontFamily="var(--font-mono)" letterSpacing="1.5">
          TOTAL
        </text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 120 }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
            <span style={{ width: 10, height: 10, background: d.color, borderRadius: 2, flexShrink: 0 }} />
            <span style={{ color: 'var(--gray-700)', flex: 1, whiteSpace: 'nowrap' }}>{d.label}</span>
            <span className="mono" style={{ fontWeight: 600, color: 'var(--gray-900)' }}>{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function AreaChart({ data, height = 140, color = 'var(--teal-500)' }: {
  data: { label: string; value: number }[]
  height?: number
  color?: string
}) {
  if (data.length < 2) return <p style={{ fontSize: 12, color: 'var(--gray-500)', textAlign: 'center', padding: 24 }}>Datos insuficientes</p>
  const max = Math.max(...data.map(d => d.value), 1)
  const w = 100, h = height / 2
  const points = data.map((d, i) => ({
    x: (i / (data.length - 1)) * w,
    y: h - 10 - (d.value / max) * (h - 16),
  }))
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const area = path + ` L ${w} ${h - 6} L 0 ${h - 6} Z`

  return (
    <svg className="chart-svg" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ height }}>
      <defs>
        <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.30" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#area-grad)" />
      <path d={path} fill="none" stroke={color} strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="0.9" fill={color} />
          <text x={p.x} y={h - 1.5} fontSize="2.5" textAnchor="middle"
            fill="var(--gray-500)" fontFamily="var(--font-mono)">
            {data[i].label}
          </text>
        </g>
      ))}
    </svg>
  )
}
