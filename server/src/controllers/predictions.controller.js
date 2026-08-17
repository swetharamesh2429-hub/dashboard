export function createPredictionsController(context) {
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
    postPredictionsAnalyze: async (req, res) => {
      const prediction = predictMaintenance(req.body.metrics || {});
      const { vehicleId } = req.body;
      if (context.mongoEnabled) {
        if (!vehicleId || !mongoose.isValidObjectId(vehicleId))
          return res
            .status(400)
            .json({ message: "A valid vehicle ID is required." });
        const vehicle = await Vehicle.findOne({
          _id: vehicleId,
          organizationId: req.user.organizationId,
        });
        if (!vehicle)
          return res.status(404).json({ message: "Vehicle not found." });
        const saved = await Prediction.create({
          organizationId: req.user.organizationId,
          vehicleId: vehicle._id,
          ...prediction,
        });
        return res
          .status(201)
          .json({
            id: String(saved._id),
            vehicleId: String(vehicle._id),
            ...prediction,
            timestamp: saved.createdAt,
          });
      }
      const saved = {
        id: `prediction-${Date.now()}`,
        organizationId: req.user.organizationId,
        vehicleId,
        ...prediction,
        timestamp: new Date().toISOString(),
      };
      records.unshift(saved);
      res.status(201).json(saved);
    },
    getPredictions: async (req, res) => {
      if (context.mongoEnabled) {
        const rows = await Prediction.find({
          organizationId: req.user.organizationId,
        })
          .sort({ createdAt: -1 })
          .limit(Math.min(Number(req.query.limit) || 50, 200))
          .lean();
        return res.json(
          rows.map((row) => ({
            id: String(row._id),
            vehicleId: String(row.vehicleId),
            fault: row.fault,
            risk: row.risk,
            rootCause: row.rootCause,
            confidence: row.confidence,
            timestamp: row.createdAt,
          })),
        );
      }
      res.json(
        scoped(records, req.user)
          .filter((item) => item.confidence)
          .slice(0, Math.min(Number(req.query.limit) || 50, 200)),
      );
    },
    getPredictionsVehicleId: async (req, res) => {
      if (context.mongoEnabled) {
        if (!mongoose.isValidObjectId(req.params.vehicleId))
          return res
            .status(400)
            .json({ message: "Invalid vehicle identifier." });
        const rows = await Prediction.find({
          organizationId: req.user.organizationId,
          vehicleId: req.params.vehicleId,
        })
          .sort({ createdAt: -1 })
          .lean();
        return res.json(
          rows.map((row) => ({
            id: String(row._id),
            vehicleId: String(row.vehicleId),
            fault: row.fault,
            risk: row.risk,
            rootCause: row.rootCause,
            confidence: row.confidence,
            timestamp: row.createdAt,
          })),
        );
      }
      res.json(
        scoped(records, req.user).filter(
          (item) => item.vehicleId === req.params.vehicleId && item.confidence,
        ),
      );
    },
  };
}
