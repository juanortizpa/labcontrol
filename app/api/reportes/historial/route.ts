import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'
import ExcelJS from 'exceljs'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const desde  = searchParams.get('desde')
  const hasta  = searchParams.get('hasta')
  const estado = searchParams.get('estado') ?? 'todos'

  const db = supabaseAdmin()
  let query = db
    .from('salidas')
    .select('*, equipos(descripcion, magnitud), usuarios(nombre), retornos(*)')
    .order('fecha_salida', { ascending: false })

  if (desde) query = query.gte('fecha_salida', desde)
  if (hasta) query = query.lte('fecha_salida', hasta + 'T23:59:59')

  const { data: salidas, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let registros = salidas ?? []
  if (estado === 'campo')     registros = registros.filter(s => !s.retornos?.length)
  if (estado === 'retornado') registros = registros.filter(s =>  s.retornos?.length > 0)

  const wb = new ExcelJS.Workbook()
  wb.creator = 'LabControl'
  wb.created = new Date()

  const ws = wb.addWorksheet('Historial de movimientos', {
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1 },
  })

  // ── Fila 1: Título ──────────────────────────────────────────────────────────
  ws.mergeCells('A1:K1')
  const t = ws.getCell('A1')
  t.value = 'HISTORIAL DE MOVIMIENTOS DE EQUIPOS  —  LabControl'
  t.font  = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } }
  t.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D9488' } }
  t.alignment = { horizontal: 'center', vertical: 'middle' }
  ws.getRow(1).height = 28

  // ── Fila 2: Metadatos ───────────────────────────────────────────────────────
  ws.mergeCells('A2:K2')
  const periodoStr =
    desde && hasta ? `Del ${desde} al ${hasta}` :
    desde          ? `Desde ${desde}` :
    hasta          ? `Hasta ${hasta}` :
    'Todos los períodos'
  const estadoStr =
    estado === 'campo'     ? 'Solo en campo' :
    estado === 'retornado' ? 'Solo retornados' :
    'Todos'
  const m = ws.getCell('A2')
  m.value = `TECSERVICE S.A.S.  |  Período: ${periodoStr}  |  Estado: ${estadoStr}  |  ${registros.length} registros  |  Generado: ${new Date().toLocaleDateString('es-CO')}`
  m.font  = { size: 9, italic: true, color: { argb: 'FF6B7280' } }
  m.alignment = { horizontal: 'center' }
  ws.getRow(2).height = 16

  // ── Fila 3: Encabezados ─────────────────────────────────────────────────────
  const COLS = [
    { header: 'Fecha salida',         width: 14 },
    { header: 'Código equipo',        width: 20 },
    { header: 'Descripción',          width: 34 },
    { header: 'Magnitud',             width: 14 },
    { header: 'N° Orden de Servicio', width: 24 },
    { header: 'Empresa',              width: 30 },
    { header: 'Técnico',              width: 22 },
    { header: 'Fecha retorno',        width: 14 },
    { header: 'Recibido por',         width: 20 },
    { header: 'Días en campo',        width: 13 },
    { header: 'Estado',               width: 14 },
  ]
  COLS.forEach(({ width }, i) => { ws.getColumn(i + 1).width = width })

  const hdrRow = ws.getRow(3)
  hdrRow.height = 30
  COLS.forEach(({ header }, i) => {
    const c = hdrRow.getCell(i + 1)
    c.value     = header
    c.font      = { bold: true, size: 9, color: { argb: 'FFFFFFFF' } }
    c.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } }
    c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    c.border    = borderThin('FF374151')
  })

  // ── Filas de datos ──────────────────────────────────────────────────────────
  const hoy = new Date()
  registros.forEach((s, idx) => {
    const ret     = s.retornos?.[0] ?? null
    const salDate = new Date(s.fecha_salida)
    const retDate = ret?.fecha_retorno ? new Date(ret.fecha_retorno) : null
    const dias    = retDate
      ? Math.floor((retDate.getTime() - salDate.getTime()) / 86_400_000)
      : Math.floor((hoy.getTime() - salDate.getTime()) / 86_400_000)
    const enCampo = !ret
    const rowBg   = idx % 2 === 1 ? 'FFF9FAFB' : 'FFFFFFFF'

    const values: (string | number | Date | null)[] = [
      salDate,
      s.codigo_equipo,
      s.equipos?.descripcion ?? '',
      s.equipos?.magnitud    ?? '',
      s.os,
      s.empresa,
      s.usuarios?.nombre ?? '',
      retDate,
      ret?.recibido_por ?? '',
      dias,
      enCampo ? 'En campo' : 'Retornado',
    ]

    const row = ws.getRow(4 + idx)
    values.forEach((v, i) => {
      const cell  = row.getCell(i + 1)
      cell.value  = v
      cell.font   = { size: 9 }
      cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } }
      cell.border = borderThin('FFE5E7EB')
    })

    row.getCell(1).numFmt = 'dd/mm/yyyy'
    row.getCell(8).numFmt = 'dd/mm/yyyy'

    // Días en campo — color
    const dc = row.getCell(10)
    dc.alignment = { horizontal: 'center' }
    if (enCampo && dias >= 8) dc.font = { size: 9, bold: true, color: { argb: 'FFDC2626' } }

    // Estado — color de fondo
    const ec = row.getCell(11)
    ec.alignment = { horizontal: 'center' }
    if (enCampo) {
      ec.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } }
      if (dias >= 8) ec.font = { size: 9, bold: true, color: { argb: 'FFDC2626' } }
    } else {
      ec.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } }
    }
  })

  ws.views      = [{ state: 'frozen', xSplit: 0, ySplit: 3, topLeftCell: 'A4', activeCell: 'A4' }]
  ws.autoFilter = { from: 'A3', to: 'K3' }

  const buffer = await wb.xlsx.writeBuffer()
  return new NextResponse(buffer as ArrayBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="historial-movimientos-${isoDate()}.xlsx"`,
    },
  })
}

function borderThin(argb: string): ExcelJS.Borders {
  const s = { style: 'thin' as const, color: { argb } }
  return { top: s, bottom: s, left: s, right: s, diagonal: {} }
}
function isoDate() { return new Date().toISOString().split('T')[0] }
