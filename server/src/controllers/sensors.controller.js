export function createSensorsController(context) {
  const {
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
  } = context;
  return {
    postSensorsTelemetry: async (req, res) => {
      const { vehicleId, metrics = {} } = req.body;
      if (!vehicleId)
        return res.status(400).json({ message: "Vehicle ID is required." });
      if (context.mongoEnabled) {
        if (!mongoose.isValidObjectId(vehicleId))
          return res
            .status(400)
            .json({ message: "Invalid vehicle identifier." });
        const vehicle = await Vehicle.findOne({
          _id: vehicleId,
          organizationId: req.user.organizationId,
        });
        if (!vehicle)
          return res.status(404).json({ message: "Vehicle not found." });
        const reading = await SensorReading.create({
          organizationId: req.user.organizationId,
          vehicleId: vehicle._id,
          metrics,
        });
        return res
          .status(201)
          .json({
            id: String(reading._id),
            vehicleId: String(vehicle._id),
            metrics: reading.metrics,
            timestamp: reading.createdAt,
          });
      }
      const vehicle = scoped(vehicles, req.user).find(
        (item) => item.id === vehicleId,
      );
      if (!vehicle)
        return res.status(404).json({ message: "Vehicle not found." });
      const reading = {
        id: `sensor-${Date.now()}`,
        organizationId: req.user.organizationId,
        vehicleId,
        metrics,
        timestamp: new Date().toISOString(),
      };
      records.unshift(reading);
      res.status(201).json(reading);
    },
    getSensorsVehicleIdLatest: async (req, res) => {
      if (context.mongoEnabled) {
        if (!mongoose.isValidObjectId(req.params.vehicleId))
          return res
            .status(400)
            .json({ message: "Invalid vehicle identifier." });
        const reading = await SensorReading.findOne({
          organizationId: req.user.organizationId,
          vehicleId: req.params.vehicleId,
        })
          .sort({ createdAt: -1 })
          .lean();
        return reading
          ? res.json({
              id: String(reading._id),
              vehicleId: String(reading.vehicleId),
              metrics: reading.metrics,
              timestamp: reading.createdAt,
            })
          : res.status(404).json({ message: "No sensor readings found." });
      }
      const reading = scoped(records, req.user).find(
        (item) => item.vehicleId === req.params.vehicleId && item.metrics,
      );
      if (!reading)
        return res.status(404).json({ message: "No sensor readings found." });
      res.json(reading);
    },
    getSensorsVehicleIdHistory: async (req, res) => {
      if (context.mongoEnabled) {
        if (!mongoose.isValidObjectId(req.params.vehicleId))
          return res
            .status(400)
            .json({ message: "Invalid vehicle identifier." });
        const rows = await SensorReading.find({
          organizationId: req.user.organizationId,
          vehicleId: req.params.vehicleId,
        })
          .sort({ createdAt: -1 })
          .limit(Math.min(Number(req.query.limit) || 50, 200))
          .lean();
        return res.json(
          rows.map((row) => ({
            id: String(row._id),
            vehicleId: String(row.vehicleId),
            metrics: row.metrics,
            timestamp: row.createdAt,
          })),
        );
      }
      res.json(
        scoped(records, req.user)
          .filter(
            (item) => item.vehicleId === req.params.vehicleId && item.metrics,
          )
          .slice(0, Math.min(Number(req.query.limit) || 50, 200)),
      );
    },
    postTelemetrySimulate: async (req, res) => {
      const prediction = predictMaintenance(
        req.body.metrics || {
          batteryVoltage: req.body.risk === "IMMEDIATE" ? 11.4 : 12.2,
          brakePadMm: req.body.risk === "SHORT-TERM" ? 3.5 : 7,
        },
      );
      const deadline = new Date(
        Date.now() + (prediction.risk === "IMMEDIATE" ? 4 : 24) * 3600000,
      );
      if (context.mongoEnabled) {
        const vehicle = await Vehicle.findOne({
          organizationId: req.user.organizationId,
          vehicleId: req.body.vehicleLabel || "TRUCK #091",
        });
        if (!vehicle)
          return res
            .status(404)
            .json({ message: "Demo vehicle not found in this organization." });
        vehicle.health =
          prediction.risk === "IMMEDIATE"
            ? 42
            : prediction.risk === "SHORT-TERM"
              ? 68
              : 88;
        await vehicle.save();
        const created = await RepairTicket.create({
          organizationId: req.user.organizationId,
          vehicleId: vehicle._id,
          fault: prediction.fault,
          risk: prediction.risk,
          rootCause: prediction.rootCause,
          confidence: prediction.confidence,
          status: "ASSIGNED",
          deadline,
        });
        const ticket = serializeTicket({
          ...created.toObject(),
          vehicleId: vehicle,
        });
        await Promise.all([
          AuditLog.create({
            organizationId: req.user.organizationId,
            userId: req.user.id,
            action: "TICKET_CREATED",
            entity: "RepairTicket",
            entityId: String(created._id),
          }),
          Notification.create({
            organizationId: req.user.organizationId,
            message: `New ${prediction.risk} risk detected for ${vehicle.vehicleId}.`,
          }),
        ]);
        io.to(req.user.organizationId).emit("ticket:created", ticket);
        return res.status(201).json(ticket);
      }
      const vehicle =
        vehicles.find((v) => v.id === req.body.vehicleId) ||
        vehicles.find((v) => v.id === "vehicle-091");
      vehicle.health =
        prediction.risk === "IMMEDIATE"
          ? 42
          : prediction.risk === "SHORT-TERM"
            ? 68
            : 88;
      const ticket = {
        id: `UT-${Date.now()}`,
        organizationId: req.user.organizationId,
        vehicleId: vehicle.id,
        vehicle: vehicle.vehicleId,
        fault: prediction.fault,
        risk: prediction.risk,
        rootCause: prediction.rootCause,
        confidence: prediction.confidence,
        status: "ASSIGNED",
        workerId: null,
        deadline: deadline.toISOString(),
      };
      tickets.unshift(ticket);
      audit(req.user, "TICKET_CREATED", "RepairTicket", ticket.id);
      notify(
        org,
        null,
        `New ${prediction.risk} risk detected for ${vehicle.vehicleId}.`,
      );
      io.to(org).emit("ticket:created", ticket);
      res.status(201).json(ticket);
    },
  };
}
