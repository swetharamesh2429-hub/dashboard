import { Router } from "express";
import { createWorkerController } from "../controllers/worker.controller.js";

export default function createWorkerRoutes(context) {
  const router = Router();
  const controller = createWorkerController(context);
  const { auth, authLimiter } = context;
  router.post(
    "/worker/check-in",
    auth(["WORKER"]),
    controller.postWorkerCheckIn,
  );
  return router;
}
