import { Router } from "express";
import { createAuthController } from "../controllers/auth.controller.js";

export default function createAuthRoutes(context) {
  const router = Router();
  const controller = createAuthController(context);
  const { auth, authLimiter } = context;
  router.post("/auth/register", authLimiter, controller.postAuthRegister);
  router.post("/auth/login", authLimiter, controller.postAuthLogin);
  router.post("/auth/logout", auth(), controller.postAuthLogout);
  router.get("/auth/me", auth(), controller.getAuthMe);
  router.post(
    "/auth/forgot-password",
    authLimiter,
    controller.postAuthForgotPassword,
  );
  router.post(
    "/auth/reset-password",
    authLimiter,
    controller.postAuthResetPassword,
  );
  return router;
}
