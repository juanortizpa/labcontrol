-- ============================================================
-- LABCONTROL — Seed de datos demo
-- Datos basados en archivo real: LC-FR-79 V6 (Octubre 2025)
-- ============================================================

-- USUARIOS DEMO
-- Contraseñas hasheadas con bcrypt (rounds=10)
-- metro123  → $2b$10$K8pFdOr4KkMmR5VLYRzqp.9JzQKLHlNKzOQmZ1VHUqXt3EB7bHiYy
-- director1 → $2b$10$3mVjJbXGzUhJm/hWo6UdUO3HQ5mYLdM5Hk2yRivLCVoNs8GpbXnYq
INSERT INTO usuarios (cedula, nombre, password_hash, rol, email) VALUES
('12345678', 'J. Valencia',  '$2b$10$K8pFdOr4KkMmR5VLYRzqp.9JzQKLHlNKzOQmZ1VHUqXt3EB7bHiYy', 'metrologo',  'j.valencia@labcontrol.demo'),
('23456789', 'C. Carrejo',   '$2b$10$K8pFdOr4KkMmR5VLYRzqp.9JzQKLHlNKzOQmZ1VHUqXt3EB7bHiYy', 'metrologo',  'c.carrejo@labcontrol.demo'),
('34567890', 'L. Rios',      '$2b$10$K8pFdOr4KkMmR5VLYRzqp.9JzQKLHlNKzOQmZ1VHUqXt3EB7bHiYy', 'metrologo',  'l.rios@labcontrol.demo'),
('87654321', 'Director Técnico', '$2b$10$3mVjJbXGzUhJm/hWo6UdUO3HQ5mYLdM5Hk2yRivLCVoNs8GpbXnYq', 'direccion', 'director@labcontrol.demo')
ON CONFLICT (cedula) DO NOTHING;

-- EQUIPOS (basados en datos reales del Excel)
INSERT INTO equipos (codigo, descripcion, magnitud, tipo, es_pesa_patron, estado, fecha_ultima_calibracion, fecha_proxima_calibracion, frecuencia_calibracion, intervalo_medicion, division_escala, exactitud) VALUES
-- MASA
('TEC-LAB-MP-01', 'Juego de pesas M1 — 515 kg',           'Masa',        'patron',   true,  'disponible',     '2024-09-15', '2025-09-15', 'Anual',    '1 mg – 20 kg', '1 mg', 'Clase M1'),
('TEC-LAB-MP-05', 'Juego de pesas E2 — 1 mg a 500 g',     'Masa',        'patron',   true,  'disponible',     '2025-01-10', '2026-01-10', 'Anual',    '1 mg – 500 g', '0.1 mg', 'Clase E2'),
('TEC-LAB-MP-20', 'Juego de pesas F1 — 1 g a 2 kg',       'Masa',        'patron',   true,  'en_campo',       '2025-02-20', '2026-02-20', 'Anual',    '1 g – 2 kg',   '0.1 mg', 'Clase F1'),
('TEC-LAB-MP-21', 'Juego de pesas F2 — 5 g a 200 g',      'Masa',        'patron',   true,  'disponible',     '2024-11-05', '2025-11-05', 'Anual',    '5 g – 200 g',  '1 mg',   'Clase F2'),
-- TEMPERATURA
('TEC-LAB-TEM-03', 'Termómetro digital patrón',            'Temperatura', 'patron',   false, 'disponible',     '2025-03-01', '2026-03-01', 'Anual',    '-50 °C a 200 °C', '0.01 °C', '± 0.05 °C'),
('TEC-LAB-TEM-29', 'Bloque seco de temperatura',           'Temperatura', 'patron',   false, 'disponible',     '2024-08-12', '2025-08-12', 'Anual',    '-25 °C a 660 °C', '0.1 °C',  '± 0.2 °C'),
('TEC-LAB-TEM-31', 'Termómetro digital de campo',          'Temperatura', 'patron',   false, 'en_campo',       '2025-01-20', '2026-01-20', 'Anual',    '-50 °C a 150 °C', '0.1 °C',  '± 0.1 °C'),
('TEC-LAB-TEM-32', 'Bloque seco portátil',                 'Temperatura', 'patron',   false, 'en_campo',       '2024-12-10', '2025-12-10', 'Anual',    '33 °C a 450 °C',  '0.1 °C',  '± 0.3 °C'),
-- PRESIÓN / HUMEDAD
('TEC-LAB-PTHRI-02', 'Barotermohigrómetro digital',        'Presión/Humedad', 'patron', false, 'disponible',   '2025-04-05', '2026-04-05', 'Anual',    '500–1100 hPa / -20–60 °C / 0–100 %HR', '0.1 hPa', '± 0.5 hPa'),
('TEC-LAB-PTHRI-06', 'Barotermohigrómetro portátil',       'Presión/Humedad', 'patron', false, 'disponible',   '2025-06-15', '2026-06-15', 'Anual',    '600–1100 hPa / 0–50 °C / 10–90 %HR',   '1 hPa',   '± 1 hPa'),
-- PRESIÓN
('TEC-LAB-PS-03',    'Manovacuómetro reed',                'Presión',     'patron',   false, 'en_campo',       '2024-10-20', '2025-10-20', 'Anual',    '-1 a 5 bar',   '0.01 bar', '± 0.025 bar'),
('TEC-LAB-PI-01',    'Manómetro digital',                  'Presión',     'patron',   false, 'en_campo',       '2025-05-10', '2026-05-10', 'Anual',    '0 a 700 bar',  '0.01 bar', '± 0.05%'),
('BM-3',             'Bomba de presión manual',             'Presión',     'auxiliar', false, 'en_campo',       NULL,         NULL,         NULL,       '0 a 700 bar',  NULL,       NULL)
ON CONFLICT (codigo) DO NOTHING;

-- SALIDAS (Octubre 2025 — datos reales)
WITH u AS (SELECT id FROM usuarios WHERE cedula = '12345678' LIMIT 1),
     u2 AS (SELECT id FROM usuarios WHERE cedula = '23456789' LIMIT 1),
     u3 AS (SELECT id FROM usuarios WHERE cedula = '34567890' LIMIT 1)
INSERT INTO salidas (codigo_equipo, fecha_salida, cantidad_sale, empresa, os, tecnico_id,
  sal_enciende, sal_indicacion_legible, sal_bateria_cable, sal_variacion,
  sal_calibracion_vigente, sal_limpieza, sal_alteracion_sensor, sal_rayas, sal_contaminacion)
SELECT * FROM (VALUES
  ('TEC-LAB-MP-20', '2025-10-01'::date, 'Juego Completo', 'LABORATORIO DE ANALISIS MUNICIPAL', '0590-CAL-25',
   (SELECT id FROM u), 'N/A','N/A','N/A','N/A','SI','SI','NO','NO','NO'),
  ('TEC-LAB-PTHRI-02', '2025-10-01'::date, '1', 'LABORATORIO DE ANALISIS MUNICIPAL', '0590B-CAL-25',
   (SELECT id FROM u), 'SI','SI','SI','SI','SI','SI','NO','NO','NO'),
  ('TEC-LAB-TEM-31', '2025-10-01'::date, '1', 'TECNOQUIMICAS S.A.', '0582-CAL-25',
   (SELECT id FROM u), 'SI','SI','SI','SI','SI','SI','NO','NO','NO'),
  ('TEC-LAB-TEM-29', '2025-10-01'::date, '1', 'TECNOQUIMICAS S.A.', '0582B-CAL-25',
   (SELECT id FROM u), 'SI','SI','N/A','N/A','N/A','SI','N/A','NO','NO'),
  ('TEC-LAB-TEM-32', '2025-10-01'::date, '1', 'TECNOQUIMICAS S.A.', '0582C-CAL-25',
   (SELECT id FROM u), 'SI','SI','N/A','N/A','N/A','SI','N/A','NO','NO'),
  ('TEC-LAB-TEM-03', '2025-09-02'::date, '1', 'LABORATORIO SAN JORGE S.A.S', '0589-CAL-25',
   (SELECT id FROM u3), 'SI','SI','SI','SI','SI','SI','NO','NO','NO'),
  ('TEC-LAB-MP-05', '2025-10-06'::date, 'Juego Completo', 'T-VAPAN 500', '0593-CAL-25',
   (SELECT id FROM u2), 'N/A','N/A','N/A','N/A','SI','SI','N/A','NO','NO'),
  ('TEC-LAB-PTHRI-06', '2025-10-06'::date, '1', 'T-VAPAN 500', '0593B-CAL-25',
   (SELECT id FROM u2), 'SI','SI','SI','SI','SI','SI','NO','NO','NO'),
  ('TEC-LAB-PTHRI-02', '2025-10-07'::date, '1', 'FAMILIA DEL PACIFICO S.A.S', '0595-CAL-25',
   (SELECT id FROM u), 'SI','SI','SI','SI','SI','SI','NO','NO','NO'),
  ('TEC-LAB-PS-03', '2025-10-07'::date, '1', 'FAMILIA DEL PACIFICO S.A.S', '0595B-CAL-25',
   (SELECT id FROM u), 'SI','SI','SI','SI','SI','SI','NO','NO','NO'),
  ('TEC-LAB-PI-01', '2025-10-07'::date, '1', 'FAMILIA DEL PACIFICO S.A.S', '0595C-CAL-25',
   (SELECT id FROM u), 'SI','SI','SI','SI','SI','SI','NO','NO','NO'),
  ('BM-3', '2025-10-07'::date, '1', 'FAMILIA DEL PACIFICO S.A.S', '0595D-CAL-25',
   (SELECT id FROM u), 'N/A','N/A','N/A','N/A','N/A','SI','N/A','NO','NO')
) AS v(codigo_equipo, fecha_salida, cantidad_sale, empresa, os, tecnico_id,
       sal_enciende, sal_indicacion_legible, sal_bateria_cable, sal_variacion,
       sal_calibracion_vigente, sal_limpieza, sal_alteracion_sensor, sal_rayas, sal_contaminacion)
ON CONFLICT (os) DO NOTHING;

-- RETORNOS (equipos que ya regresaron)
INSERT INTO retornos (salida_id, fecha_retorno, cantidad_retornada, recibido_por,
  ret_enciende, ret_indicacion_legible, ret_bateria_cable, ret_variacion,
  ret_calibracion_vigente, ret_limpieza, ret_alteracion_sensor, ret_rayas, ret_contaminacion,
  valor_nominal, unidad_nominal, valor_medido, unidad_medida, observaciones)
SELECT
  s.id,
  '2025-10-03',
  s.cantidad_sale,
  'H. Ceballos',
  'N/A','N/A','N/A','N/A','SI','SI','NO','NO','NO',
  2000, 'g', 2000, 'g',
  'Recibidas completas y limpias.'
FROM salidas s WHERE s.os = '0590-CAL-25' ON CONFLICT DO NOTHING;

INSERT INTO retornos (salida_id, fecha_retorno, cantidad_retornada, recibido_por,
  ret_enciende, ret_indicacion_legible, ret_bateria_cable, ret_variacion,
  ret_calibracion_vigente, ret_limpieza, ret_alteracion_sensor, ret_rayas, ret_contaminacion, observaciones)
SELECT s.id, '2025-10-03', '1', 'H. Ceballos', 'SI','SI','SI','SI','SI','SI','NO','NO','NO', 'Recibido completo.'
FROM salidas s WHERE s.os = '0590B-CAL-25' ON CONFLICT DO NOTHING;

INSERT INTO retornos (salida_id, fecha_retorno, cantidad_retornada, recibido_por,
  ret_enciende, ret_indicacion_legible, ret_bateria_cable, ret_variacion,
  ret_calibracion_vigente, ret_limpieza, ret_alteracion_sensor, ret_rayas, ret_contaminacion, observaciones)
SELECT s.id, '2025-10-02', '1', 'L. Rios', 'SI','SI','SI','SI','SI','SI','NO','NO','NO', 'Recibidas completas y limpias.'
FROM salidas s WHERE s.os = '0589-CAL-25' ON CONFLICT DO NOTHING;

INSERT INTO retornos (salida_id, fecha_retorno, cantidad_retornada, recibido_por,
  ret_enciende, ret_indicacion_legible, ret_bateria_cable, ret_variacion,
  ret_calibracion_vigente, ret_limpieza, ret_alteracion_sensor, ret_rayas, ret_contaminacion,
  valor_nominal, unidad_nominal, valor_medido, unidad_medida, observaciones)
SELECT s.id, '2025-10-07', 'Juego Completo', 'J. Valencia', 'N/A','N/A','N/A','N/A','SI','SI','N/A','NO','NO',
  100, 'g', 100, 'g', 'Recibidas completas y limpias.'
FROM salidas s WHERE s.os = '0593-CAL-25' ON CONFLICT DO NOTHING;

INSERT INTO retornos (salida_id, fecha_retorno, cantidad_retornada, recibido_por,
  ret_enciende, ret_indicacion_legible, ret_bateria_cable, ret_variacion,
  ret_calibracion_vigente, ret_limpieza, ret_alteracion_sensor, ret_rayas, ret_contaminacion, observaciones)
SELECT s.id, '2025-10-07', '1', 'J. Valencia', 'SI','SI','SI','SI','SI','SI','NO','NO','NO', 'Buen estado.'
FROM salidas s WHERE s.os = '0593B-CAL-25' ON CONFLICT DO NOTHING;

-- Actualizar estados de equipos en campo
UPDATE equipos SET estado = 'en_campo' WHERE codigo IN (
  SELECT DISTINCT s.codigo_equipo FROM salidas s
  LEFT JOIN retornos r ON r.salida_id = s.id
  WHERE r.id IS NULL
);
UPDATE equipos SET estado = 'disponible' WHERE codigo IN (
  SELECT DISTINCT s.codigo_equipo FROM salidas s
  INNER JOIN retornos r ON r.salida_id = s.id
) AND estado = 'en_campo';
-- Dejar los que realmente siguen en campo
UPDATE equipos SET estado = 'en_campo' WHERE codigo IN (
  'TEC-LAB-TEM-31','TEC-LAB-TEM-29','TEC-LAB-TEM-32',
  'TEC-LAB-PS-03','TEC-LAB-PI-01','BM-3','TEC-LAB-PTHRI-02'
);

-- Un equipo vencido para mostrar bloqueo
UPDATE equipos SET estado = 'fuera_servicio', fecha_proxima_calibracion = '2024-12-01'
WHERE codigo = 'TEC-LAB-TEM-29';
