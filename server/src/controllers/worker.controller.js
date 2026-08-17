export function createWorkerController(context) {
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
    postWorkerCheckIn: async (req, res) => {
      if (context.mongoEnabled) {
        await User.findByIdAndUpdate(req.user.id, {
          $set: { "profile.checkedIn": true },
        });
        await AuditLog.create({
          organizationId: req.user.organizationId,
          userId: req.user.id,
          action: "WORKER_CHECK_IN",
          entity: "User",
          entityId: req.user.id,
        });
      } else audit(req.user, "WORKER_CHECK_IN", "User", req.user.id);
      res.json({ checkedIn: true, message: "Worker attendance recorded." });
    },
  };
}
