export function createArController(context) {
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
    getArProceduresFault: async (req, res) => {
      const fallbackSteps = [
        "Secure vehicle and isolate power",
        "Inspect physical connections",
        "Measure the affected circuit",
        "Replace failed component and verify",
      ];
      if (context.mongoEnabled) {
        const procedure = await ARProcedure.findOne({
          fault: { $regex: req.params.fault, $options: "i" },
        }).lean();
        if (procedure)
          return res.json({
            mode: "webxr-fallback",
            fault: req.params.fault,
            steps: procedure.steps,
            modelUrl: procedure.modelUrl || null,
          });
      }
      res.json({
        mode: "webxr-fallback",
        fault: req.params.fault,
        steps: fallbackSteps,
        modelUrl: null,
      });
    },
  };
}
