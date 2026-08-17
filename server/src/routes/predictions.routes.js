import { Router } from "express";
import { createPredictionsController } from "../controllers/predictions.controller.js";

export default function createPredictionsRoutes(context) {
  const router = Router();
  const controller = createPredictionsController(context);
  const { auth, authLimiter } = context;
  router.post(
    "/predictions/analyze",
    auth(["OWNER", "DRIVER"]),
    controller.postPredictionsAnalyze,
  );
  router.get("/predictions", auth(), controller.getPredictions);
  router.get(
    "/predictions/:vehicleId",
    auth(),
    controller.getPredictionsVehicleId,
  );
  return router;
}
