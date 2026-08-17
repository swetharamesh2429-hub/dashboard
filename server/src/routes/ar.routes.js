import { Router } from "express";
import { createArController } from "../controllers/ar.controller.js";

export default function createArRoutes(context) {
  const router = Router();
  const controller = createArController(context);
  const { auth, authLimiter } = context;
  router.get(
    "/ar/procedures/fault/:fault",
    auth(["WORKER"]),
    controller.getArProceduresFault,
  );
  router.get(
    "/ar/procedures/:ticketId",
    auth(["WORKER"]),
    controller.getArProcedureTicket,
  );
  return router;
}
