import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'
import ExcelJS from 'exceljs'

const ESTADO_LABELS: Record<string, string> = {
  disponible:     'Disponible',
  en_campo:       'En campo',
  en_calibracion: 'En calibración',
  fuera_servicio: 'Fuera de servicio',
}
const ESTADO_BG: Record<string, string> = {
  disponible:     'FFD1FAE5',
  en_campo:       'FFDBEAFE',
  en_calibracion: 'FFFEF3C7',
  fuera_servicio: 'FFFEE2E2',
}

export async function GET(_req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const db = supabaseAdmin()
  const { data: equipos, error } = await db
    .from('equipos')
    .select('*')
    .eq('activo', true)
    .order('magnitud')
    .order('codigo')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const wb = new ExcelJS.Workbook()
  wb.creator = 'LabControl'
  wb.created = new Date()

  const ws = wb.addWorksheet('LC-FR-10 Inventario', {
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1 },
  })

  // ── Fila 1: Título ──────────────────────────────────────────────────────────
  ws.mergeCells('A1:O1')
  const t = ws.getCell('A1')
  t.value = 'INVENTARIO INSTRUMENTOS DE MEDICIÓN  —  LC-FR-10 V5'
  t.font  = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } }
  t.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D9488' } }
  t.alignment = { horizontal: 'center', vertical: 'middle' }
  ws.getRow(1).height = 28

  // ── Fila 2: Metadatos ───────────────────────────────────────────────────────
  ws.mergeCells('A2:O2')
  const m = ws.getCell('A2')
  m.value = `TECSERVICE S.A.S.   |   Generado: ${new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}   |   Usuario: ${session.nombre}`
  m.font  = { size: 9, italic: true, color: { argb: 'FF6B7280' } }
  m.alignment = { horizontal: 'center' }
  ws.getRow(2).height = 16

  // ── Fila 3: Encabezados de columna ──────────────────────────────────────────
  const COLS = [
    { header: 'Magnitud',                                     width: 14 },
    { header: 'Tipo',                                         width: 10 },
    { header: 'Código',                                       width: 20 },
    { header: 'Instrumento / Patrón / Material de referencia', width: 38 },
    { header: 'Intervalo de medición / Valor nominal',        width: 24 },
    { header: 'División de escala',                           width: 16 },
    { header: 'Error máximo permitido / Exactitud',           width: 22 },
    { header: 'Frec. calibración\n(meses)',                   width: 13 },
    { header: 'Frec. Mtto\n(meses)',                          width: 12 },
    { header: 'Frec. Verificación\n(meses)',                  width: 14 },
    { header: 'Estado',                                       width: 16 },
    { header: 'Última calibración',                           width: 16 },
    { header: 'Próxima calibración',                          width: 17 },
    { header: 'Días vigencia',                                width: 12 },
    { header: 'Observaciones',                                width: 32 },
  ]

  COLS.forEach(({ width }, i) => { ws.getColumn(i + 1).width = width })

  const hdrRow = ws.getRow(3)
  hdrRow.height = 38
  COLS.forEach(({ header }, i) => {
    const c = hdrRow.getCell(i + 1)
    c.value = header
    c.font      = { bold: true, size: 9, color: { argb: 'FFFFFFFF' } }
    c.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } }
    c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    c.border    = borderThin('FF374151')
  })

  // ── Filas de datos ──────────────────────────────────────────────────────────
  const hoy = new Date()
  ;(equipos ?? []).forEach((eq, idx) => {
    const fechaUlt  = eq.fecha_ultima_calibracion  ? new Date(eq.fecha_ultima_calibracion)  : null
    const fechaProx = eq.fecha_proxima_calibracion ? new Date(eq.fecha_proxima_calibracion) : null
    const dias      = fechaProx ? Math.floor((fechaProx.getTime() - hoy.getTime()) / 86_400_000) : null
    const rowBg     = idx % 2 === 1 ? 'FFF9FAFB' : 'FFFFFFFF'

    const values: (string | number | Date | null)[] = [
      eq.magnitud,
      eq.tipo === 'patron' ? 'Patrón' : 'Auxiliar',
      eq.codigo,
      eq.descripcion,
      eq.intervalo_medicion   ?? '',
      eq.division_escala      ?? '',
      eq.exactitud            ?? '',
      eq.frecuencia_calibracion    ?? '',
      eq.intervalo_mantenimiento   ?? '',
      eq.verificacion_intermedia   ?? '',
      ESTADO_LABELS[eq.estado] ?? eq.estado,
      fechaUlt,
      fechaProx,
      dias,
      eq.observaciones ?? '',
    ]

    const row = ws.getRow(4 + idx)
    values.forEach((v, i) => {
      const cell   = row.getCell(i + 1)
      cell.value   = v
      cell.font    = { size: 9 }
      cell.fill    = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } }
      cell.border  = borderThin('FFE5E7EB')
    })

    // Fechas
    row.getCell(12).numFmt = 'dd/mm/yyyy'
    row.getCell(13).numFmt = 'dd/mm/yyyy'

    // Estado — color de fondo
    const estadoCell = row.getCell(11)
    estadoCell.alignment = { horizontal: 'center' }
    if (ESTADO_BG[eq.estado]) {
      estadoCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ESTADO_BG[eq.estado] } }
    }

    // Días vigencia — color de fuente
    if (dias !== null) {
      const dc = row.getCell(14)
      dc.alignment = { horizontal: 'center' }
      if (dias < 0)        dc.font = { size: 9, bold: true, color: { argb: 'FFDC2626' } }
      else if (dias <= 5)  dc.font = { size: 9, bold: true, color: { argb: 'FFDC2626' } }
      else if (dias <= 15) dc.font = { size: 9, color:      { argb: 'FFD97706' } }
      else                 dc.font = { size: 9, color:      { argb: 'FF16A34A' } }
    }
  })

  ws.views       = [{ state: 'frozen', xSplit: 0, ySplit: 3, topLeftCell: 'A4', activeCell: 'A4' }]
  ws.autoFilter  = { from: 'A3', to: 'O3' }

  const buffer = await wb.xlsx.writeBuffer()
  return new NextResponse(buffer as ArrayBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="LC-FR-10-inventario-${isoDate()}.xlsx"`,
    },
  })
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function borderThin(argb: string): ExcelJS.Borders {
  const s = { style: 'thin' as const, color: { argb } }
  return { top: s, bottom: s, left: s, right: s, diagonal: {} }
}
function isoDate() { return new Date().toISOString().split('T')[0] }
