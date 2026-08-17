import { Router } from "express";
import { createAiController } from "../controllers/ai.controller.js";

export default function createAiRoutes(context) {
  const router = Router();
  const controller = createAiController(context);
  const { auth, authLimiter } = context;
  router.post(
    "/ai/repair-assistant",
    auth(["WORKER"]),
    controller.postAiRepairAssistant,
  );
  return router;
}
