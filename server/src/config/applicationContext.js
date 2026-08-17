import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import mongoose from "mongoose";
import { rateLimit } from "../middleware/rateLimit.js";
import { createAuth } from "../middleware/auth.js";
import { scoped } from "../middleware/org-scope.js";
import {
  Organization,
  User,
  Vehicle,
  RepairTicket,
  MaintenanceRecord,
  Notification,
  AuditLog,
  ARProcedure,
  SensorReading,
  Prediction,
} from "../models.js";
import { answerRepairQuestion } from "../services/repairAssistant.js";
import { predictMaintenance } from "../services/predictionEngine.js";
import { saveRepairProof } from "../services/proofStorage.js";
import { sendPasswordResetEmail } from "../services/emailService.js";

export function createApplicationContext({ io, jwtSecret }) {
  const org = "abc-logistics",
    hash = bcrypt.hashSync("Demo@123", 10);
  const users = [
    ["owner-1", "Ananya Kapoor", "owner@utap.demo", "OWNER"],
    ["driver-1", "Arjun Mehta", "driver@utap.demo", "DRIVER"],
    ["worker-1", "Asha Nair", "worker@utap.demo", "WORKER"],
    ["worker-2", "Maria Silva", "maria@utap.demo", "WORKER"],
    ["worker-3", "Dev Kumar", "dev@utap.demo", "WORKER"],
  ].map(([id, name, email, role]) => ({
    id,
    name,
    email,
    role,
    organizationId: org,
    password: hash,
    active: true,
  }));
  const vehicles = [
    "245",
    "118",
    "302",
    "091",
    "411",
    "633",
    "277",
    "510",
    "709",
    "830",
    "904",
    "125",
  ].map((id, index) => ({
    id: `vehicle-${id}`,
    organizationId: org,
    vehicleId: `TRUCK #${id}`,
    driverId: index === 0 ? "driver-1" : null,
    status: index === 0 ? "IN_GARAGE" : index === 2 ? "REPAIRING" : "ON_ROAD",
    health: index === 0 ? 42 : index === 2 ? 38 : Math.min(98, 65 + index * 3),
    lat: 13.05 + index * 0.012,
    lng: 80.2 + index * 0.01,
  }));
  let tickets = [
    {
      id: "UT-2048",
      organizationId: org,
      vehicleId: "vehicle-245",
      vehicle: "TRUCK #245",
      fault: "Battery Voltage Instability",
      risk: "IMMEDIATE",
      rootCause: "Alternator regulator fluctuation",
      status: "ASSIGNED",
      workerId: null,
      deadline: "2026-08-15T15:00:00Z",
    },
    {
      id: "UT-2047",
      organizationId: org,
      vehicleId: "vehicle-302",
      vehicle: "TRUCK #302",
      fault: "Wiring Fault",
      risk: "IMMEDIATE",
      rootCause: "Damaged harness insulation",
      status: "IN_PROGRESS",
      workerId: "worker-2",
      deadline: "2026-08-15T13:30:00Z",
    },
    {
      id: "UT-2043",
      organizationId: org,
      vehicleId: "vehicle-118",
      vehicle: "TRUCK #118",
      fault: "Brake Pad Wear",
      risk: "SHORT-TERM",
      rootCause: "Pad thickness below threshold",
      status: "ASSIGNED",
      workerId: "worker-3",
      deadline: "2026-08-16T10:00:00Z",
    },
  ];
  let notifications = [],
    records = [],
    audits = [];
  const resetTokens = new Map();
  let mongoEnabled = false;
  const audit = (user, action, entity, entityId) =>
    audits.unshift({
      id: `audit-${Date.now()}`,
      organizationId: user.organizationId,
      userId: user.id,
      action,
      entity,
      entityId,
      timestamp: new Date().toISOString(),
    });
  const notify = (organizationId, userId, message) => {
    const n = {
      id: `notice-${Date.now()}`,
      organizationId,
      userId,
      message,
      read: false,
      timestamp: new Date().toISOString(),
    };
    notifications.unshift(n);
    io.to(userId || organizationId).emit("notification:new", n);
    return n;
  };
  const auth = createAuth(jwtSecret);
  const authLimiter = rateLimit({ windowMs: 60_000, max: 10 });
  const paged = (rows, query = {}) => {
    const page = Math.max(1, Number(query.page) || 1),
      limit = Math.min(100, Math.max(1, Number(query.limit) || 20)),
      start = (page - 1) * limit;
    return {
      items: rows.slice(start, start + limit),
      page,
      limit,
      total: rows.length,
      totalPages: Math.ceil(rows.length / limit),
    };
  };
  const serializeTicket = (ticket) => ({
    id: String(ticket._id || ticket.id),
    organizationId: String(ticket.organizationId),
    vehicleId: String(ticket.vehicleId?._id || ticket.vehicleId),
    vehicle: ticket.vehicleId?.vehicleId || ticket.vehicle || "",
    fault: ticket.fault,
    issue: ticket.fault || ticket.issue,
    risk: ticket.risk,
    rootCause: ticket.rootCause,
    confidence: ticket.confidence,
    status: ticket.status,
    workerId: ticket.workerId
      ? String(ticket.workerId._id || ticket.workerId)
      : null,
    deadline: ticket.deadline,
    due: ticket.deadline,
  });
  const serializeVehicle = (vehicle) => ({
    id: String(vehicle._id || vehicle.id),
    organizationId: String(vehicle.organizationId),
    vehicleId: vehicle.vehicleId,
    driverId: vehicle.driverId
      ? String(vehicle.driverId._id || vehicle.driverId)
      : null,
    status: vehicle.status,
    health: vehicle.health,
    location: vehicle.location || { lat: vehicle.lat, lng: vehicle.lng },
  });

  const context = {
    get mongoEnabled() {
      return mongoEnabled;
    },
    jwt,
    bcrypt,
    crypto,
    mongoose,
    Organization,
    User,
    Vehicle,
    RepairTicket,
    MaintenanceRecord,
    Notification,
    AuditLog,
    ARProcedure,
    SensorReading,
    Prediction,
    answerRepairQuestion,
    predictMaintenance,
    saveRepairProof,
    sendPasswordResetEmail,
    scoped,
    org,
    users,
    vehicles,
    tickets,
    notifications,
    records,
    audits,
    resetTokens,
    audit,
    notify,
    paged,
    serializeTicket,
    serializeVehicle,
    io,
    jwtSecret,
    auth,
    authLimiter,
  };

  return {
    context,
    setMongoEnabled: (value) => {
      mongoEnabled = value;
    },
  };
}
