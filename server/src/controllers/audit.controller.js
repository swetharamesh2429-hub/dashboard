export function createAuditController(context) {
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
    getAuditLogs: async (req, res) => {
      if (context.mongoEnabled) {
        const rows = await AuditLog.find({
          organizationId: req.user.organizationId,
        })
          .sort({ createdAt: -1 })
          .lean();
        return res.json(
          rows.map((row) => ({
            id: String(row._id),
            action: row.action,
            entity: row.entity,
            entityId: row.entityId,
            timestamp: row.createdAt,
            userId: String(row.userId),
          })),
        );
      }
      res.json(scoped(audits, req.user));
    },
  };
}
