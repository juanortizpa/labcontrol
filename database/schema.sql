-- ============================================================
-- LABCONTROL — Schema para Supabase
-- Sistema de Control de Despacho y Retorno de Equipos
-- ============================================================

-- USUARIOS
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cedula VARCHAR(12) UNIQUE NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  password_hash TEXT NOT NULL,
  rol TEXT CHECK (rol IN ('metrologo', 'direccion')) DEFAULT 'metrologo',
  email TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- EQUIPOS
CREATE TABLE IF NOT EXISTS equipos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo VARCHAR(30) UNIQUE NOT NULL,
  descripcion TEXT NOT NULL,
  magnitud TEXT NOT NULL,
  tipo TEXT CHECK (tipo IN ('patron', 'auxiliar')) DEFAULT 'patron',
  es_pesa_patron BOOLEAN DEFAULT false,
  estado TEXT CHECK (estado IN ('disponible','en_campo','en_calibracion','fuera_servicio')) DEFAULT 'disponible',
  fecha_ultima_calibracion DATE,
  fecha_proxima_calibracion DATE,
  frecuencia_calibracion TEXT,
  verificacion_intermedia TEXT,
  intervalo_mantenimiento TEXT,
  intervalo_medicion TEXT,
  division_escala TEXT,
  exactitud TEXT,
  observaciones TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SALIDAS
CREATE TABLE IF NOT EXISTS salidas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo_equipo TEXT REFERENCES equipos(codigo) ON UPDATE CASCADE,
  fecha_salida DATE NOT NULL,
  cantidad_sale TEXT NOT NULL DEFAULT '1',
  empresa TEXT NOT NULL,
  os TEXT UNIQUE NOT NULL,
  tecnico_id UUID REFERENCES usuarios(id),
  sal_enciende TEXT DEFAULT 'N/A',
  sal_indicacion_legible TEXT DEFAULT 'N/A',
  sal_bateria_cable TEXT DEFAULT 'N/A',
  sal_variacion TEXT DEFAULT 'N/A',
  sal_calibracion_vigente TEXT DEFAULT 'N/A',
  sal_limpieza TEXT DEFAULT 'N/A',
  sal_alteracion_sensor TEXT DEFAULT 'N/A',
  sal_rayas TEXT DEFAULT 'N/A',
  sal_contaminacion TEXT DEFAULT 'N/A',
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RETORNOS
CREATE TABLE IF NOT EXISTS retornos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salida_id UUID REFERENCES salidas(id),
  fecha_retorno DATE NOT NULL,
  cantidad_retornada TEXT NOT NULL,
  recibido_por TEXT NOT NULL,
  ret_enciende TEXT DEFAULT 'N/A',
  ret_indicacion_legible TEXT DEFAULT 'N/A',
  ret_bateria_cable TEXT DEFAULT 'N/A',
  ret_variacion TEXT DEFAULT 'N/A',
  ret_calibracion_vigente TEXT DEFAULT 'N/A',
  ret_limpieza TEXT DEFAULT 'N/A',
  ret_alteracion_sensor TEXT DEFAULT 'N/A',
  ret_rayas TEXT DEFAULT 'N/A',
  ret_contaminacion TEXT DEFAULT 'N/A',
  valor_nominal NUMERIC(14,4),
  unidad_nominal TEXT,
  valor_medido NUMERIC(14,4),
  unidad_medida TEXT,
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ÍNDICES
CREATE INDEX IF NOT EXISTS idx_equipos_estado ON equipos(estado);
CREATE INDEX IF NOT EXISTS idx_equipos_magnitud ON equipos(magnitud);
CREATE INDEX IF NOT EXISTS idx_equipos_fecha_cal ON equipos(fecha_proxima_calibracion);
CREATE INDEX IF NOT EXISTS idx_salidas_equipo ON salidas(codigo_equipo);
CREATE INDEX IF NOT EXISTS idx_salidas_fecha ON salidas(fecha_salida);
CREATE INDEX IF NOT EXISTS idx_retornos_salida ON retornos(salida_id);

-- RLS (Row Level Security) - desactivar para demo
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE equipos DISABLE ROW LEVEL SECURITY;
ALTER TABLE salidas DISABLE ROW LEVEL SECURITY;
ALTER TABLE retornos DISABLE ROW LEVEL SECURITY;

-- FUNCIÓN: calcular estado_vigencia de un equipo
CREATE OR REPLACE FUNCTION estado_vigencia(fecha_proxima DATE)
RETURNS TEXT AS $$
BEGIN
  IF fecha_proxima IS NULL THEN RETURN 'sin_fecha'; END IF;
  IF fecha_proxima < CURRENT_DATE THEN RETURN 'vencido'; END IF;
  IF fecha_proxima <= CURRENT_DATE + INTERVAL '5 days' THEN RETURN 'critico'; END IF;
  IF fecha_proxima <= CURRENT_DATE + INTERVAL '15 days' THEN RETURN 'proximo'; END IF;
  RETURN 'vigente';
END;
$$ LANGUAGE plpgsql;

-- VISTA: historial unificado
CREATE OR REPLACE VIEW historial AS
SELECT
  s.id,
  s.fecha_salida,
  s.os,
  s.codigo_equipo,
  e.descripcion AS equipo_descripcion,
  e.magnitud,
  s.empresa,
  u.nombre AS tecnico_nombre,
  s.cantidad_sale,
  r.fecha_retorno,
  r.recibido_por,
  r.cantidad_retornada,
  CASE WHEN r.id IS NULL THEN 'en_campo' ELSE 'retornado' END AS estado_movimiento,
  s.created_at
FROM salidas s
LEFT JOIN equipos e ON s.codigo_equipo = e.codigo
LEFT JOIN usuarios u ON s.tecnico_id = u.id
LEFT JOIN retornos r ON r.salida_id = s.id
ORDER BY s.fecha_salida DESC;
