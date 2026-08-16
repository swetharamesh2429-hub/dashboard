# UTAP — Unified Telemetry-to-Action Platform

UTAP closes the fleet-maintenance loop: Sense → Predict → Alert → Ticket → Assign → Guide → Repair → Verify → Return to service.

It is a single platform with one backend and three role-specific experiences: Fleet Owner, Driver, and Worker/Technician.

## Technology

- Client: React, Vite, Leaflet/OpenStreetMap, Recharts, Socket.IO client, PWA shell
- API: Node.js, Express, JWT, bcrypt, Socket.IO, Mongoose
- Data: MongoDB Atlas in production; deterministic demo-memory fallback locally
- Integrations: AI repair service, AR/VR fallback, proof-storage adapter, email-webhook adapter

## Project layout

```text
client/                 React application
  src/services/         Centralized API and Socket.IO services
  src/*Portal.jsx       Owner, Driver, and Worker portals
server/
  src/models.js         Mongoose collections and indexes
  src/services/         AI, telemetry prediction, proof storage, email adapters
  src/middleware/       Rate limiting and errors
  src/seed.js           Atlas demo seed
  src/*.test.js         Prediction and closed-loop API tests
```

## Run locally

1. Copy `.env.example` to `.env` and set a strong `JWT_SECRET`.
2. In one terminal: `cd server && npm install && npm run dev`.
3. In a second terminal: `cd client && npm install && npm run dev`.
4. Open the Vite URL printed in the terminal.

The API works without MongoDB for a reliable demo. With MongoDB Atlas configured, run `cd server && npm run seed` to create ABC Logistics, 12 vehicles, 5 drivers, 5 workers, sensor readings, predictions, and 10 repair tickets.

## Demo credentials

All accounts use `Demo@123`.

| Portal | Email |
| --- | --- |
| Fleet Owner | `owner@utap.demo` |
| Worker / Technician | `worker@utap.demo` |
| Driver | `driver@utap.demo` |

## Demo walkthrough

1. Sign in as Fleet Owner.
2. Use Immediate, Short-Term, or Long-Term simulation controls.
3. A telemetry prediction creates an organization-scoped repair ticket.
4. Assign the ticket to a worker.
5. Sign in as Worker, check in, start the repair, ask AI, launch AR guidance, attach proof, and complete it.
6. The ticket, vehicle health, maintenance record, audit event, and notification update.
7. Sign in as Driver to use check-in, DVIR, alert acknowledgement, and SOS flows.

## API overview

| Endpoint | Purpose |
| --- | --- |
| `POST /api/auth/register` | Role-aware account registration |
| `POST /api/auth/login` | Portal-validated JWT login |
| `POST /api/auth/forgot-password` | Reset-token delivery through configured email webhook/fallback |
| `POST /api/auth/reset-password` | Token-validated bcrypt password reset |
| `GET /api/vehicles` | Scoped, filtered, paginated fleet data |
| `GET /api/tickets` | Scoped, filtered, paginated repair tickets |
| `GET /api/workers` | Owner-scoped worker availability and attendance |
| `POST /api/telemetry/simulate` | Sensor metrics → prediction → automatic ticket |
| `POST /api/tickets/:id/assign` | Owner assignment and worker notification |
| `POST /api/tickets/:id/status` | Valid task transitions only |
| `POST /api/tickets/:id/proof` | Validated repair image and notes |
| `POST /api/ai/repair-assistant` | Contextual repair response |
| `POST /api/driver/check-in`, `/check-out`, `/dvir`, `/sos` | Driver operational actions |
| `GET /api/notifications`, `/maintenance`, `/audit-logs`, `/analytics` | Operations data |

Every protected endpoint verifies the JWT role and organization boundary. The ticket lifecycle permits only `ASSIGNED → IN_PROGRESS → COMPLETED`.

Additional resource endpoints: `GET /api/auth/me`; `POST`, `PATCH`, and `GET /api/vehicles/:id`; `POST /api/sensors/telemetry`, `GET /api/sensors/:vehicleId/latest`, and `/history`; `POST /api/predictions/analyze`, `GET /api/predictions`, and `/api/predictions/:vehicleId`; `GET /api/tickets/:id`; `GET /api/tasks/my`; `PATCH /api/notifications/:id/read`; and the owner reports `GET /api/analytics/fleet`, `/repairs`, and `/downtime`.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `MONGO_URI` | Production | MongoDB Atlas connection string |
| `JWT_SECRET` | Yes | Long random JWT signing secret; mandatory in production |
| `PORT` | No | API port, default `5000` |
| `CLIENT_URL` | Production | Allowed browser origin and reset-link base URL |
| `GEMINI_API_KEY` / `GEMINI_MODEL` | No | Google Gemini AI repair configuration |
| `EMAIL_WEBHOOK_URL` / `EMAIL_WEBHOOK_TOKEN` | No | Password-reset delivery provider |
| `REPAIR_STORAGE_PATH` | No | Local repair-proof storage path |
| `VITE_API_URL` / `VITE_SOCKET_URL` | No | Client API and realtime origins |

Do not commit `.env` files or secrets.

## AI, AR, and VR fallback behavior

- With `GEMINI_API_KEY`, the repair assistant uses Google Gemini server-side; without a key it returns a safety-first contextual answer. See the [Gemini generateContent API](https://ai.google.dev/api/generate-content?hl=en).
- Without WebXR/AR support, the worker receives a guided repair sequence.
- Without VR hardware, the worker receives an interactive training sequence.
- Without a map provider/network connection, the surrounding dashboard remains available.

## Testing

Run `cd server && npm test`.

The test suite verifies prediction thresholds and the closed loop: Owner login → telemetry simulation → ticket assignment → Worker login → start repair → complete repair.

Build the client with `cd client && npm run build`.

## Docker deployment

```bash
docker compose up --build
```

The web app is served at port `8080`; the API is at port `5000`. The compose setup mounts a named `repair_uploads` volume for local proof files. In cloud deployment, swap the proof-storage adapter for S3-compatible object storage and retain the returned proof URL contract.

Set `NODE_ENV=production`, a real `MONGO_URI`, a strong `JWT_SECRET`, and the hosted client URL before deployment.
