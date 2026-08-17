import { Router } from "express";
import { createNotificationsController } from "../controllers/notifications.controller.js";

export default function createNotificationsRoutes(context) {
  const router = Router();
  const controller = createNotificationsController(context);
  const { auth, authLimiter } = context;
  router.get("/notifications", auth(), controller.getNotifications);
  router.patch(
    "/notifications/:id/read",
    auth(),
    controller.patchNotificationsIdRead,
  );
  return router;
}
