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
  const procedureForFault = async (fault) => {
    const fallbackSteps = ["Secure vehicle and isolate power", "Inspect physical connections", "Measure the affected circuit", "Replace failed component and verify"];
    if (context.mongoEnabled) {
      const procedure = await ARProcedure.findOne({ fault: { $regex: fault, $options: "i" } }).lean();
      if (procedure) return { mode: "webxr-fallback", fault, steps: procedure.steps, modelUrl: procedure.modelUrl || null };
    }
    return { mode: "webxr-fallback", fault, steps: fallbackSteps, modelUrl: null };
  };
  return {
    getArProcedureTicket: async (req, res) => {
      let ticket;
      if (context.mongoEnabled) {
        if (!mongoose.isValidObjectId(req.params.ticketId)) return res.status(400).json({ message: "Invalid ticket identifier." });
        ticket = await RepairTicket.findOne({ _id: req.params.ticketId, organizationId: req.user.organizationId, workerId: req.user.id }).lean();
      } else ticket = scoped(tickets, req.user).find((item) => item.id === req.params.ticketId && item.workerId === req.user.id);
      if (!ticket) return res.status(404).json({ message: "Assigned ticket not found." });
      res.json(await procedureForFault(ticket.fault || ticket.issue));
    },
    getArProceduresFault: async (req, res) => {
      res.json(await procedureForFault(req.params.fault));
    },
  };
}
