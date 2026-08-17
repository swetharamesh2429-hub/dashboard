import createSystemRoutes from "./system.routes.js";
import createAuthRoutes from "./auth.routes.js";
import createVehiclesRoutes from "./vehicles.routes.js";
import createSensorsRoutes from "./sensors.routes.js";
import createPredictionsRoutes from "./predictions.routes.js";
import createTicketsRoutes from "./tickets.routes.js";
import createWorkersRoutes from "./workers.routes.js";
import createDriverRoutes from "./driver.routes.js";
import createWorkerRoutes from "./worker.routes.js";
import createMaintenanceRoutes from "./maintenance.routes.js";
import createNotificationsRoutes from "./notifications.routes.js";
import createAnalyticsRoutes from "./analytics.routes.js";
import createAiRoutes from "./ai.routes.js";
import createArRoutes from "./ar.routes.js";
import createTrainingRoutes from "./training.routes.js";
import createAuditRoutes from "./audit.routes.js";

export const routeFactories = [
  createSystemRoutes,
  createAuthRoutes,
  createVehiclesRoutes,
  createSensorsRoutes,
  createPredictionsRoutes,
  createTicketsRoutes,
  createWorkersRoutes,
  createDriverRoutes,
  createWorkerRoutes,
  createMaintenanceRoutes,
  createNotificationsRoutes,
  createAnalyticsRoutes,
  createAiRoutes,
  createArRoutes,
  createTrainingRoutes,
  createAuditRoutes,
];
