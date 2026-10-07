# font-vib — Dashboard Vivero Smart

Frontend SPA en React + Vite para el monitoreo IoT de viveros/invernaderos. Consume la API **back-vib** ([ard-vib-back](https://github.com/Otochicatole/ard-vib-back)) para mostrar telemetría en tiempo casi real, historial, actuadores y simulación de envíos.

**Repositorio:** [github.com/Otochicatole/ard-vib-front](https://github.com/Otochicatole/ard-vib-front)

> Nota: la carpeta local se llama `font-vib` (typo histórico de “front”); el repo remoto es `ard-vib-front`.

---

## Tabla de contenidos

1. [Descripción](#descripción)
2. [Stack tecnológico](#stack-tecnológico)
3. [Estructura del proyecto](#estructura-del-proyecto)
4. [Requisitos previos](#requisitos-previos)
5. [Instalación y arranque](#instalación-y-arranque)
6. [Conexión con el backend](#conexión-con-el-backend)
7. [Arquitectura de la UI](#arquitectura-de-la-ui)
8. [Flujo de datos y estado](#flujo-de-datos-y-estado)
9. [Componentes](#componentes)
10. [Servicio API](#servicio-api)
11. [Tipos](#tipos)
12. [Funcionalidades de usuario](#funcionalidades-de-usuario)
13. [Estilos y diseño](#estilos-y-diseño)
14. [Scripts npm](#scripts-npm)
15. [Límites y trabajo futuro](#límites-y-trabajo-futuro)

---

## Descripción

**Vivero Smart** es un panel de control de una sola página que permite:

- Seleccionar un nodo IoT registrado.
- Ver KPIs ambientales (temperatura, humedad, suelo, luz, CO₂) con rangos ideales y estados.
- Visualizar el estado de actuadores (bomba, extractor, luces) en solo lectura.
- Filtrar historial por ventana temporal y límite de registros.
- Graficar series múltiples (SVG propio).
- Revisar una tabla paginada y exportar CSV.
- Simular un `POST` de telemetría desde el navegador (útil sin hardware).

No hay autenticación ni enrutado multi-página: todo vive en `App.tsx`.

---

## Stack tecnológico

| Capa | Tecnología |
|------|------------|
| UI | React 19 + TypeScript |
| Build / Dev | Vite 8 (`@vitejs/plugin-react`) |
| Iconos | `lucide-react` |
| Gráficas | SVG custom (sin Chart.js / Recharts) |
| Lint | Oxlint |
| Estado | React hooks locales (`useState` / `useEffect` / `useMemo`) |
| Routing | Ninguno (SPA de una vista) |

---

## Estructura del proyecto

```
font-vib/
├── index.html
├── vite.config.ts          # Puerto 5173 + proxy /api → backend
├── package.json
├── public/
│   ├── favicon.svg
│   └── icons.svg
└── src/
    ├── main.tsx            # Entry + StrictMode
    ├── App.tsx             # Orquestación de estado y layout
    ├── App.css             # Estilos de layout y componentes
    ├── index.css           # Tokens CSS, tipografía, reset
    ├── components/
    │   ├── Header.tsx
    │   ├── MetricCard.tsx
    │   ├── ActuatorsPanel.tsx
    │   ├── FiltersBar.tsx
    │   ├── TelemetryChart.tsx
    │   ├── RecentTable.tsx
    │   └── SimulateModal.tsx
    ├── services/
    │   └── api.ts          # Cliente HTTP hacia /api
    ├── types/
    │   └── telemetry.ts
    └── assets/
```

---

## Requisitos previos

- **Node.js** 20+
- Backend **back-vib** corriendo y accesible en el puerto del proxy (ver siguiente sección)
- (Opcional) Seed del back para datos demo: `npx tsx prisma/seed.ts` en `back-vib`

---

## Instalación y arranque

```bash
cd font-vib

npm install
npm run dev
```

Abrir: [http://localhost:5173](http://localhost:5173)

Build de producción:

```bash
npm run build
npm run preview
```

Lint:

```bash
npm run lint
```

---

## Conexión con el backend

En desarrollo, el cliente llama rutas **relativas** (`/api/...`). Vite las reenvía:

```ts
// vite.config.ts
server: {
  port: 5173,
  proxy: {
    '/api':    { target: 'http://localhost:3001', changeOrigin: true },
    '/health': { target: 'http://localhost:3001', changeOrigin: true },
  },
}
```

```
Browser (:5173)
  → fetch('/api/devices')
  → Vite proxy
  → http://localhost:3001/api/devices
```

| Pieza | Valor por defecto |
|-------|-------------------|
| Frontend | `5173` |
| Proxy target | `3001` |
| Backend `.env.example` | `PORT=3000` |

**Importante:** alinear puertos. Opciones:

1. En el back: `PORT=3001` en `.env`, o  
2. En el front: cambiar `target` del proxy a `http://localhost:3000`.

En producción, servir el build estático detrás del mismo origen que el API, o configurar un reverse proxy equivalente a `/api`.

No se usan variables `import.meta.env` hoy: la base es fija `API_BASE = '/api'`.

---

## Arquitectura de la UI

```
main.tsx
  └── App.tsx
        ├── Header              (dispositivo, refresh, simular)
        ├── MetricCard × 5      (KPIs)
        ├── ActuatorsPanel      (estado relays)
        ├── FiltersBar          (rango, límite, series, CSV)
        ├── TelemetryChart      (histórico)
        ├── RecentTable         (tabla paginada)
        └── SimulateModal       (POST telemetría)
```

Capas lógicas:

| Capa | Responsabilidad |
|------|-----------------|
| `App.tsx` | Estado global de la vista, polling, carga paralela latest+history |
| `services/api.ts` | Fetch tipado, query params, manejo de errores HTTP |
| `types/` | Contratos alineados con el API |
| `components/` | Presentación y UX; reciben props, sin llamadas HTTP (salvo el modal vía callback/`sendTelemetry`) |

---

## Flujo de datos y estado

Estado principal en `App.tsx`:

| Estado | Default | Rol |
|--------|---------|-----|
| `devices` | `[]` | Lista de nodos |
| `selectedDevice` | `'vivero-nodo-01'` | Nodo activo |
| `latest` | `null` | Última medición |
| `history` | `[]` | Serie temporal |
| `timeRange` | `'24h'` | Preset de filtro |
| `limit` | `100` | Máx. puntos de historial |
| `activeMetrics` | temp/hum/suelo on | Series visibles en el chart |
| `autoRefreshInterval` | `10000` ms | Polling (`0` = pausado) |
| `isSimulateModalOpen` | `false` | Modal de simulación |

Efectos:

1. **Carga de dispositivos** al montar → si el seleccionado no está en la lista, elige el primero.
2. **Carga de datos** al cambiar `selectedDevice` / `timeRange` / `limit` → `Promise.all` de latest + history.
3. **Polling** con `setInterval` mientras el intervalo sea `> 0`.

Derivados:

- `stats`: min/max por variable sobre `history`.
- Export CSV generado en cliente a partir de `history`.

---

## Componentes

### `Header`

- Marca **Vivero Smart**
- `<select>` de dispositivos (`name (id)`)
- Intervalo de auto-refresh: 5s / 10s / 30s / 1m / Pausado
- Botones Refrescar y Simular Envío
- Badge “En Línea” + marca de última sincronización

### `MetricCard`

Tarjeta KPI con:

- Tema visual: `temp` | `humidity` | `soil` | `light` | `co2`
- Valor + unidad, rango ideal, pill de estado (`optimal` | `warning` | `alert`)
- Min/max del historial filtrado

Umbrales orientativos (definidos en `App.tsx`), ejemplos:

- Temperatura: alerta si `>30` o `<14`; warning fuera de 18–26 °C
- Suelo: alerta si `<35 %`
- CO₂: warning si `>1000` ppm

### `ActuatorsPanel`

Muestra `waterPump`, `exhaustFan`, `growLight` de la última medición (ACTIVO / INACTIVO). **No envía comandos** al hardware.

### `FiltersBar`

- Ventanas: `1h` | `6h` | `24h` | `7d` | `all`
- Límites: 50 / 100 / 250
- Toggles de series del gráfico
- Exportar CSV + conteo de registros

### `TelemetryChart`

Gráfico SVG multi-serie (línea + área), orden cronológico, tooltip al hover. Dominios Y fijos por variable (ej. temp 0–50, luz 0–2000, CO₂ 300–1500).

### `RecentTable`

Tabla paginada (10 filas/página) con sensores y actuadores.

### `SimulateModal`

Formulario → `POST /api/telemetry` con sensores y checkboxes de actuadores. Incluye “Generar Aleatorios”. Tras éxito cierra y dispara recarga de datos.

---

## Servicio API

Archivo: [`src/services/api.ts`](./src/services/api.ts)

Base: `const API_BASE = '/api'`

| Función | Método | Ruta | Notas |
|---------|--------|------|-------|
| `fetchDevices` | GET | `/api/devices` | Devuelve `data.data ?? []` |
| `fetchLatestTelemetry(deviceId)` | GET | `/api/telemetry/:id/latest` | `404` → `null` |
| `fetchTelemetryHistory(deviceId, timeRange, limit)` | GET | `/api/telemetry/:id/history` | Query `limit`; `from` ISO si el preset no es `all` |
| `sendTelemetry(payload)` | POST | `/api/telemetry` | Body JSON de medición |

El front **no** llama a `/health` ni a `POST /api/devices` (el registro de dispositivos se hace vía API/Swagger/seed o auto-registro al ingerir telemetría).

Cálculo de `from` en el cliente según preset:

| Preset | `from` |
|--------|--------|
| `1h` | ahora − 1 h |
| `6h` | ahora − 6 h |
| `24h` | ahora − 24 h |
| `7d` | ahora − 7 d |
| `all` | omitido |

---

## Tipos

Archivo: [`src/types/telemetry.ts`](./src/types/telemetry.ts)

```ts
type Measurement = {
  id: string
  deviceId: string
  recordedAt: string
  temperature: number | null
  humidity: number | null
  soilMoisture: number | null
  light: number | null
  co2: number | null
  waterPump: boolean | null
  exhaustFan: boolean | null
  growLight: boolean | null
}

type Device = {
  id: string
  name: string
  location: string | null
  createdAt: string
  updatedAt: string
}

type TimeRangePreset = '1h' | '6h' | '24h' | '7d' | 'all'
```

Deben mantenerse alineados con las respuestas del backend.

---

## Funcionalidades de usuario

| Feature | Descripción |
|---------|-------------|
| Dashboard KPI | 5 métricas con estado y extremos del rango filtrado |
| Selector de nodo | Cambia el contexto de latest + history |
| Auto-refresh | Actualización periódica sin WebSockets |
| Actuadores | Estado ON/OFF de la última muestra |
| Filtros temporales | Ventanas y límite de puntos |
| Gráfico | Series conmutables + tooltip |
| Tabla reciente | Paginación local |
| CSV | Columnas: ID, Dispositivo, Fecha_Hora, sensores, actuadores (SI/NO) |
| Simular envío | Prueba de ingesta sin Arduino |

---

## Estilos y diseño

- **Tipografía:** Plus Jakarta Sans, Inter, JetBrains Mono (Google Fonts en `index.css`).
- **Tokens en `:root`:** fondos slate/blanco, primario esmeralda `#059669`, colores por sensor, sombras y radios.
- **`App.css`:** layout completo (header, grids, chart, tabla, modal) con breakpoints ~1280 / 992 / 640.
- Sin Tailwind ni CSS Modules: clases globales.

Dirección visual: dashboard claro, acento verde vivero, tipografía expresiva (no stack system por defecto).

---

## Scripts npm

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Servidor Vite + HMR |
| `npm run build` | `tsc -b` + bundle de producción |
| `npm run preview` | Sirve el build localmente |
| `npm run lint` | Oxlint |

---

## Límites y trabajo futuro

Estado actual deliberadamente simple:

- Sin auth / roles
- Sin WebSockets (solo polling)
- Actuadores solo lectura (sin endpoint de control)
- Sin tests automatizados en el front
- Puerto del proxy hardcodeado en `vite.config.ts`
- Dispositivo por defecto hardcodeado: `vivero-nodo-01`

Mejoras naturales: variables `VITE_API_URL`, control de actuadores, notificaciones/alertas, y tests de componentes del servicio API.

---

## Relación con el monorepo local

En el workspace `ard-vib`:

```
ard-vib/
├── back-vib/   → API (este flujo de datos)
└── font-vib/   → este dashboard
```

Cada carpeta es un repositorio git independiente (`ard-vib-back` / `ard-vib-front`).
