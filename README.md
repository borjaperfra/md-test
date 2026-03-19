# Manfred Daily

Herramienta interna del equipo de Manfred para curar, generar y programar el newsletter diario de ofertas tech en Telegram (@getmanfred).

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 14 (App Router) |
| Lenguaje | TypeScript 5 |
| Base de datos | PostgreSQL (Supabase) vía Prisma 7 |
| Auth | NextAuth v4 — Google OAuth (@getmanfred.com) |
| IA | Claude API (Anthropic) — Haiku 4.5 |
| Acortador de URLs | Bit.ly API |
| Mensajería | Telegram Bot API |
| Estilos | Tailwind CSS |
| Despliegue | Railway |

---

## Estructura del proyecto

```
src/
├── app/
│   ├── layout.tsx                  # Layout raíz (sidebar + sesión)
│   ├── page.tsx                    # Redirige a /offers
│   ├── login/page.tsx              # Pantalla de login (Google OAuth)
│   ├── offers/                     # Pool de ofertas
│   ├── generator/                  # Generador de mensaje
│   ├── scheduled/                  # Mensajes programados
│   ├── analytics/                  # Analítica (clicks + views)
│   └── api/
│       ├── auth/[...nextauth]/     # Handler NextAuth
│       ├── offers/                 # CRUD de ofertas + búsqueda IA
│       ├── message/                # Generación de mensaje
│       ├── telegram/               # Envío, programación y cron
│       └── analytics/              # Estadísticas
├── components/
│   ├── layout/                     # Sidebar, PageHeader, UserMenu
│   ├── offers/                     # Tabla, formularios, panel de selección
│   ├── generator/                  # Botón Telegram
│   └── ui/                         # Componentes base (Button, Toast, etc.)
├── context/
│   └── OfferPoolContext.tsx        # Estado global de ofertas y selección
├── lib/
│   ├── auth.ts                     # Config NextAuth
│   ├── prisma.ts                   # Cliente Prisma (singleton)
│   ├── telegram.ts                 # sendTelegramMessage, getMessageViews
│   ├── bitly.ts                    # shortenUrl, getClickCount
│   ├── generateMessage.ts          # Formateo del mensaje de Telegram
│   ├── utils.ts                    # formatSalary, formatDate, cn
│   ├── parseSalary.ts              # Salary string → número (para ordenar)
│   ├── suggestFive.ts              # Algoritmo de sugerencia de 5 ofertas
│   └── getEnding.ts                # Lee endings del CSV por fecha
├── middleware.ts                   # Protege rutas (getToken de NextAuth)
└── instrumentation.ts             # Cron interno (setInterval cada minuto)

prisma/
└── schema.prisma                   # Modelos de base de datos

references/
└── endings-md.csv                  # Datos históricos del día (mes, día, texto)
```

---

## Modelos de base de datos

### `Offer`
Representa una oferta de empleo en el pool.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | String (CUID) | PK |
| `title` | String | Título del puesto |
| `company` | String | Empresa |
| `type` | Enum | `manfred` \| `client` \| `external` |
| `modality` | Enum | `remote` \| `hybrid` \| `onsite` |
| `salary` | String? | p.ej. `€70K`, `€60-80K`, `€20/h` |
| `url` | String | URL original de la oferta |
| `shortUrl` | String? | URL acortada por Bit.ly |
| `status` | Enum | `pending` \| `selected` \| `discarded` |
| `order` | Int? | Posición en la selección (0-4) |
| `location` | String? | Ciudad/provincia para híbridas/presenciales |
| `isFreelance` | Boolean | Si es contrato freelance |
| `publishedAt` | DateTime? | Cuándo se publicó en Telegram |

### `ScheduledMessage`
Mensajes enviados o programados para Telegram.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | String (CUID) | PK |
| `message` | String | Texto completo del mensaje |
| `offerIds` | String? | JSON array de IDs de ofertas |
| `offersSnapshot` | String? | JSON con datos de ofertas (para históricos) |
| `scheduledAt` | DateTime? | Cuándo enviar (null = enviar inmediatamente) |
| `sentAt` | DateTime? | Cuándo se envió realmente |
| `status` | Enum | `pending` \| `sent` \| `failed` \| `cancelled` |
| `telegramId` | String? | ID del mensaje en Telegram (para estadísticas) |
| `views` | Int? | Snapshot de visualizaciones antes de la eliminación |
| `createdBy` | String? | Email del usuario que creó/programó el mensaje |

---

## API Endpoints

### Ofertas `/api/offers`

| Método | Ruta | Acción |
|--------|------|--------|
| GET | `/api/offers` | Lista ofertas activas (no publicadas) |
| GET | `/api/offers?archived=true` | Lista ofertas archivadas (ya publicadas) |
| POST | `/api/offers` | Crea una oferta manualmente |
| DELETE | `/api/offers` | Borra todas las ofertas activas |
| PATCH | `/api/offers/[id]` | Actualiza campos de una oferta (incluye `publishedAt` para restaurar) |
| POST | `/api/offers/select` | Marca hasta 5 ofertas como seleccionadas |
| POST | `/api/offers/fetch-url` | Extrae datos de una oferta desde su URL (Claude) |
| POST | `/api/offers/search` | Búsqueda automática de ofertas (Claude + web_search) |

### Mensajes `/api/message`

| Método | Ruta | Acción |
|--------|------|--------|
| GET | `/api/message/greeting` | Genera saludo del día con IA |
| GET | `/api/message/ending` | Devuelve el dato histórico del día (desde CSV) |
| POST | `/api/message/generate` | Genera el mensaje completo de Telegram |

### Telegram `/api/telegram`

| Método | Ruta | Auth |
|--------|------|------|
| POST | `/api/telegram/schedule` | Crea/programa un mensaje | Sesión |
| PATCH | `/api/telegram/schedule/[id]` | Edita un mensaje programado | Sesión |
| DELETE | `/api/telegram/schedule/[id]` | Elimina un mensaje | Sesión |
| POST | `/api/telegram/cron` | Procesa mensajes pendientes | `CRON_SECRET` header |
| POST | `/api/telegram/snapshot` | Captura views de Telegram | `CRON_SECRET` header |

### Analítica `/api/analytics`

| Método | Ruta | Acción |
|--------|------|--------|
| GET | `/api/analytics` | Estadísticas agregadas (clicks + views) |
| DELETE | `/api/analytics/[id]` | Elimina un mensaje del historial |

---

## Cron interno (`instrumentation.ts`)

Arranca una sola vez cuando el servidor Node.js se inicia. Usa `setInterval` alineado al inicio del minuto.

- **Cada minuto:** llama a `/api/telegram/cron` → envía mensajes cuyo `scheduledAt ≤ now`. Notifica a Slack en éxito o fallo.
- **A las 23:00, 23:30 y 23:55 (hora Madrid):** llama a `/api/telegram/snapshot` → guarda las visualizaciones antes de que el mensaje se elimine del canal a las 23:59.

> ⚠️ El cron solo funciona mientras el servidor esté corriendo. En Railway (servidor persistente) corre continuamente. No es compatible con Vercel (serverless).

## Notificaciones Slack

Se envían notificaciones automáticas al webhook configurado en `SLACK_WEBHOOK_URL`:

- 📅 Cuando se programa un mensaje (día, hora y usuario)
- ✅ Cuando el cron envía el mensaje correctamente
- ⚠️ Cuando el cron falla al enviar

---

## Autenticación

- **NextAuth v4** con proveedor Google OAuth
- Solo se permiten cuentas `@getmanfred.com`
- El middleware (`src/middleware.ts`) protege todas las rutas excepto `/login`, `/api/auth/*` y los endpoints del cron
- El JWT se verifica usando `getToken` de `next-auth/jwt`

---

## Flujo de trabajo diario

```
1. BUSCAR OFERTAS
   /offers → "Buscar ofertas" → Claude busca en Manfred + portales + LinkedIn
   O añadir manualmente / importar desde URL

2. SELECCIONAR Y ORDENAR
   Marcar hasta 5 ofertas → Arrastrar para ordenar → "Guardar selección"

3. GENERAR MENSAJE
   /generator → Saludo (IA) + Ending (CSV) → "Generar Mensaje"
   El borrador se guarda automáticamente en localStorage

4. ENVIAR O PROGRAMAR
   "Enviar ahora" → publica inmediatamente en @getmanfred
   "Programar"    → se enviará a la hora elegida (hora Madrid)
   → Las ofertas incluidas se archivan automáticamente
   → Se envía notificación a Slack

5. ANALÍTICA
   /analytics → clicks por oferta (Bit.ly) + visualizaciones Telegram
   Top 5 ofertas filtrable por semana, mes e histórico
```

---

## Scripts

```bash
npm run dev          # Servidor de desarrollo (localhost:3000)
npm run build        # Build de producción (incluye prisma generate)
npm run start        # Servidor de producción
npm run db:generate  # Regenerar cliente Prisma tras cambios en schema
npm run db:push      # Sincronizar schema con la DB
npm run db:migrate   # Crear migración formal
npm run db:studio    # Abrir Prisma Studio (UI para la DB)
```
