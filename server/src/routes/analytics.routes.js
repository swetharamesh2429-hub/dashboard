import { Router } from "express";
import { createAnalyticsController } from "../controllers/analytics.controller.js";

export default function createAnalyticsRoutes(context) {
  const router = Router();
  const controller = createAnalyticsController(context);
  const { auth, authLimiter } = context;
  router.get("/analytics", auth(["OWNER"]), controller.getAnalytics);
  router.get("/analytics/fleet", auth(["OWNER"]), controller.getAnalyticsReport);
  router.get("/analytics/repairs", auth(["OWNER"]), controller.getAnalyticsReport);
  router.get("/analytics/downtime", auth(["OWNER"]), controller.getAnalyticsReport);
  router.get(
    "/analytics/:report",
    auth(["OWNER"]),
    controller.getAnalyticsReport,
  );
  return router;
}
