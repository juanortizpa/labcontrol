import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import path from 'path'
import fs from 'fs/promises'

const PLANTILLAS: Record<string, { file: string; nombre: string }> = {
  balanza:     { file: 'cert-balanza.xlsx',     nombre: 'TM028-Certificado-Balanza.xlsx'     },
  manometro:   { file: 'cert-manometro.xlsx',   nombre: 'TP046-Certificado-Manometro.xlsx'   },
  micropipeta: { file: 'cert-micropipeta.xlsx', nombre: 'TVO005-Certificado-Micropipeta.xlsx' },
  inventario:  { file: 'LC-FR-10-inventario.xlsx', nombre: 'LC-FR-10-Inventario-Plantilla.xlsx' },
}

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const tipo = req.nextUrl.searchParams.get('tipo') ?? ''
  const p    = PLANTILLAS[tipo]
  if (!p) return NextResponse.json({ error: 'Tipo de plantilla no válido' }, { status: 400 })

  const filePath = path.join(process.cwd(), 'templates', p.file)
  try {
    const buffer = await fs.readFile(filePath)
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${p.nombre}"`,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Archivo de plantilla no encontrado en el servidor' }, { status: 404 })
  }
}
