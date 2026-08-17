import { Router } from "express";
import { createTicketsController } from "../controllers/tickets.controller.js";

export default function createTicketsRoutes(context) {
  const router = Router();
  const controller = createTicketsController(context);
  const { auth, authLimiter } = context;
  router.get("/tickets", auth(), controller.getTickets);
  router.get("/tickets/:id", auth(), controller.getTicketsId);
  router.get("/tasks/my", auth(["WORKER"]), controller.getTasksMy);
  router.post(
    "/tickets/:id/assign",
    auth(["OWNER"]),
    controller.postTicketsIdAssign,
  );
  router.post(
    "/tickets/:id/status",
    auth(["WORKER"]),
    controller.postTicketsIdStatus,
  );
  router.post(
    "/tickets/:id/proof",
    auth(["WORKER"]),
    controller.postTicketsIdProof,
  );
  return router;
}
