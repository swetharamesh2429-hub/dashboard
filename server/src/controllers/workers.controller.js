export function createWorkersController(context) {
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
    getWorkers: async (req, res) => {
      if (context.mongoEnabled) {
        const [workers, activeTickets] = await Promise.all([
          User.find({
            organizationId: req.user.organizationId,
            role: "WORKER",
            active: true,
          }).lean(),
          RepairTicket.find({
            organizationId: req.user.organizationId,
            status: { $ne: "COMPLETED" },
          }).lean(),
        ]);
        return res.json(
          workers.map((worker) => {
            const task = activeTickets.find(
              (ticket) => String(ticket.workerId) === String(worker._id),
            );
            return {
              id: String(worker._id),
              name: worker.name,
              status: task ? "BUSY" : "AVAILABLE",
              attendance: worker.profile?.checkedIn ? "CHECKED_IN" : "OFFLINE",
              currentTask: task ? String(task._id) : null,
            };
          }),
        );
      }
      res.json(
        users
          .filter(
            (user) =>
              user.organizationId === req.user.organizationId &&
              user.role === "WORKER" &&
              user.active,
          )
          .map((worker) => {
            const task = tickets.find(
              (ticket) =>
                ticket.workerId === worker.id && ticket.status !== "COMPLETED",
            );
            return {
              id: worker.id,
              name: worker.name,
              status: task ? "BUSY" : "AVAILABLE",
              attendance: "CHECKED_IN",
              currentTask: task?.id || null,
            };
          }),
      );
    },
  };
}
