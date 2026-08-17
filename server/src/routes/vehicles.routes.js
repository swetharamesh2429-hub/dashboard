import { Router } from "express";
import { createVehiclesController } from "../controllers/vehicles.controller.js";

export default function createVehiclesRoutes(context) {
  const router = Router();
  const controller = createVehiclesController(context);
  const { auth, authLimiter } = context;
  router.get("/vehicles", auth(), controller.getVehicles);
  router.get("/vehicles/:id", auth(), controller.getVehiclesId);
  router.post("/vehicles", auth(["OWNER"]), controller.postVehicles);
  router.patch("/vehicles/:id", auth(["OWNER"]), controller.patchVehiclesId);
  return router;
}
