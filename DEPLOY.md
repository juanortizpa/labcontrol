# Guía de Deploy — LabControl Demo
## Tiempo estimado: 20 minutos

---

## PASO 1: Crear proyecto en Supabase (5 min)

1. Ir a https://supabase.com → "Start your project" → Crear cuenta gratis
2. Click "New project"
   - Organization: tu cuenta personal
   - Name: `labcontrol-demo`
   - Database Password: guardar esto (lo necesitas después)
   - Region: South America (São Paulo)
3. Esperar 2 minutos mientras se crea el proyecto

4. Ir a **SQL Editor** (menú izquierdo) → "New query"
5. Pegar TODO el contenido de `database/schema.sql` → Run
6. Crear nueva query → pegar TODO el contenido de `database/seed.sql` → Run

> ⚠️ Las contraseñas del seed ya están hasheadas con bcrypt. No las modifiques.

7. Ir a **Settings** → **API**:
   - Copiar "Project URL" → la necesitas en el paso 3
   - Copiar "anon public" key → la necesitas en el paso 3

---

## PASO 2: Subir código a GitHub (3 min)

```bash
# En tu computadora, dentro de la carpeta labcontrol/
git init
git add .
git commit -m "LabControl demo inicial"

# Crear repositorio en github.com/new (puede ser privado)
# Luego:
git remote add origin https://github.com/TU_USUARIO/labcontrol.git
git push -u origin main
```

---

## PASO 3: Desplegar en Vercel (5 min)

1. Ir a https://vercel.com → "Sign up with GitHub"
2. Click "Add New Project"
3. Importar el repositorio `labcontrol`
4. Framework Preset: **Next.js** (detectado automático)
5. En **Environment Variables**, agregar:

| Variable | Valor |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Tu Project URL de Supabase (ej: https://abcdef.supabase.co) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Tu anon key de Supabase |
| `JWT_SECRET` | Una cadena aleatoria de 32+ caracteres (ej: `labcontrol-clave-super-segura-2025`) |

6. Click **Deploy**
7. Esperar 2-3 minutos → Vercel te da una URL tipo `labcontrol.vercel.app`

---

## PASO 4: Verificar que funciona (2 min)

1. Abrir la URL que te dio Vercel
2. Login con metrólogo:
   - Cédula: `12345678`
   - Contraseña: `metro123`
3. Login con dirección:
   - Cédula: `87654321`
   - Contraseña: `director1`

---

## Flujo de demo para mostrar al cliente

### Como Metrólogo (12345678 / metro123):

1. **Dashboard** — Ver stats, equipos en campo, alertas de calibración
2. **Nueva Salida**:
   - Buscar `TEC-LAB-MP-05` → se autocompleta información
   - Llenar OS: `0601-CAL-25`, Empresa: `Tu empresa cliente`
   - Completar evaluación visual (9 preguntas)
   - Registrar → regresa al dashboard
3. **Nuevo Retorno**:
   - Seleccionar equipo de la lista (solo muestra los en campo)
   - Ver datos de la salida original
   - Completar evaluación de retorno
   - Si es pesa patrón: llenar valor nominal y medido
4. **Historial** — Ver todos los movimientos

### Como Dirección (87654321 / director1):
5. **Catálogo de equipos** — Ver semáforo verde/amarillo/rojo, estados

---

## Datos precargados (del Excel real del cliente)

### Equipos en campo (salida abierta):
- TEC-LAB-TEM-31 · TEC-LAB-TEM-29 · TEC-LAB-TEM-32
- TEC-LAB-PS-03 · TEC-LAB-PI-01 · BM-3 · TEC-LAB-PTHRI-02

### Equipos disponibles para nueva salida:
- TEC-LAB-MP-01 · TEC-LAB-MP-05 · TEC-LAB-MP-21
- TEC-LAB-TEM-03 · TEC-LAB-PTHRI-06

### Equipo bloqueado (para mostrar Regla 1):
- TEC-LAB-TEM-29 · fuera de servicio, calibración vencida desde 2024-12

---

## Posibles problemas y soluciones

**Error: "Cannot find module bcryptjs"**
```bash
npm install
```

**Error de Supabase en producción**
- Verificar que las variables de entorno están bien escritas en Vercel
- Settings → Environment Variables en Vercel

**Login no funciona**
- Verificar que el seed SQL se ejecutó correctamente
- En Supabase SQL Editor: `SELECT cedula, rol FROM usuarios;`
- Debes ver 4 filas

**Equipos no aparecen**
- En Supabase SQL Editor: `SELECT codigo, estado FROM equipos;`
- Debes ver 13 equipos

---

## URL final de la demo

```
https://labcontrol-XXXXX.vercel.app

Metrólogo: 12345678 / metro123
Dirección: 87654321 / director1
```

> Guarda estas credenciales para compartir con el cliente.
