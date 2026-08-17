export function createDriverController(context) {
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
    getDriverVehicle: async (req, res) => {
      if (context.mongoEnabled) {
        const vehicle = await Vehicle.findOne({
          organizationId: req.user.organizationId,
          driverId: req.user.id,
        }).lean();
        if (!vehicle)
          return res
            .status(404)
            .json({ message: "No vehicle is assigned to this driver." });
        const ticket = await RepairTicket.findOne({
          organizationId: req.user.organizationId,
          vehicleId: vehicle._id,
          status: { $ne: "COMPLETED" },
        })
          .sort({ createdAt: -1 })
          .lean();
        return res.json({
          vehicle: serializeVehicle(vehicle),
          risk: ticket?.risk || "HEALTHY",
          fault: ticket?.fault || null,
          metrics: {
            temperature: 91,
            batteryVoltage: vehicle.health < 60 ? 11.4 : 14.1,
            fuel: 68,
          },
        });
      }
      const vehicle = vehicles.find((item) => item.driverId === req.user.id);
      if (!vehicle)
        return res
          .status(404)
          .json({ message: "No vehicle is assigned to this driver." });
      const ticket = tickets.find(
        (item) => item.vehicleId === vehicle.id && item.status !== "COMPLETED",
      );
      res.json({
        vehicle: serializeVehicle(vehicle),
        risk: ticket?.risk || "HEALTHY",
        fault: ticket?.fault || null,
        metrics: {
          temperature: 91,
          batteryVoltage: vehicle.health < 60 ? 11.4 : 14.1,
          fuel: 68,
        },
      });
    },
    postDriverCheckIn: async (req, res) => {
      if (context.mongoEnabled) {
        await User.findByIdAndUpdate(req.user.id, {
          $set: { "profile.checkedIn": true },
        });
        await AuditLog.create({
          organizationId: req.user.organizationId,
          userId: req.user.id,
          action: "DRIVER_CHECK_IN",
          entity: "User",
          entityId: req.user.id,
        });
      } else audit(req.user, "DRIVER_CHECK_IN", "User", req.user.id);
      res.json({ checkedIn: true });
    },
    postDriverCheckOut: async (req, res) => {
      if (context.mongoEnabled) {
        await User.findByIdAndUpdate(req.user.id, {
          $set: { "profile.checkedIn": false },
        });
        await AuditLog.create({
          organizationId: req.user.organizationId,
          userId: req.user.id,
          action: "DRIVER_CHECK_OUT",
          entity: "User",
          entityId: req.user.id,
        });
      } else audit(req.user, "DRIVER_CHECK_OUT", "User", req.user.id);
      res.json({ checkedIn: false });
    },
    postDriverDvir: (req, res) => {
      audit(
        req.user,
        "DVIR_SUBMITTED",
        "Vehicle",
        req.body.vehicleId || "vehicle-245",
      );
      res.status(201).json({ message: "DVIR submitted." });
    },
    postDriverSos: (req, res) => {
      audit(
        req.user,
        "DRIVER_SOS",
        "Vehicle",
        req.body.vehicleId || "vehicle-245",
      );
      notify(org, "owner-1", `SOS raised by ${req.user.name}.`);
      res.status(201).json({ message: "SOS sent to fleet operations." });
    },
  };
}
