import { Router } from "express";
import { createWorkersController } from "../controllers/workers.controller.js";

export default function createWorkersRoutes(context) {
  const router = Router();
  const controller = createWorkersController(context);
  const { auth, authLimiter } = context;
  router.get("/workers", auth(["OWNER"]), controller.getWorkers);
  return router;
}
