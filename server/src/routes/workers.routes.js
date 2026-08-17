import { Router } from "express";
import { createWorkersController } from "../controllers/workers.controller.js";

export default function createWorkersRoutes(context) {
  const router = Router();
  const controller = createWorkersController(context);
  const { auth, authLimiter } = context;
  router.get("/workers", auth(["OWNER"]), controller.getWorkers);
  router.get("/workers/:id", auth(["OWNER"]), controller.getWorkersId);
  router.patch("/workers/:id/status", auth(["OWNER"]), controller.patchWorkersIdStatus);
  return router;
}
