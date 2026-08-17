import { Router } from "express";
import { createDriverController } from "../controllers/driver.controller.js";

export default function createDriverRoutes(context) {
  const router = Router();
  const controller = createDriverController(context);
  const { auth, authLimiter } = context;
  router.get("/driver/vehicle", auth(["DRIVER"]), controller.getDriverVehicle);
  router.post(
    "/driver/check-in",
    auth(["DRIVER"]),
    controller.postDriverCheckIn,
  );
  router.post(
    "/driver/check-out",
    auth(["DRIVER"]),
    controller.postDriverCheckOut,
  );
  router.post("/driver/dvir", auth(["DRIVER"]), controller.postDriverDvir);
  router.post("/driver/sos", auth(["DRIVER"]), controller.postDriverSos);
  return router;
}
