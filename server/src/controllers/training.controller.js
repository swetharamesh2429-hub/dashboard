export function createTrainingController(context) {
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
    getTrainingVr: (req, res) => {
      return res.json({
        mode: "fallback",
        available: false,
        title: "Battery diagnostics training",
        message:
          "VR hardware was not detected. Use the interactive step-by-step repair guide on this device.",
      });
    },
  };
}
