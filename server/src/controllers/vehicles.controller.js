export function createVehiclesController(context) {
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
    getVehicles: async (req, res) => {
      let rows = context.mongoEnabled
        ? (
            await Vehicle.find({
              organizationId: req.user.organizationId,
            }).lean()
          ).map(serializeVehicle)
        : scoped(vehicles, req.user);
      if (req.query.status)
        rows = rows.filter((vehicle) => vehicle.status === req.query.status);
      if (req.query.risk)
        rows = rows.filter(
          (vehicle) =>
            Number(vehicle.health) < 60 === (req.query.risk === "IMMEDIATE"),
        );
      res.json(paged(rows, req.query));
    },
    getVehiclesId: async (req, res) => {
      const row = context.mongoEnabled
        ? mongoose.isValidObjectId(req.params.id) &&
          (await Vehicle.findOne({
            _id: req.params.id,
            organizationId: req.user.organizationId,
          }).lean())
        : scoped(vehicles, req.user).find(
            (vehicle) => vehicle.id === req.params.id,
          );
      if (!row) return res.status(404).json({ message: "Vehicle not found." });
      res.json(context.mongoEnabled ? serializeVehicle(row) : row);
    },
    postVehicles: async (req, res) => {
      const {
        vehicleId,
        driverId = null,
        status = "ON_ROAD",
        health = 100,
        location = {},
      } = req.body;
      if (!vehicleId || !String(vehicleId).trim())
        return res.status(400).json({ message: "Vehicle ID is required." });
      if (
        !Number.isFinite(Number(health)) ||
        Number(health) < 0 ||
        Number(health) > 100
      )
        return res
          .status(400)
          .json({ message: "Health must be between 0 and 100." });
      if (context.mongoEnabled) {
        if (
          driverId &&
          (!mongoose.isValidObjectId(driverId) ||
            !(await User.exists({
              _id: driverId,
              organizationId: req.user.organizationId,
              role: "DRIVER",
            })))
        )
          return res
            .status(400)
            .json({ message: "Driver must belong to this organization." });
        const vehicle = await Vehicle.create({
          organizationId: req.user.organizationId,
          vehicleId: String(vehicleId).trim(),
          driverId: driverId || null,
          status,
          health: Number(health),
          location,
        });
        await AuditLog.create({
          organizationId: req.user.organizationId,
          userId: req.user.id,
          action: "VEHICLE_CREATED",
          entity: "Vehicle",
          entityId: String(vehicle._id),
        });
        return res.status(201).json(serializeVehicle(vehicle));
      }
      const vehicle = {
        id: `vehicle-${Date.now()}`,
        organizationId: req.user.organizationId,
        vehicleId: String(vehicleId).trim(),
        driverId,
        status,
        health: Number(health),
        location,
      };
      vehicles.unshift(vehicle);
      audit(req.user, "VEHICLE_CREATED", "Vehicle", vehicle.id);
      res.status(201).json(vehicle);
    },
    patchVehiclesId: async (req, res) => {
      const allowed = ["driverId", "status", "health", "location"];
      const changes = Object.fromEntries(
        Object.entries(req.body).filter(([key]) => allowed.includes(key)),
      );
      if (
        "health" in changes &&
        (!Number.isFinite(Number(changes.health)) ||
          Number(changes.health) < 0 ||
          Number(changes.health) > 100)
      )
        return res
          .status(400)
          .json({ message: "Health must be between 0 and 100." });
      if (context.mongoEnabled) {
        if (!mongoose.isValidObjectId(req.params.id))
          return res
            .status(400)
            .json({ message: "Invalid vehicle identifier." });
        if (
          changes.driverId &&
          (!mongoose.isValidObjectId(changes.driverId) ||
            !(await User.exists({
              _id: changes.driverId,
              organizationId: req.user.organizationId,
              role: "DRIVER",
            })))
        )
          return res
            .status(400)
            .json({ message: "Driver must belong to this organization." });
        const vehicle = await Vehicle.findOneAndUpdate(
          { _id: req.params.id, organizationId: req.user.organizationId },
          changes,
          { new: true },
        ).lean();
        if (!vehicle)
          return res.status(404).json({ message: "Vehicle not found." });
        await AuditLog.create({
          organizationId: req.user.organizationId,
          userId: req.user.id,
          action: "VEHICLE_UPDATED",
          entity: "Vehicle",
          entityId: req.params.id,
        });
        return res.json(serializeVehicle(vehicle));
      }
      const vehicle = scoped(vehicles, req.user).find(
        (item) => item.id === req.params.id,
      );
      if (!vehicle)
        return res.status(404).json({ message: "Vehicle not found." });
      Object.assign(vehicle, changes);
      audit(req.user, "VEHICLE_UPDATED", "Vehicle", vehicle.id);
      res.json(vehicle);
    },
  };
}
