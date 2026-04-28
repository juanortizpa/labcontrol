import { estadoVigencia, diasParaVencer } from '@/lib/supabase'

type Props = { fechaProxima: string | null; showDias?: boolean; size?: 'sm' | 'md' }

const cfg = {
  vigente:   { label: 'Vigente',        cls: 'badge-vigente' },
  proximo:   { label: 'Próx. vencer',   cls: 'badge-proximo' },
  critico:   { label: 'Crítico',        cls: 'badge-critico' },
  vencido:   { label: 'Vencido',        cls: 'badge-vencido' },
  sin_fecha: { label: 'Sin fecha',      cls: 'badge-disponible' },
}

export default function SemaforoStatus({ fechaProxima, showDias = false }: Props) {
  const estado = estadoVigencia(fechaProxima)
  const dias = diasParaVencer(fechaProxima)
  const c = cfg[estado as keyof typeof cfg]
  return (
    <span className={`badge ${c.cls}`}>
      <span className="badge-dot" />
      {c.label}
      {showDias && dias !== null && (
        <span style={{ opacity: 0.70 }}>
          {dias < 0 ? `(${Math.abs(dias)}d)` : `(${dias}d)`}
        </span>
      )}
    </span>
  )
}
