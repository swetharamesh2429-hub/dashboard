import "dotenv/config";
import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { connectDatabase } from "./config/database.js";
import { createApplicationContext } from "./config/applicationContext.js";
import { routeFactories } from "./routes/index.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import path from "node:path";

const app = express(),
  http = createServer(app);
if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET)
  throw new Error("JWT_SECRET is required in production.");
const jwtSecret = process.env.JWT_SECRET || "development-secret";
const io = new Server(http, {
  cors: { origin: process.env.CLIENT_URL || "http://localhost:5173" },
});
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json({ limit: "2mb" }));
app.use(
  "/uploads",
  express.static(process.env.REPAIR_STORAGE_PATH || path.resolve("uploads")),
);
const { context, setMongoEnabled } = createApplicationContext({
  io,
  jwtSecret,
});

routeFactories.forEach((createRoutes) =>
  app.use("/api", createRoutes(context)),
);

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentication required."));
    socket.user = jwt.verify(token, jwtSecret);
    next();
  } catch {
    return next(new Error("Authentication required."));
  }
});
io.on("connection", (socket) => {
  socket.join(socket.user.id);
  if (socket.user.role === "OWNER") socket.join(socket.user.organizationId);
});
app.use(notFound);
app.use(errorHandler);
connectDatabase()
  .then((connected) => {
    setMongoEnabled(connected);
  })
  .catch((error) => console.error("Database connection failed:", error.message))
  .finally(() =>
    http.listen(process.env.PORT || 5000, () =>
      console.log("UTAP API listening"),
    ),
  );
