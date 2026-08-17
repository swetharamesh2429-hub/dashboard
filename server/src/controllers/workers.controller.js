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
  const workerPayload = (worker, activeTickets) => {
    const task = activeTickets.find((ticket) => String(ticket.workerId) === String(worker._id || worker.id));
    return { id: String(worker._id || worker.id), name: worker.name, status: worker.profile?.workerStatus || worker.workerStatus || (task ? "BUSY" : "AVAILABLE"), attendance: worker.profile?.checkedIn || worker.id ? "CHECKED_IN" : "OFFLINE", currentTask: task ? String(task._id || task.id) : null };
  };
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
          workers.map((worker) => workerPayload(worker, activeTickets)),
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
          .map((worker) => workerPayload(worker, tickets.filter((ticket) => ticket.status !== "COMPLETED"))),
      );
    },
    getWorkersId: async (req, res) => {
      const activeTickets = context.mongoEnabled ? await RepairTicket.find({ organizationId: req.user.organizationId, status: { $ne: "COMPLETED" } }).lean() : scoped(tickets, req.user).filter((ticket) => ticket.status !== "COMPLETED");
      const worker = context.mongoEnabled ? await User.findOne({ _id: req.params.id, organizationId: req.user.organizationId, role: "WORKER", active: true }).lean() : users.find((item) => item.id === req.params.id && item.organizationId === req.user.organizationId && item.role === "WORKER" && item.active);
      if (!worker) return res.status(404).json({ message: "Worker not found." });
      res.json(workerPayload(worker, activeTickets));
    },
    patchWorkersIdStatus: async (req, res) => {
      const { status } = req.body;
      if (!["AVAILABLE", "BUSY", "OFFLINE"].includes(status)) return res.status(400).json({ message: "Provide AVAILABLE, BUSY, or OFFLINE status." });
      let worker;
      if (context.mongoEnabled) {
        if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid worker identifier." });
        worker = await User.findOneAndUpdate({ _id: req.params.id, organizationId: req.user.organizationId, role: "WORKER", active: true }, { $set: { "profile.workerStatus": status } }, { new: true }).lean();
      } else { worker = users.find((item) => item.id === req.params.id && item.organizationId === req.user.organizationId && item.role === "WORKER" && item.active); if (worker) worker.workerStatus = status; }
      if (!worker) return res.status(404).json({ message: "Worker not found." });
      const payload = workerPayload(worker, []);
      audit(req.user, "WORKER_STATUS_UPDATED", "User", payload.id);
      io.to(req.user.organizationId).emit("worker:updated", payload);
      res.json(payload);
    },
  };
}
