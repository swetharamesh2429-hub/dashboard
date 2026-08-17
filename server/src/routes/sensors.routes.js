import { Router } from "express";
import { createSensorsController } from "../controllers/sensors.controller.js";

export default function createSensorsRoutes(context) {
  const router = Router();
  const controller = createSensorsController(context);
  const { auth, authLimiter } = context;
  router.post(
    "/sensors/telemetry",
    auth(["OWNER", "DRIVER"]),
    controller.postSensorsTelemetry,
  );
  router.get(
    "/sensors/:vehicleId/latest",
    auth(),
    controller.getSensorsVehicleIdLatest,
  );
  router.get(
    "/sensors/:vehicleId/history",
    auth(),
    controller.getSensorsVehicleIdHistory,
  );
  router.post(
    "/telemetry/simulate",
    auth(["OWNER"]),
    controller.postTelemetrySimulate,
  );
  return router;
}
