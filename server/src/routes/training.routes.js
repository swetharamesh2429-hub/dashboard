import { Router } from "express";
import { createTrainingController } from "../controllers/training.controller.js";

export default function createTrainingRoutes(context) {
  const router = Router();
  const controller = createTrainingController(context);
  const { auth, authLimiter } = context;
  router.get("/training/vr", auth(["WORKER"]), controller.getTrainingVr);
  return router;
}
