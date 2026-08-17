import { Router } from "express";
import { createAuditController } from "../controllers/audit.controller.js";

export default function createAuditRoutes(context) {
  const router = Router();
  const controller = createAuditController(context);
  const { auth, authLimiter } = context;
  router.get("/audit-logs", auth(["OWNER"]), controller.getAuditLogs);
  return router;
}
