export function createMaintenanceController(context) {
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
    getMaintenance: async (req, res) => {
      if (context.mongoEnabled) {
        const rows = await MaintenanceRecord.find({
          organizationId: req.user.organizationId,
        })
          .populate("vehicleId")
          .sort({ createdAt: -1 })
          .lean();
        return res.json(
          rows.map((row) => ({
            id: String(row._id),
            vehicle: row.vehicleId?.vehicleId,
            ticketId: String(row.ticketId),
            workerId: String(row.workerId),
            notes: row.notes,
            proofUrl: row.proofUrl,
            createdAt: row.createdAt,
          })),
        );
      }
      res.json(scoped(records, req.user));
    },
  };
}
