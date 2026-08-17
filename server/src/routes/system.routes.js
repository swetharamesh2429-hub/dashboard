import { Router } from "express";
import { createSystemController } from "../controllers/system.controller.js";

export default function createSystemRoutes(context) {
  const router = Router();
  const controller = createSystemController(context);
  const { auth, authLimiter } = context;
  router.get("/health", controller.getHealth);
  return router;
}
