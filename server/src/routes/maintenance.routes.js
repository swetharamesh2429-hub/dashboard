import { Router } from "express";
import { createMaintenanceController } from "../controllers/maintenance.controller.js";

export default function createMaintenanceRoutes(context) {
  const router = Router();
  const controller = createMaintenanceController(context);
  const { auth, authLimiter } = context;
  router.get("/maintenance", auth(), controller.getMaintenance);
  return router;
}
